package br.com.edu.ifpe.mobifix.api.agendamento.infrastructure.persistence.adapter;

import br.com.edu.ifpe.mobifix.api.agenda.domain.model.HorarioAtendimento;
import br.com.edu.ifpe.mobifix.api.agenda.infrastructure.persistence.entity.HorarioAtendimentoEntity;
import br.com.edu.ifpe.mobifix.api.agendamento.application.exception.RecursoAgendamentoNaoEncontradoException;
import br.com.edu.ifpe.mobifix.api.agendamento.application.port.ContextoAgendamento;
import br.com.edu.ifpe.mobifix.api.prestador.infrastructure.persistence.entity.PerfilPrestadorEntity;
import br.com.edu.ifpe.mobifix.api.usuario.domain.model.Usuario;
import br.com.edu.ifpe.mobifix.api.usuario.infrastructure.persistence.entity.UsuarioEntity;
import br.com.edu.ifpe.mobifix.api.usuario.infrastructure.persistence.repository.UsuarioJpaRepository;
import br.com.edu.ifpe.mobifix.api.veiculo.domain.model.Veiculo;
import br.com.edu.ifpe.mobifix.api.veiculo.infrastructure.persistence.entity.VeiculoEntity;
import br.com.edu.ifpe.mobifix.api.veiculo.infrastructure.persistence.repository.VeiculoJpaRepository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;

import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
@Transactional(propagation = Propagation.MANDATORY)
public class ContextoAgendamentoJpaAdapter implements ContextoAgendamento {

    private final UsuarioJpaRepository usuarios;

    private final VeiculoJpaRepository veiculos;

    private final EntityManager entityManager;

    public ContextoAgendamentoJpaAdapter(
            UsuarioJpaRepository usuarios,
            VeiculoJpaRepository veiculos,
            EntityManager entityManager) {
        this.usuarios = usuarios;
        this.veiculos = veiculos;
        this.entityManager = entityManager;
    }

    @Override
    public Usuario usuarioAtual(String firebaseId) {
        return usuario(
                usuarios.findByFirebaseId(firebaseId)
                        .orElseThrow(() ->
                                new RecursoAgendamentoNaoEncontradoException(
                                        "Usuário não encontrado.")));
    }

    @Override
    public Usuario clienteParaReserva(String firebaseId) {
        return usuario(
                usuarios.buscarParaAlteracao(firebaseId)
                        .orElseThrow(() ->
                                new RecursoAgendamentoNaoEncontradoException(
                                        "Usuário não encontrado.")));
    }

    @Override
    public Optional<Veiculo> veiculoParaReserva(UUID id, UUID clienteId) {
        return veiculos.buscarAtivoParaAlteracao(id, clienteId)
                .map(veiculo ->
                        new Veiculo(
                                veiculo.getId(),
                                veiculo.getCliente().getId(),
                                veiculo.getTipoVeiculo().getId(),
                                veiculo.getMarca(),
                                veiculo.getModelo(),
                                veiculo.getAno(),
                                veiculo.getPlaca()));
    }

    @Override
    public Optional<HorarioAtendimento> horarioParaReserva(UUID id) {
        var horario =
                entityManager.find(
                        HorarioAtendimentoEntity.class, id, LockModeType.PESSIMISTIC_WRITE);

        return horario == null
                ? Optional.empty()
                : Optional.of(
                        new HorarioAtendimento(
                                horario.getId(),
                                horario.getPrestador().getId(),
                                horario.getData(),
                                horario.getHoraInicio(),
                                horario.getCapacidadeTotal(),
                                horario.isBloqueado()));
    }

    @Override
    public Prestador consultarPrestador(UUID id) {
        var perfil = entityManager.find(PerfilPrestadorEntity.class, id);

        if (perfil == null) {
            throw new RecursoAgendamentoNaoEncontradoException("Prestador não encontrado.");
        }

        var usuario =
                entityManager.find(
                        UsuarioEntity.class,
                        perfil.getUsuario().getId(),
                        LockModeType.PESSIMISTIC_READ);

        return new Prestador(
                usuario.isAtivo(),
                usuario.getTipo(),
                perfil.getTiposVeiculo().stream()
                        .map(tipoVeiculo -> tipoVeiculo.getId())
                        .collect(Collectors.toSet()),
                perfil.getEspecialidades().stream()
                        .map(especialidade -> especialidade.getId())
                        .collect(Collectors.toSet()));
    }

    private Usuario usuario(UsuarioEntity usuario) {
        return new Usuario(
                usuario.getId(),
                usuario.getFirebaseId(),
                usuario.getNome(),
                usuario.getSobrenome(),
                usuario.getEmail(),
                usuario.getTelefone(),
                usuario.getUf(),
                usuario.getTipo(),
                usuario.isAtivo());
    }

    @Override
    public void bloquearVeiculo(UUID id) {
        var veiculo = entityManager.find(VeiculoEntity.class, id, LockModeType.PESSIMISTIC_WRITE);

        if (veiculo == null) {
            throw new RecursoAgendamentoNaoEncontradoException("Veículo não encontrado.");
        }
    }

    @Override
    public HorarioAtendimento bloquearHorariosParaRemarcacao(UUID origem, UUID destino) {
        // Toda remarcação adquire os horários na mesma ordem, mesmo em trocas opostas.
        if (origem.compareTo(destino) < 0) {
            horarioObrigatorio(origem);
            return horarioObrigatorio(destino);
        }

        var novoHorario = horarioObrigatorio(destino);

        if (!origem.equals(destino)) {
            horarioObrigatorio(origem);
        }

        return novoHorario;
    }

    private HorarioAtendimento horarioObrigatorio(UUID id) {
        return horarioParaReserva(id)
                .orElseThrow(() ->
                        new RecursoAgendamentoNaoEncontradoException("Horário não encontrado."));
    }
}
