package br.com.edu.ifpe.mobifix.api.agenda.infrastructure.persistence.adapter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import br.com.edu.ifpe.mobifix.api.agenda.application.exception.HorarioNaoEncontradoException;
import br.com.edu.ifpe.mobifix.api.agenda.domain.model.HorarioAtendimento;
import br.com.edu.ifpe.mobifix.api.agenda.domain.port.HorarioAtendimentoRepository;
import br.com.edu.ifpe.mobifix.api.agenda.infrastructure.persistence.entity.HorarioAtendimentoEntity;
import br.com.edu.ifpe.mobifix.api.agenda.infrastructure.persistence.repository.HorarioAtendimentoJpaRepository;
import br.com.edu.ifpe.mobifix.api.prestador.infrastructure.persistence.entity.PerfilPrestadorEntity;
import br.com.edu.ifpe.mobifix.api.usuario.domain.model.TipoUsuario;
import jakarta.persistence.EntityManager;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
@Transactional(readOnly = true)
public class HorarioAtendimentoPersistenceAdapter implements HorarioAtendimentoRepository {
    private final HorarioAtendimentoJpaRepository repository;
    private final EntityManager em;
    public HorarioAtendimentoPersistenceAdapter(HorarioAtendimentoJpaRepository repository, EntityManager em) {
        this.repository = repository; this.em = em;
    }
    @Override public boolean existe(UUID prestadorId, LocalDate data, LocalTime horaInicio) {
        return repository.existsByPrestador_IdAndDataAndHoraInicio(prestadorId, data, horaInicio);
    }
    @Override @Transactional
    public HorarioAtendimento salvar(HorarioAtendimento horario) {
        return toDomain(repository.saveAndFlush(new HorarioAtendimentoEntity(horario.id(),
                em.getReference(PerfilPrestadorEntity.class, horario.prestadorId()), horario.data(), horario.horaInicio(), horario.capacidadeTotal(), horario.bloqueado())));
    }
    @Override public Optional<HorarioAtendimento> buscarPorIdEPrestadorId(UUID id, UUID prestadorId) {
        return repository.findByIdAndPrestador_Id(id, prestadorId).map(this::toDomain);
    }
    @Override @Transactional
    public HorarioAtendimento atualizar(HorarioAtendimento horario) {
        var entity = repository.buscarParaAlteracao(horario.id(), horario.prestadorId()).orElseThrow(HorarioNaoEncontradoException::new);
        entity.atualizarDisponibilidade(horario.capacidadeTotal(), horario.bloqueado());
        repository.flush();
        return toDomain(entity);
    }
    @Override public List<HorarioAtendimento> listar(UUID prestadorId, LocalDate inicio, LocalDate fim) {
        return repository.findAllByPrestador_IdAndDataBetweenOrderByDataAscHoraInicioAsc(prestadorId, inicio, fim).stream().map(this::toDomain).toList();
    }
    @Override public List<HorarioAtendimento> listarDisponiveis(UUID prestadorId, LocalDate inicio, LocalDate fim, LocalDateTime agora) {
        return repository.listarDisponiveis(prestadorId, inicio, fim, agora.toLocalDate(), agora.toLocalTime(), TipoUsuario.PRESTADOR).stream().map(this::toDomain).toList();
    }
    private HorarioAtendimento toDomain(HorarioAtendimentoEntity entity) {
        return new HorarioAtendimento(entity.getId(), entity.getPrestador().getId(), entity.getData(), entity.getHoraInicio(), entity.getCapacidadeTotal(), entity.isBloqueado());
    }
}
