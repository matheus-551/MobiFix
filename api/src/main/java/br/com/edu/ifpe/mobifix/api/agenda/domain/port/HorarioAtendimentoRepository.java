package br.com.edu.ifpe.mobifix.api.agenda.domain.port;

import br.com.edu.ifpe.mobifix.api.agenda.domain.model.HorarioAtendimento;
import br.com.edu.ifpe.mobifix.api.agenda.domain.model.HorarioDisponivel;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface HorarioAtendimentoRepository {

    boolean existe(UUID prestadorId, LocalDate data, LocalTime horaInicio);

    HorarioAtendimento salvar(HorarioAtendimento horario);

    Optional<HorarioAtendimento> buscarPorIdEPrestadorId(UUID id, UUID prestadorId);

    HorarioAtendimento atualizar(HorarioAtendimento horario);

    List<HorarioAtendimento> listar(UUID prestadorId, LocalDate inicio, LocalDate fim);

    List<HorarioDisponivel> listarDisponiveis(
            UUID prestadorId, LocalDate inicio, LocalDate fim, LocalDateTime agora);
}
