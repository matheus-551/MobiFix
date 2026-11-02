package br.com.edu.ifpe.mobifix.api.usuario.infrastructure.persistence;

import java.util.Optional;
import java.util.UUID;
import br.com.edu.ifpe.mobifix.api.usuario.application.exception.UsuarioInativoException;
import br.com.edu.ifpe.mobifix.api.usuario.application.exception.UsuarioNaoEncontradoException;
import br.com.edu.ifpe.mobifix.api.usuario.domain.model.*;
import br.com.edu.ifpe.mobifix.api.usuario.infrastructure.persistence.adapter.UsuarioPersistenceAdapter;
import br.com.edu.ifpe.mobifix.api.usuario.infrastructure.persistence.entity.UsuarioEntity;
import br.com.edu.ifpe.mobifix.api.usuario.infrastructure.persistence.repository.UsuarioJpaRepository;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class UsuarioPersistenceAdapterTest {
    private final UsuarioJpaRepository repository = mock(UsuarioJpaRepository.class);
    private final UsuarioPersistenceAdapter adapter = new UsuarioPersistenceAdapter(repository);
    private final UUID id = UUID.randomUUID();
    private UsuarioEntity entity(boolean ativo) {
        return new UsuarioEntity(id, "mock", "Ana", "Silva", "ana@example.com", "81999999999", "PE", TipoUsuario.CLIENTE, ativo);
    }
    @Test
    void edicaoAlteraApenasCamposPermitidos() {
        UsuarioEntity entity = entity(true);
        when(repository.buscarParaAlteracao("mock")).thenReturn(Optional.of(entity));
        Usuario dados = new Usuario(id, "mock", "Maria", "Souza", "fraude@example.com", "11988888888", "SP", TipoUsuario.PRESTADOR, false);
        Usuario salvo = adapter.atualizarDadosPessoais(dados);
        assertEquals("ana@example.com", salvo.email());
        assertEquals(TipoUsuario.CLIENTE, salvo.tipo());
        assertTrue(salvo.ativo());
        assertEquals("Maria", salvo.nome());
        verify(repository).flush();
        verify(repository, never()).save(any());
    }
    @Test
    void revalidaEstadoAposBloqueioContraEdicaoConcorrente() {
        when(repository.buscarParaAlteracao("mock")).thenReturn(Optional.of(entity(false)));
        Usuario dados = new Usuario(id, "mock", "Maria", "Souza", "ana@example.com", "11988888888", "SP", TipoUsuario.CLIENTE, true);
        assertThrows(UsuarioInativoException.class, () -> adapter.atualizarDadosPessoais(dados));
        verify(repository, never()).flush();
    }
    @Test
    void identificadorDivergenteNaoPodeAlterarConta() {
        when(repository.buscarParaAlteracao("mock")).thenReturn(Optional.of(entity(true)));
        Usuario dados = new Usuario(UUID.randomUUID(), "mock", "Maria", "Souza", "ana@example.com", "11988888888", "SP", TipoUsuario.CLIENTE, true);
        assertThrows(UsuarioNaoEncontradoException.class, () -> adapter.atualizarDadosPessoais(dados));
        verify(repository, never()).flush();
    }
    @Test
    void desativacaoPreservaRegistroEPodeSerRepetida() {
        UsuarioEntity entity = entity(true);
        when(repository.buscarParaAlteracao("mock")).thenReturn(Optional.of(entity));
        adapter.desativarPorFirebaseId("mock");
        adapter.desativarPorFirebaseId("mock");
        assertFalse(entity.isAtivo());
        assertEquals(id, entity.getId());
        assertEquals("ana@example.com", entity.getEmail());
        verify(repository, never()).delete(any());
        verify(repository, never()).deleteById(any());
    }
    @Test
    void desativacaoDeContaInexistenteFalha() {
        assertThrows(UsuarioNaoEncontradoException.class, () -> adapter.desativarPorFirebaseId("mock"));
        verify(repository, never()).flush();
    }
}
