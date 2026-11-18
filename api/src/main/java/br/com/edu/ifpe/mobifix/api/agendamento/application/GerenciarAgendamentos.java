package br.com.edu.ifpe.mobifix.api.agendamento.application;

import br.com.edu.ifpe.mobifix.api.agendamento.application.exception.AgendamentoNaoEncontradoException;
import br.com.edu.ifpe.mobifix.api.agendamento.application.exception.ConflitoAgendamentoException;
import br.com.edu.ifpe.mobifix.api.agendamento.application.exception.RecursoAgendamentoNaoEncontradoException;
import br.com.edu.ifpe.mobifix.api.agendamento.application.exception.RegraAgendamentoException;
import br.com.edu.ifpe.mobifix.api.agendamento.application.port.ContextoAgendamento;
import br.com.edu.ifpe.mobifix.api.agendamento.domain.model.Agendamento;
import br.com.edu.ifpe.mobifix.api.agendamento.domain.model.PaginaAgendamentos;
import br.com.edu.ifpe.mobifix.api.agendamento.domain.model.StatusAgendamento;
import br.com.edu.ifpe.mobifix.api.agendamento.domain.port.AgendamentoRepository;
import br.com.edu.ifpe.mobifix.api.usuario.domain.model.TipoUsuario;
import br.com.edu.ifpe.mobifix.api.usuario.domain.model.Usuario;

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
        if (!prestador.especialidades().contains(command.especialidadeId())) {
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
}
