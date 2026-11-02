package br.com.edu.ifpe.mobifix.api.agenda.infrastructure.persistence.repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import br.com.edu.ifpe.mobifix.api.agenda.infrastructure.persistence.entity.HorarioAtendimentoEntity;
import br.com.edu.ifpe.mobifix.api.usuario.domain.model.TipoUsuario;
import jakarta.persistence.LockModeType;
import org.jspecify.annotations.NullMarked;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

@NullMarked
public interface HorarioAtendimentoJpaRepository extends JpaRepository<HorarioAtendimentoEntity, UUID> {
    boolean existsByPrestador_IdAndDataAndHoraInicio(UUID prestadorId, LocalDate data, LocalTime horaInicio);
    Optional<HorarioAtendimentoEntity> findByIdAndPrestador_Id(UUID id, UUID prestadorId);
    List<HorarioAtendimentoEntity> findAllByPrestador_IdAndDataBetweenOrderByDataAscHoraInicioAsc(UUID prestadorId, LocalDate inicio, LocalDate fim);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select h from HorarioAtendimentoEntity h where h.id = :id and h.prestador.id = :prestadorId")
    Optional<HorarioAtendimentoEntity> buscarParaAlteracao(@Param("id") UUID id, @Param("prestadorId") UUID prestadorId);

    @Query("""
            select h from HorarioAtendimentoEntity h join h.prestador p join p.usuario u
            where p.id = :prestadorId and u.ativo = true and u.tipo = :tipo
              and h.data between :inicio and :fim and h.bloqueado = false and h.capacidadeTotal > 0
              and (h.data > :hoje or (h.data = :hoje and h.horaInicio > :horaAtual))
            order by h.data, h.horaInicio
            """)
    List<HorarioAtendimentoEntity> listarDisponiveis(@Param("prestadorId") UUID prestadorId,
            @Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim,
            @Param("hoje") LocalDate hoje, @Param("horaAtual") LocalTime horaAtual, @Param("tipo") TipoUsuario tipo);
}
