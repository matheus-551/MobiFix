package br.com.edu.ifpe.mobifix.api.agendamento.infrastructure.persistence.repository;

import br.com.edu.ifpe.mobifix.api.agendamento.infrastructure.persistence.entity.AgendamentoEntity;

import org.jspecify.annotations.NullMarked;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;
import java.util.UUID;

@NullMarked
public interface AgendamentoJpaRepository extends JpaRepository<AgendamentoEntity, UUID> {

    @Query(
            "select count(a) from AgendamentoEntity a where a.horario.id = :horarioId and a.status"
                + " in ('PENDENTE', 'CONFIRMADO')")
    long countByHorario_Id(@Param("horarioId") UUID horarioId);

    @Query(
            "select (count(a) > 0) from AgendamentoEntity a where a.veiculo.id = :veiculoId and"
                + " a.data = :data and a.horaInicio = :horaInicio and a.status in ('PENDENTE',"
                + " 'CONFIRMADO')")
    boolean existsByVeiculo_IdAndDataAndHoraInicio(
            @Param("veiculoId") UUID veiculoId,
            @Param("data") LocalDate data,
            @Param("horaInicio") LocalTime horaInicio);

    @Query(
            "select a from AgendamentoEntity a where a.id = :id and (a.cliente.id = :usuarioId or"
                    + " a.prestador.usuario.id = :usuarioId)")
    Optional<AgendamentoEntity> buscarDoUsuario(
            @Param("id") UUID id, @Param("usuarioId") UUID usuarioId);

    @Query(
            "select a from AgendamentoEntity a where a.cliente.id = :usuarioId or"
                    + " a.prestador.usuario.id = :usuarioId")
    Page<AgendamentoEntity> listarDoUsuario(@Param("usuarioId") UUID usuarioId, Pageable pageable);
}
