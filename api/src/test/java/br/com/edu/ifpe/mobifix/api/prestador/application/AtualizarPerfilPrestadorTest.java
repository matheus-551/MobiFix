package br.com.edu.ifpe.mobifix.api.prestador.application;

import java.util.Set;
import java.util.UUID;

import br.com.edu.ifpe.mobifix.api.catalogo.domain.port.EspecialidadeRepository;
import br.com.edu.ifpe.mobifix.api.catalogo.domain.port.TipoVeiculoRepository;
import br.com.edu.ifpe.mobifix.api.prestador.application.exception.CadastroPrestadorInvalidoException;
import br.com.edu.ifpe.mobifix.api.prestador.application.exception.PerfilPrestadorNaoEncontradoException;
import br.com.edu.ifpe.mobifix.api.prestador.application.useCase.atualizarPerfilPrestador.AtualizarPerfilPrestador;
import br.com.edu.ifpe.mobifix.api.prestador.application.useCase.atualizarPerfilPrestador.AtualizarPerfilPrestadorCommand;
import br.com.edu.ifpe.mobifix.api.prestador.domain.model.Endereco;
import br.com.edu.ifpe.mobifix.api.prestador.domain.model.PerfilPrestador;
import br.com.edu.ifpe.mobifix.api.prestador.domain.port.PerfilPrestadorRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AtualizarPerfilPrestadorTest {
    private final ConsultarPerfilPrestadorAtual consulta = mock(ConsultarPerfilPrestadorAtual.class);
    private final PerfilPrestadorRepository perfis = mock(PerfilPrestadorRepository.class);
    private final TipoVeiculoRepository tipos = mock(TipoVeiculoRepository.class);
    private final EspecialidadeRepository especialidades = mock(EspecialidadeRepository.class);
    private final Endereco endereco = new Endereco("Rua A", "10", null, "Centro", "Recife", "PE", "50000000");
    private final PerfilPrestador atual = new PerfilPrestador(
            UUID.randomUUID(), UUID.randomUUID(), "Anterior", null, endereco, Set.of(1L, 2L), Set.of(1L, 2L)
    );
    private AtualizarPerfilPrestador caso;

    @BeforeEach
    void configurar() {
        caso = new AtualizarPerfilPrestador(consulta, perfis, tipos, especialidades);
    }

    private AtualizarPerfilPrestadorCommand command(Set<Long> idsTipos, Set<Long> idsEspecialidades) {
        return new AtualizarPerfilPrestadorCommand("Nova oficina", "Nova descricao", endereco, idsTipos, idsEspecialidades);
    }

    @Test
    void preservaIdentificadoresESubstituiSelecoes() {
        when(consulta.executar("mock")).thenReturn(atual);
        when(tipos.existemTodosPorIds(Set.of(3L))).thenReturn(true);
        when(especialidades.existemTodosPorIds(Set.of(4L))).thenReturn(true);
        when(perfis.atualizar(any())).thenAnswer(invocation -> invocation.getArgument(0));
        PerfilPrestador resultado = caso.executar("mock", command(Set.of(3L), Set.of(4L)));
        assertEquals(atual.id(), resultado.id());
        assertEquals(atual.usuarioId(), resultado.usuarioId());
        assertEquals(Set.of(3L), resultado.tiposVeiculoIds());
        assertEquals(Set.of(4L), resultado.especialidadeIds());
        assertEquals("Nova oficina", resultado.nomeFantasia());
        verify(perfis).atualizar(resultado);
        verify(perfis, never()).salvar(any());
    }

    @Test
    void naoGravaQuandoTipoNaoExiste() {
        when(consulta.executar("mock")).thenReturn(atual);
        assertThrows(CadastroPrestadorInvalidoException.class,
                () -> caso.executar("mock", command(Set.of(999L), Set.of(1L))));
        verifyNoInteractions(perfis, especialidades);
    }

    @Test
    void naoGravaQuandoEspecialidadeNaoExiste() {
        when(consulta.executar("mock")).thenReturn(atual);
        when(tipos.existemTodosPorIds(Set.of(1L))).thenReturn(true);
        assertThrows(CadastroPrestadorInvalidoException.class,
                () -> caso.executar("mock", command(Set.of(1L), Set.of(999L))));
        verifyNoInteractions(perfis);
    }

    @Test
    void naoCriaPerfilQuandoNaoExiste() {
        when(consulta.executar("mock")).thenThrow(new PerfilPrestadorNaoEncontradoException());
        assertThrows(PerfilPrestadorNaoEncontradoException.class,
                () -> caso.executar("mock", command(Set.of(1L), Set.of(1L))));
        verifyNoInteractions(perfis, tipos, especialidades);
    }

    @Test
    void naoGravaSelecaoVazia() {
        when(consulta.executar("mock")).thenReturn(atual);
        assertThrows(IllegalArgumentException.class,
                () -> caso.executar("mock", command(Set.of(), Set.of(1L))));
        verifyNoInteractions(perfis, tipos, especialidades);
    }

    @Test
    void naoGravaContaSemPermissao() {
        when(consulta.executar("mock")).thenThrow(new CadastroPrestadorInvalidoException("Conta sem permissao."));
        assertThrows(CadastroPrestadorInvalidoException.class,
                () -> caso.executar("mock", command(Set.of(1L), Set.of(1L))));
        verifyNoInteractions(perfis, tipos, especialidades);
    }
}