package br.com.edu.ifpe.mobifix.api.usuario.application;

import java.util.Optional;
import java.util.UUID;
import br.com.edu.ifpe.mobifix.api.usuario.application.exception.UsuarioInativoException;
import br.com.edu.ifpe.mobifix.api.usuario.application.exception.UsuarioJaCadastradoException;
import br.com.edu.ifpe.mobifix.api.usuario.application.exception.UsuarioNaoEncontradoException;
import br.com.edu.ifpe.mobifix.api.usuario.application.useCase.atualizarUsuarioAtual.*;
import br.com.edu.ifpe.mobifix.api.usuario.application.useCase.consultarUsuarioAtual.ConsultarUsuarioAtual;
import br.com.edu.ifpe.mobifix.api.usuario.application.useCase.criarUsuario.*;
import br.com.edu.ifpe.mobifix.api.usuario.application.useCase.desativarUsuarioAtual.DesativarUsuarioAtual;
import br.com.edu.ifpe.mobifix.api.usuario.domain.model.*;
import br.com.edu.ifpe.mobifix.api.usuario.domain.port.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class GestaoDadosUsuarioTest {
    private final UsuarioRepository repository = mock(UsuarioRepository.class);
    private final AtualizarUsuarioAtual atualizar = new AtualizarUsuarioAtual(repository);
    private Usuario conta(TipoUsuario tipo, boolean ativo) {
        return new Usuario(UUID.randomUUID(), "mock", "Ana", "Silva", "ana@example.com", "81999999999", "PE", tipo, ativo);
    }
    private AtualizarUsuarioCommand command() {
        return new AtualizarUsuarioCommand(" Maria ", " Souza ", "11988888888", "SP");
    }
    @ParameterizedTest
    @EnumSource(TipoUsuario.class)
    void editaAmbosOsPerfisPreservandoIdentidade(TipoUsuario tipo) {
        Usuario atual = conta(tipo, true);
        when(repository.buscarPorFirebaseId("mock")).thenReturn(Optional.of(atual));
        when(repository.atualizarDadosPessoais(any())).thenAnswer(invocation -> invocation.getArgument(0));
        Usuario salvo = atualizar.executar("mock", command());
        assertEquals(atual.id(), salvo.id());
        assertEquals(atual.firebaseId(), salvo.firebaseId());
        assertEquals(atual.email(), salvo.email());
        assertEquals(tipo, salvo.tipo());
        assertTrue(salvo.ativo());
        assertEquals("Maria", salvo.nome());
        assertEquals("Souza", salvo.sobrenome());
        assertEquals("11988888888", salvo.telefone());
        assertEquals("SP", salvo.uf());
        verify(repository, never()).salvar(any());
    }
    @Test
    void contaInativaNaoPodeSerEditada() {
        when(repository.buscarPorFirebaseId("mock")).thenReturn(Optional.of(conta(TipoUsuario.CLIENTE, false)));
        assertThrows(UsuarioInativoException.class, () -> atualizar.executar("mock", command()));
        verify(repository, never()).atualizarDadosPessoais(any());
    }
    @Test
    void usuarioInexistenteNaoGeraCadastro() {
        assertThrows(UsuarioNaoEncontradoException.class, () -> atualizar.executar("mock", command()));
        verify(repository, never()).atualizarDadosPessoais(any());
        verify(repository, never()).salvar(any());
    }
    @ParameterizedTest
    @ValueSource(strings = {"nome", "sobrenome", "telefone", "uf", "nomeLongo"})
    void dadosInvalidosNaoSaoGravados(String campo) {
        when(repository.buscarPorFirebaseId("mock")).thenReturn(Optional.of(conta(TipoUsuario.CLIENTE, true)));
        AtualizarUsuarioCommand invalido = new AtualizarUsuarioCommand(
                campo.equals("nome") ? " " : campo.equals("nomeLongo") ? "a".repeat(101) : "Maria",
                campo.equals("sobrenome") ? null : "Souza",
                campo.equals("telefone") ? "abc" : "11988888888",
                campo.equals("uf") ? "XX" : "SP");
        assertThrows(IllegalArgumentException.class, () -> atualizar.executar("mock", invalido));
        verify(repository, never()).atualizarDadosPessoais(any());
    }
    @Test
    void consultaContinuaDisponivelParaContaInativa() {
        Usuario inativo = conta(TipoUsuario.CLIENTE, false);
        when(repository.buscarPorFirebaseId("mock")).thenReturn(Optional.of(inativo));
        assertFalse(new ConsultarUsuarioAtual(repository).executar("mock").ativo());
    }
    @Test
    void desativacaoUsaIdentidadeAtual() {
        new DesativarUsuarioAtual(repository).executar("mock");
        verify(repository).desativarPorFirebaseId("mock");
        verify(repository, never()).salvar(any());
    }
    @Test
    void identidadeDesativadaNaoPodeSerRecadastrada() {
        when(repository.existePorFirebaseId("mock")).thenReturn(true);
        CriarUsuarioCommand cadastro = new CriarUsuarioCommand("Ana", "Silva", "outro@example.com", "81999999999", "PE", TipoUsuario.CLIENTE);
        assertThrows(UsuarioJaCadastradoException.class, () -> new CriarUsuario(repository).executar("mock", cadastro));
        verify(repository, never()).salvar(any());
    }
}
