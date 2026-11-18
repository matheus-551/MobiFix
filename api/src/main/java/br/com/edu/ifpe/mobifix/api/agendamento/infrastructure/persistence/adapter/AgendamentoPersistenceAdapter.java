package br.com.edu.ifpe.mobifix.api.agendamento.infrastructure.persistence.adapter;

import br.com.edu.ifpe.mobifix.api.agenda.infrastructure.persistence.entity.HorarioAtendimentoEntity;
import br.com.edu.ifpe.mobifix.api.agendamento.domain.model.Agendamento;
import br.com.edu.ifpe.mobifix.api.agendamento.domain.model.PaginaAgendamentos;
import br.com.edu.ifpe.mobifix.api.agendamento.domain.port.AgendamentoRepository;
import br.com.edu.ifpe.mobifix.api.agendamento.infrastructure.persistence.entity.AgendamentoEntity;
import br.com.edu.ifpe.mobifix.api.agendamento.infrastructure.persistence.repository.AgendamentoJpaRepository;
import br.com.edu.ifpe.mobifix.api.catalogo.infrastructure.persistence.entity.EspecialidadeEntity;
import br.com.edu.ifpe.mobifix.api.prestador.infrastructure.persistence.entity.PerfilPrestadorEntity;
import br.com.edu.ifpe.mobifix.api.usuario.infrastructure.persistence.entity.UsuarioEntity;
import br.com.edu.ifpe.mobifix.api.veiculo.infrastructure.persistence.entity.VeiculoEntity;

import jakarta.persistence.EntityManager;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;
import java.util.UUID;

@Repository
@Transactional(propagation = Propagation.MANDATORY)
public class AgendamentoPersistenceAdapter implements AgendamentoRepository {

    private final AgendamentoJpaRepository repository;

    private final EntityManager entityManager;

    public AgendamentoPersistenceAdapter(
            AgendamentoJpaRepository repository, EntityManager entityManager) {
        this.repository = repository;
        this.entityManager = entityManager;
    }

    @Override
    public long contarReservas(UUID id) {
        return repository.countByHorario_Id(id);
    }

    @Override
    public boolean veiculoReservado(UUID id, LocalDate data, LocalTime hora) {
        return repository.existsByVeiculo_IdAndDataAndHoraInicio(id, data, hora);
    }

    @Override
    public Agendamento salvar(Agendamento agendamento) {
        return toDomain(
                repository.saveAndFlush(
                        new AgendamentoEntity(
                                agendamento.id(),
                                entityManager.getReference(
                                        UsuarioEntity.class, agendamento.clienteId()),
                                entityManager.getReference(
                                        PerfilPrestadorEntity.class, agendamento.prestadorId()),
                                entityManager.getReference(
                                        VeiculoEntity.class, agendamento.veiculoId()),
                                entityManager.getReference(
                                        HorarioAtendimentoEntity.class, agendamento.horarioId()),
                                entityManager.getReference(
                                        EspecialidadeEntity.class, agendamento.especialidadeId()),
                                agendamento.data(),
                                agendamento.horaInicio(),
                                agendamento.status(),
                                agendamento.criadoEm())));
    }

    @Override
    public Optional<Agendamento> buscarDoUsuario(UUID id, UUID usuarioId) {
        return repository.buscarDoUsuario(id, usuarioId).map(this::toDomain);
    }

    @Override
    public PaginaAgendamentos listarDoUsuario(UUID usuarioId, int page, int size) {
        var pagina =
                repository.listarDoUsuario(
                        usuarioId, PageRequest.of(page, size, Sort.by("data", "horaInicio", "id")));

        return new PaginaAgendamentos(
                pagina.getContent().stream().map(this::toDomain).toList(),
                page,
                size,
                pagina.getTotalElements(),
                pagina.getTotalPages());
    }

    private Agendamento toDomain(AgendamentoEntity agendamento) {
        return new Agendamento(
                agendamento.getId(),
                agendamento.getCliente().getId(),
                agendamento.getPrestador().getId(),
                agendamento.getVeiculo().getId(),
                agendamento.getHorario().getId(),
                agendamento.getEspecialidade().getId(),
                agendamento.getData(),
                agendamento.getHoraInicio(),
                agendamento.getStatus(),
                agendamento.getCriadoEm());
    }
}
