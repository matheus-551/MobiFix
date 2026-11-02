package br.com.edu.ifpe.mobifix.api.veiculo.application;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import br.com.edu.ifpe.mobifix.api.catalogo.domain.port.TipoVeiculoRepository;
import br.com.edu.ifpe.mobifix.api.usuario.domain.model.TipoUsuario;
import br.com.edu.ifpe.mobifix.api.usuario.domain.model.Usuario;
import br.com.edu.ifpe.mobifix.api.usuario.domain.port.UsuarioRepository;
import br.com.edu.ifpe.mobifix.api.usuario.application.exception.UsuarioNaoEncontradoException;
import br.com.edu.ifpe.mobifix.api.veiculo.application.exception.OperacaoVeiculoInvalidaException;
import br.com.edu.ifpe.mobifix.api.veiculo.application.exception.VeiculoNaoEncontradoException;
import br.com.edu.ifpe.mobifix.api.veiculo.domain.model.Veiculo;
import br.com.edu.ifpe.mobifix.api.veiculo.domain.port.VeiculoRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class GestaoVeiculosTest {
    private final UsuarioRepository usuarios = mock(UsuarioRepository.class);
    private final TipoVeiculoRepository tipos = mock(TipoVeiculoRepository.class);
    private final VeiculoRepository veiculos = mock(VeiculoRepository.class);
    private final VeiculosDoCliente caso = new VeiculosDoCliente(usuarios, tipos, veiculos);
    private final Usuario cliente = new Usuario(UUID.randomUUID(), "mock", "Ana", "Silva", "ana@example.com", "81999999999", "PE", TipoUsuario.CLIENTE, true);
    private final Veiculo atual = new Veiculo(UUID.randomUUID(), cliente.id(), 1L, "Fiat", "Uno", 2020, "ABC1234");

    private AtualizarVeiculoCommand command() {
        return new AtualizarVeiculoCommand(2L, " Honda ", "Civic", 2022, "abc1d23");
    }
    private void conta() {
        when(usuarios.buscarPorFirebaseId("mock")).thenReturn(Optional.of(cliente));
    }
    private void encontrado() {
        conta();
        when(veiculos.buscarAtivoPorIdEClienteId(atual.id(), cliente.id())).thenReturn(Optional.of(atual));
    }
    @Test
    void consultaApenasComIdEProprietario() {
        encontrado();
        assertEquals(atual, caso.consultar("mock", atual.id()));
        verify(veiculos).buscarAtivoPorIdEClienteId(atual.id(), cliente.id());
    }
    @Test
    void inexistenteOuDeOutraContaNaoRevelaDados() {
        conta();
        when(veiculos.buscarAtivoPorIdEClienteId(atual.id(), cliente.id())).thenReturn(Optional.empty());
        assertThrows(VeiculoNaoEncontradoException.class, () -> caso.consultar("mock", atual.id()));
    }
    @Test
    void edicaoPreservaIdentidadeEProprietario() {
        encontrado();
        when(tipos.existemTodosPorIds(Set.of(2L))).thenReturn(true);
        when(veiculos.atualizar(any())).thenAnswer(invocation -> invocation.getArgument(0));
        Veiculo atualizado = caso.atualizar("mock", atual.id(), command());
        assertEquals(atual.id(), atualizado.id());
        assertEquals(cliente.id(), atualizado.clienteId());
        assertEquals(2L, atualizado.tipoVeiculoId());
        assertEquals("Honda", atualizado.marca());
        assertEquals("ABC1D23", atualizado.placa());
        verify(veiculos, never()).salvar(any());
    }
    @Test
    void tipoInexistenteNaoAlteraVeiculo() {
        encontrado();
        assertThrows(OperacaoVeiculoInvalidaException.class, () -> caso.atualizar("mock", atual.id(), command()));
        verify(veiculos, never()).atualizar(any());
    }
    @Test
    void dadosInvalidosNaoAlteraVeiculo() {
        encontrado();
        assertThrows(IllegalArgumentException.class, () -> caso.atualizar("mock", atual.id(),
                new AtualizarVeiculoCommand(2L, " ", "Civic", 2022, null)));
        verify(veiculos, never()).atualizar(any());
        verifyNoInteractions(tipos);
    }
    @Test
    void naoEditaVeiculoIndisponivel() {
        conta();
        assertThrows(VeiculoNaoEncontradoException.class, () -> caso.atualizar("mock", atual.id(), command()));
        verify(veiculos, never()).atualizar(any());
        verifyNoInteractions(tipos);
    }
    @Test
    void desativacaoUsaProprietarioDaIdentidade() {
        conta();
        caso.desativar("mock", atual.id());
        verify(veiculos).desativar(atual.id(), cliente.id());
    }
    @ParameterizedTest
    @ValueSource(strings = {"consultar", "atualizar", "desativar"})
    void rejeitaPrestador(String operacao) {
        Usuario prestador = new Usuario(cliente.id(), "mock", "Ana", "Silva", "ana@example.com", "81999999999", "PE", TipoUsuario.PRESTADOR, true);
        when(usuarios.buscarPorFirebaseId("mock")).thenReturn(Optional.of(prestador));
        assertThrows(OperacaoVeiculoInvalidaException.class, () -> executar(operacao));
        verifyNoInteractions(veiculos, tipos);
    }
    @ParameterizedTest
    @ValueSource(strings = {"consultar", "atualizar", "desativar"})
    void rejeitaClienteInativo(String operacao) {
        Usuario inativo = new Usuario(cliente.id(), "mock", "Ana", "Silva", "ana@example.com", "81999999999", "PE", TipoUsuario.CLIENTE, false);
        when(usuarios.buscarPorFirebaseId("mock")).thenReturn(Optional.of(inativo));
        assertThrows(OperacaoVeiculoInvalidaException.class, () -> executar(operacao));
        verifyNoInteractions(veiculos, tipos);
    }
    @Test
    void rejeitaIdentidadeSemConta() {
        assertThrows(UsuarioNaoEncontradoException.class, () -> caso.consultar("mock", atual.id()));
        verifyNoInteractions(veiculos, tipos);
    }
    private void executar(String operacao) {
        switch (operacao) {
            case "consultar" -> caso.consultar("mock", atual.id());
            case "atualizar" -> caso.atualizar("mock", atual.id(), command());
            case "desativar" -> caso.desativar("mock", atual.id());
            default -> throw new IllegalArgumentException(operacao);
        }
    }
}
