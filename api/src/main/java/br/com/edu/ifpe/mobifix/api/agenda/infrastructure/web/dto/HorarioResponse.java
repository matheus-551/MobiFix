package br.com.edu.ifpe.mobifix.api.agenda.infrastructure.web.dto;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;
@org.springframework.hateoas.server.core.Relation(value = "horario", collectionRelation = "horarios")
public record HorarioResponse(UUID id, UUID prestadorId, LocalDate data, LocalTime horaInicio, int capacidadeTotal, boolean bloqueado) {
}
