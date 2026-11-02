package br.com.edu.ifpe.mobifix.api.agenda.application;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import br.com.edu.ifpe.mobifix.api.agenda.application.exception.*;
import br.com.edu.ifpe.mobifix.api.agenda.domain.model.HorarioAtendimento;
import br.com.edu.ifpe.mobifix.api.agenda.domain.port.HorarioAtendimentoRepository;
import br.com.edu.ifpe.mobifix.api.prestador.application.ConsultarPerfilPrestadorAtual;

public class GerenciarAgenda {
    private final ConsultarPerfilPrestadorAtual consultarPerfil;
    private final HorarioAtendimentoRepository horarios;
    private final PrestadorAgendaConsulta prestadores;
    private final Clock clock;

    public GerenciarAgenda(ConsultarPerfilPrestadorAtual consultarPerfil, HorarioAtendimentoRepository horarios,
                          PrestadorAgendaConsulta prestadores, Clock clock) {
        this.consultarPerfil = consultarPerfil;
        this.horarios = horarios;
        this.prestadores = prestadores;
        this.clock = clock;
    }

    public HorarioAtendimento criar(String firebaseId, CriarHorarioCommand command) {
        UUID prestadorId = consultarPerfil.executar(firebaseId).id();
        HorarioAtendimento horario = new HorarioAtendimento(UUID.randomUUID(), prestadorId,
                command.data(), command.horaInicio(), command.capacidadeTotal(), false);
        validarFuturo(horario);
        if (horarios.existe(prestadorId, horario.data(), horario.horaInicio())) throw new HorarioDuplicadoException();
        return horarios.salvar(horario);
    }

    public HorarioAtendimento atualizar(String firebaseId, UUID id, AtualizarHorarioCommand command) {
        UUID prestadorId = consultarPerfil.executar(firebaseId).id();
        HorarioAtendimento atual = horarios.buscarPorIdEPrestadorId(id, prestadorId).orElseThrow(HorarioNaoEncontradoException::new);
        validarFuturo(atual);
        return horarios.atualizar(new HorarioAtendimento(atual.id(), atual.prestadorId(), atual.data(), atual.horaInicio(),
                command.capacidadeTotal(), command.bloqueado()));
    }

    public List<HorarioAtendimento> listarMeus(String firebaseId, LocalDate inicio, LocalDate fim) {
        UUID prestadorId = consultarPerfil.executar(firebaseId).id();
        PeriodoAgenda periodo = periodo(inicio, fim);
        return horarios.listar(prestadorId, periodo.inicio(), periodo.fim());
    }

    public List<HorarioAtendimento> listarPublicos(UUID prestadorId, LocalDate inicio, LocalDate fim) {
        if (!prestadores.estaDisponivel(prestadorId)) throw new HorarioNaoEncontradoException();
        PeriodoAgenda periodo = periodo(inicio, fim);
        return horarios.listarDisponiveis(prestadorId, periodo.inicio(), periodo.fim(), LocalDateTime.now(clock));
    }

    private PeriodoAgenda periodo(LocalDate inicio, LocalDate fim) {
        LocalDate dataInicial = inicio == null ? LocalDate.now(clock) : inicio;
        return new PeriodoAgenda(dataInicial, fim == null ? dataInicial.plusDays(30) : fim);
    }

    private void validarFuturo(HorarioAtendimento horario) {
        if (!LocalDateTime.of(horario.data(), horario.horaInicio()).isAfter(LocalDateTime.now(clock))) {
            throw new RegraAgendaException("O horário precisa estar no futuro, no fuso America/Sao_Paulo.");
        }
    }
}
