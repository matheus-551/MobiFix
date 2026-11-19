package br.com.edu.ifpe.mobifix.api.agendamento.application;

import br.com.edu.ifpe.mobifix.api.agenda.domain.model.HorarioAtendimento;
import br.com.edu.ifpe.mobifix.api.agendamento.application.exception.AgendamentoNaoEncontradoException;
import br.com.edu.ifpe.mobifix.api.agendamento.application.exception.ConflitoAgendamentoException;
import br.com.edu.ifpe.mobifix.api.agendamento.application.exception.PermissaoAgendamentoException;
import br.com.edu.ifpe.mobifix.api.agendamento.application.exception.RecursoAgendamentoNaoEncontradoException;
import br.com.edu.ifpe.mobifix.api.agendamento.application.exception.RegraAgendamentoException;
import br.com.edu.ifpe.mobifix.api.agendamento.application.port.ContextoAgendamento;
import br.com.edu.ifpe.mobifix.api.agendamento.domain.model.Agendamento;
import br.com.edu.ifpe.mobifix.api.agendamento.domain.model.PaginaAgendamentos;
import br.com.edu.ifpe.mobifix.api.agendamento.domain.model.StatusAgendamento;
import br.com.edu.ifpe.mobifix.api.agendamento.domain.port.AgendamentoRepository;
import br.com.edu.ifpe.mobifix.api.usuario.domain.model.TipoUsuario;
import br.com.edu.ifpe.mobifix.api.usuario.domain.model.Usuario;
import br.com.edu.ifpe.mobifix.api.veiculo.domain.model.Veiculo;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.UUID;

/** Regras independentes do Spring. O adapter transacional mantém os bloqueios até o commit. */
public class GerenciarAgendamentos implements Agendamentos {

    private final ContextoAgendamento contexto;

    private final AgendamentoRepository agendamentos;

    private final Clock clock;

    public GerenciarAgendamentos(
            ContextoAgendamento contexto, AgendamentoRepository agendamentos, Clock clock) {
        this.contexto = contexto;
        this.agendamentos = agendamentos;
        this.clock = clock;
    }

    @Override
    public Agendamento criar(String firebaseId, CriarAgendamentoCommand command) {
        Usuario cliente = validarAtivo(contexto.clienteParaReserva(firebaseId));

        if (cliente.tipo() != TipoUsuario.CLIENTE) {
            throw new RegraAgendamentoException("Somente clientes podem criar agendamentos.");
        }
        // Ordem de bloqueio compartilhada por todas as reservas: cliente, veículo, horário.
        var veiculo =
                contexto.veiculoParaReserva(command.veiculoId(), cliente.id())
                        .orElseThrow(() ->
                                new RecursoAgendamentoNaoEncontradoException(
                                        "Veículo não encontrado."));
        var horario =
                contexto.horarioParaReserva(command.horarioId())
                        .orElseThrow(() ->
                                new RecursoAgendamentoNaoEncontradoException(
                                        "Horário não encontrado."));

        validarDisponibilidade(veiculo, horario, command.especialidadeId());

        return agendamentos.salvar(
                new Agendamento(
                        UUID.randomUUID(),
                        cliente.id(),
                        horario.prestadorId(),
                        veiculo.id(),
                        horario.id(),
                        command.especialidadeId(),
                        horario.data(),
                        horario.horaInicio(),
                        StatusAgendamento.PENDENTE,
                        clock.instant()));
    }

    @Override
    public Agendamento consultar(String firebaseId, UUID id) {
        var usuario = validarAtivo(contexto.usuarioAtual(firebaseId));

        return agendamentos
                .buscarDoUsuario(id, usuario.id())
                .orElseThrow(AgendamentoNaoEncontradoException::new);
    }

    @Override
    public PaginaAgendamentos listarMeus(String firebaseId, int page, int size) {
        if (page < 0 || size < 1 || size > 100 || (long) page * size > Integer.MAX_VALUE) {
            throw new IllegalArgumentException(
                    "Página deve ser não negativa e tamanho deve estar entre 1 e 100, dentro do"
                            + " limite de paginação.");
        }

        var usuario = validarAtivo(contexto.usuarioAtual(firebaseId));

        return agendamentos.listarDoUsuario(usuario.id(), page, size);
    }

    private Usuario validarAtivo(Usuario usuario) {
        if (!usuario.ativo()) {
            throw new RegraAgendamentoException("A conta está desativada.");
        }

        return usuario;
    }

    @Override
    public Agendamento confirmar(String firebaseId, UUID id) {
        return alterarStatus(firebaseId, id, StatusAgendamento.CONFIRMADO);
    }

    @Override
    public Agendamento cancelar(String firebaseId, UUID id) {
        return alterarStatus(firebaseId, id, StatusAgendamento.CANCELADO);
    }

    @Override
    public Agendamento concluir(String firebaseId, UUID id) {
        return alterarStatus(firebaseId, id, StatusAgendamento.CONCLUIDO);
    }

    private Agendamento alterarStatus(String firebaseId, UUID id, StatusAgendamento destino) {
        var usuario = validarAtivo(contexto.usuarioAtual(firebaseId));
        var referencia =
                agendamentos
                        .buscarDoUsuario(id, usuario.id())
                        .orElseThrow(AgendamentoNaoEncontradoException::new);

        if (destino != StatusAgendamento.CANCELADO && usuario.tipo() != TipoUsuario.PRESTADOR) {
            throw new PermissaoAgendamentoException();
        }

        // O veículo serializa alterações. O registro recarregado fornece o horário atual.
        contexto.bloquearVeiculo(referencia.veiculoId());
        var atual = agendamentos.bloquear(id).orElseThrow(AgendamentoNaoEncontradoException::new);
        contexto.horarioParaReserva(atual.horarioId())
                .orElseThrow(() ->
                        new RecursoAgendamentoNaoEncontradoException("Horário não encontrado."));
        boolean pendente = atual.status() == StatusAgendamento.PENDENTE;
        boolean confirmado = atual.status() == StatusAgendamento.CONFIRMADO;
        boolean transicaoValida =
                switch (destino) {
                    case CONFIRMADO -> pendente;
                    case CANCELADO -> pendente || confirmado;
                    case CONCLUIDO -> confirmado;
                    default -> false;
                };

        if (!transicaoValida) {
            throw new ConflitoAgendamentoException(
                    "A ação não é permitida para o estado atual do agendamento.");
        }

        boolean futuro =
                LocalDateTime.of(atual.data(), atual.horaInicio())
                        .isAfter(LocalDateTime.now(clock));

        if (destino == StatusAgendamento.CONCLUIDO && futuro) {
            throw new RegraAgendamentoException(
                    "O agendamento só pode ser concluído a partir do horário de início.");
        }

        if (destino != StatusAgendamento.CONCLUIDO && !futuro) {
            throw new RegraAgendamentoException(
                    "Confirmação e cancelamento são permitidos somente antes do horário de"
                            + " início.");
        }

        return agendamentos.atualizar(
                atual.registrarStatus(destino, usuario.id(), clock.instant()));
    }

    @Override
    public Agendamento remarcar(String firebaseId, UUID id, UUID horarioId) {
        if (horarioId == null) {
            throw new IllegalArgumentException("Informe o novo horário.");
        }

        var cliente = validarAtivo(contexto.clienteParaReserva(firebaseId));
        var referencia =
                agendamentos
                        .buscarDoUsuario(id, cliente.id())
                        .orElseThrow(AgendamentoNaoEncontradoException::new);

        if (cliente.tipo() != TipoUsuario.CLIENTE || !referencia.clienteId().equals(cliente.id())) {
            throw new PermissaoAgendamentoException(
                    "Somente o cliente responsável pode remarcar o agendamento.");
        }

        var veiculo =
                contexto.veiculoParaReserva(referencia.veiculoId(), cliente.id())
                        .orElseThrow(() ->
                                new RecursoAgendamentoNaoEncontradoException(
                                        "Veículo não encontrado."));
        var atual = agendamentos.bloquear(id).orElseThrow(AgendamentoNaoEncontradoException::new);

        if (atual.status() != StatusAgendamento.PENDENTE) {
            throw new ConflitoAgendamentoException(
                    "Somente agendamentos pendentes podem ser remarcados.");
        }

        var destino = contexto.bloquearHorariosParaRemarcacao(atual.horarioId(), horarioId);

        if (!LocalDateTime.of(atual.data(), atual.horaInicio()).isAfter(LocalDateTime.now(clock))) {
            throw new RegraAgendamentoException(
                    "O agendamento só pode ser remarcado antes do início.");
        }

        // Repetir o destino atual não altera a reserva, a ocupação nem a auditoria.
        if (atual.horarioId().equals(horarioId)) {
            return atual;
        }

        if (!destino.prestadorId().equals(atual.prestadorId())) {
            throw new RegraAgendamentoException(
                    "O novo horário deve pertencer ao mesmo prestador.");
        }

        validarDisponibilidade(veiculo, destino, atual.especialidadeId());

        return agendamentos.atualizar(
                atual.remarcar(
                        destino.id(),
                        destino.data(),
                        destino.horaInicio(),
                        cliente.id(),
                        clock.instant()));
    }

    private void validarDisponibilidade(
            Veiculo veiculo, HorarioAtendimento horario, Long especialidadeId) {
        if (!LocalDateTime.of(horario.data(), horario.horaInicio())
                .isAfter(LocalDateTime.now(clock))) {
            throw new RegraAgendamentoException(
                    "O horário precisa estar no futuro, no fuso America/Sao_Paulo.");
        }
        if (horario.bloqueado()) {
            throw new RegraAgendamentoException("O horário está bloqueado para novas reservas.");
        }

        var prestador = contexto.consultarPrestador(horario.prestadorId());

        if (!prestador.ativo() || prestador.tipo() != TipoUsuario.PRESTADOR) {
            throw new RegraAgendamentoException(
                    "O prestador não está disponível para novos agendamentos.");
        }
        if (!prestador.tiposVeiculo().contains(veiculo.tipoVeiculoId())) {
            throw new RegraAgendamentoException("O prestador não atende o tipo deste veículo.");
        }
        if (!prestador.especialidades().contains(especialidadeId)) {
            throw new RegraAgendamentoException(
                    "O prestador não atende a especialidade solicitada.");
        }
        if (agendamentos.veiculoReservado(veiculo.id(), horario.data(), horario.horaInicio())) {
            throw new ConflitoAgendamentoException(
                    "Este veículo já possui um agendamento neste dia e horário.");
        }
        if (agendamentos.contarReservas(horario.id()) >= horario.capacidadeTotal()) {
            throw new ConflitoAgendamentoException("Não há vagas disponíveis neste horário.");
        }
    }
}
