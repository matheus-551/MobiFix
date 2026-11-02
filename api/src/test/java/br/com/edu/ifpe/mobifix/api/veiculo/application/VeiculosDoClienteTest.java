package br.com.edu.ifpe.mobifix.api.veiculo.application;

import java.time.Year;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import br.com.edu.ifpe.mobifix.api.catalogo.domain.port.TipoVeiculoRepository;
import br.com.edu.ifpe.mobifix.api.usuario.application.exception.UsuarioNaoEncontradoException;
import br.com.edu.ifpe.mobifix.api.usuario.domain.model.TipoUsuario;
import br.com.edu.ifpe.mobifix.api.usuario.domain.model.Usuario;
import br.com.edu.ifpe.mobifix.api.usuario.domain.port.UsuarioRepository;
import br.com.edu.ifpe.mobifix.api.veiculo.application.exception.OperacaoVeiculoInvalidaException;
import br.com.edu.ifpe.mobifix.api.veiculo.domain.model.Veiculo;
import br.com.edu.ifpe.mobifix.api.veiculo.domain.port.VeiculoRepository;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class VeiculosDoClienteTest {
    private final UsuarioRepository usuarios = mock(UsuarioRepository.class);
    private final TipoVeiculoRepository tipos = mock(TipoVeiculoRepository.class);
    private final VeiculoRepository veiculos = mock(VeiculoRepository.class);
    private final VeiculosDoCliente caso = new VeiculosDoCliente(usuarios, tipos, veiculos);

    private Usuario usuario(TipoUsuario tipo, boolean ativo) {
        return new Usuario(UUID.randomUUID(), "mock", "Ana", "Silva", "ana@example.com", "81999999999", "PE", tipo, ativo);
    }
    private CriarVeiculoCommand command() {
        return new CriarVeiculoCommand(1L, " Fiat ", "Uno", 2020, "abc-1234");
    }
    @Test
    void criaVeiculoVinculadoAoClienteDoMock() {
        Usuario cliente = usuario(TipoUsuario.CLIENTE, true);
        when(usuarios.buscarPorFirebaseId("mock")).thenReturn(Optional.of(cliente));
        when(tipos.existemTodosPorIds(Set.of(1L))).thenReturn(true);
        when(veiculos.salvar(any())).thenAnswer(invocation -> invocation.getArgument(0));
        Veiculo salvo = caso.criar("mock", command());
        assertNotNull(salvo.id());
        assertEquals(cliente.id(), salvo.clienteId());
        assertEquals("Fiat", salvo.marca());
        assertEquals("ABC1234", salvo.placa());
    }
    @Test
    void listaSomenteVeiculosDaContaAtual() {
        Usuario cliente = usuario(TipoUsuario.CLIENTE, true);
        when(usuarios.buscarPorFirebaseId("mock")).thenReturn(Optional.of(cliente));
        when(veiculos.listarPorClienteId(cliente.id())).thenReturn(List.of());
        assertTrue(caso.listar("mock").isEmpty());
        verify(veiculos).listarPorClienteId(cliente.id());
    }
    @Test
    void rejeitaPrestador() {
        when(usuarios.buscarPorFirebaseId("mock")).thenReturn(Optional.of(usuario(TipoUsuario.PRESTADOR, true)));
        assertThrows(OperacaoVeiculoInvalidaException.class, () -> caso.criar("mock", command()));
        verifyNoInteractions(veiculos, tipos);
    }
    @Test
    void rejeitaContaInativa() {
        when(usuarios.buscarPorFirebaseId("mock")).thenReturn(Optional.of(usuario(TipoUsuario.CLIENTE, false)));
        assertThrows(OperacaoVeiculoInvalidaException.class, () -> caso.listar("mock"));
        verifyNoInteractions(veiculos);
    }
    @Test
    void rejeitaIdentidadeSemCadastro() {
        when(usuarios.buscarPorFirebaseId("mock")).thenReturn(Optional.empty());
        assertThrows(UsuarioNaoEncontradoException.class, () -> caso.criar("mock", command()));
        verifyNoInteractions(veiculos, tipos);
    }
    @Test
    void naoSalvaTipoInexistente() {
        when(usuarios.buscarPorFirebaseId("mock")).thenReturn(Optional.of(usuario(TipoUsuario.CLIENTE, true)));
        assertThrows(OperacaoVeiculoInvalidaException.class, () -> caso.criar("mock", command()));
        verifyNoInteractions(veiculos);
    }
    @Test
    void rejeitaAnoFuturoInvalido() {
        assertThrows(IllegalArgumentException.class, () -> new Veiculo(UUID.randomUUID(), UUID.randomUUID(), 1L,
                "Fiat", "Uno", Year.now().getValue() + 2, null));
    }
    @Test
    void aceitaPlacaOpcionalEMercosul() {
        assertNull(new Veiculo(UUID.randomUUID(), UUID.randomUUID(), 1L, "Fiat", "Uno", 2020, " ").placa());
        assertEquals("ABC1D23", new Veiculo(UUID.randomUUID(), UUID.randomUUID(), 1L, "Fiat", "Uno", 2020, "abc1d23").placa());
    }
}
