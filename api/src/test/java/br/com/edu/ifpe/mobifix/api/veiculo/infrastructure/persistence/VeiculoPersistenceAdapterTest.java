package br.com.edu.ifpe.mobifix.api.veiculo.infrastructure.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import br.com.edu.ifpe.mobifix.api.catalogo.infrastructure.persistence.entity.TipoVeiculoEntity;
import br.com.edu.ifpe.mobifix.api.usuario.infrastructure.persistence.entity.UsuarioEntity;
import br.com.edu.ifpe.mobifix.api.veiculo.application.exception.VeiculoNaoEncontradoException;
import br.com.edu.ifpe.mobifix.api.veiculo.domain.model.Veiculo;
import br.com.edu.ifpe.mobifix.api.veiculo.infrastructure.persistence.adapter.VeiculoPersistenceAdapter;
import br.com.edu.ifpe.mobifix.api.veiculo.infrastructure.persistence.entity.VeiculoEntity;
import br.com.edu.ifpe.mobifix.api.veiculo.infrastructure.persistence.repository.VeiculoJpaRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class VeiculoPersistenceAdapterTest {
    private final VeiculoJpaRepository repository = mock(VeiculoJpaRepository.class);
    private final EntityManager entityManager = mock(EntityManager.class);
    private final VeiculoPersistenceAdapter adapter = new VeiculoPersistenceAdapter(repository, entityManager);
    private final UUID id = UUID.randomUUID();
    private final UUID clienteId = UUID.randomUUID();

    @Test
    void desativaSemExcluirRegistro() {
        VeiculoEntity entity = new VeiculoEntity(id, mock(UsuarioEntity.class), mock(TipoVeiculoEntity.class), "Fiat", "Uno", 2020, null);
        assertTrue(entity.isAtivo());
        when(repository.buscarAtivoParaAlteracao(id, clienteId)).thenReturn(Optional.of(entity));
        adapter.desativar(id, clienteId);
        assertFalse(entity.isAtivo());
        verify(repository).flush();
        verify(repository, never()).delete(any());
        verify(repository, never()).deleteById(any());
    }
    @Test
    void naoDesativaRegistroForaDoEscopo() {
        assertThrows(VeiculoNaoEncontradoException.class, () -> adapter.desativar(id, clienteId));
        verify(repository, never()).flush();
    }
    @Test
    void edicaoNaoRecriaRegistroDesativadoOuRemovido() {
        Veiculo dados = new Veiculo(id, clienteId, 1L, "Fiat", "Uno", 2020, null);
        assertThrows(VeiculoNaoEncontradoException.class, () -> adapter.atualizar(dados));
        verify(repository, never()).save(any());
        verify(repository, never()).saveAndFlush(any());
        verify(repository, never()).flush();
        verifyNoInteractions(entityManager);
    }
    @Test
    void listagemUsaFiltroDeAtivosEProprietario() {
        when(repository.findAllByCliente_IdAndAtivoTrueOrderByMarcaAscModeloAsc(clienteId)).thenReturn(List.of());
        assertTrue(adapter.listarPorClienteId(clienteId).isEmpty());
        verify(repository).findAllByCliente_IdAndAtivoTrueOrderByMarcaAscModeloAsc(clienteId);
    }
    @Test
    void atualizaEntidadeGerenciadaSemTrocarProprietario() {
        UsuarioEntity cliente = mock(UsuarioEntity.class);
        when(cliente.getId()).thenReturn(clienteId);
        TipoVeiculoEntity tipo = mock(TipoVeiculoEntity.class);
        when(tipo.getId()).thenReturn(2L);
        VeiculoEntity entity = new VeiculoEntity(id, cliente, mock(TipoVeiculoEntity.class), "Fiat", "Uno", 2020, null);
        when(repository.buscarAtivoParaAlteracao(id, clienteId)).thenReturn(Optional.of(entity));
        when(entityManager.getReference(TipoVeiculoEntity.class, 2L)).thenReturn(tipo);
        Veiculo atualizado = adapter.atualizar(new Veiculo(id, clienteId, 2L, "Honda", "Civic", 2022, "ABC1D23"));
        assertEquals(id, atualizado.id());
        assertEquals(clienteId, atualizado.clienteId());
        assertSame(cliente, entity.getCliente());
        assertEquals("Honda", entity.getMarca());
        assertTrue(entity.isAtivo());
        verify(repository).flush();
        verify(repository, never()).save(any());
    }
}
