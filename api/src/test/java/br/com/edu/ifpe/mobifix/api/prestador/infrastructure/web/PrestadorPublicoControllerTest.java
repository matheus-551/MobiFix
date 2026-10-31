package br.com.edu.ifpe.mobifix.api.prestador.infrastructure.web;

import java.util.List;
import java.util.UUID;
import br.com.edu.ifpe.mobifix.api.prestador.application.busca.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class PrestadorPublicoControllerTest {
    private final BuscarPrestadores caso = mock(BuscarPrestadores.class);
    private final UUID id = UUID.randomUUID();
    private final PrestadorPublico publico = new PrestadorPublico(id, "Oficina A", "Freios", "Recife", "PE",
            List.of(new PrestadorPublico.ItemCatalogo(1L, "Carro")), List.of(new PrestadorPublico.ItemCatalogo(2L, "Freios")));
    private MockMvc mvc;
    @BeforeEach
    void configurar() {
        mvc = MockMvcBuilders.standaloneSetup(new PrestadorPublicoController(caso))
                .setControllerAdvice(new PrestadorPublicoExceptionHandler()).build();
    }
    @Test
    void listaPublicaSemIdentidadeComPaginacaoPadrao() throws Exception {
        when(caso.executar(any())).thenReturn(new PaginaPrestadores(List.of(publico), 0, 20, 1, 1));
        mvc.perform(get("/api/v1/prestadores")).andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(id.toString()))
                .andExpect(jsonPath("$.page").value(0)).andExpect(jsonPath("$.size").value(20))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].email").doesNotExist())
                .andExpect(jsonPath("$.content[0].firebaseId").doesNotExist())
                .andExpect(jsonPath("$.content[0].usuarioId").doesNotExist());
        ArgumentCaptor<FiltroPrestadores> captor = ArgumentCaptor.forClass(FiltroPrestadores.class);
        verify(caso).executar(captor.capture());
        assertEquals(20, captor.getValue().size());
    }
    @Test
    void encaminhaTodosOsFiltros() throws Exception {
        when(caso.executar(any())).thenReturn(new PaginaPrestadores(List.of(), 1, 5, 0, 0));
        mvc.perform(get("/api/v1/prestadores").param("tipoVeiculoId", "1").param("especialidadeId", "2")
                .param("uf", "pe").param("cidade", "Recife").param("page", "1").param("size", "5")).andExpect(status().isOk());
        ArgumentCaptor<FiltroPrestadores> captor = ArgumentCaptor.forClass(FiltroPrestadores.class);
        verify(caso).executar(captor.capture());
        assertEquals(new FiltroPrestadores(1L, 2L, "PE", "Recife", 1, 5), captor.getValue());
    }
    @Test
    void detalheNaoExpoeDadosPrivados() throws Exception {
        when(caso.consultar(id)).thenReturn(publico);
        mvc.perform(get("/api/v1/prestadores/{id}", id)).andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Oficina A"))
                .andExpect(jsonPath("$.tiposVeiculo[0].nome").value("Carro"))
                .andExpect(jsonPath("$.email").doesNotExist()).andExpect(jsonPath("$.telefone").doesNotExist())
                .andExpect(jsonPath("$.firebaseId").doesNotExist()).andExpect(jsonPath("$.endereco").doesNotExist());
    }
    @Test
    void detalheIndisponivelRetorna404() throws Exception {
        when(caso.consultar(id)).thenThrow(new PrestadorPublicoNaoEncontradoException());
        mvc.perform(get("/api/v1/prestadores/{id}", id)).andExpect(status().isNotFound());
    }
    @ParameterizedTest
    @ValueSource(strings = {"size=101", "size=0", "page=-1", "tipoVeiculoId=-1", "especialidadeId=0", "uf=XX", "cidade=", "tipoVeiculoId=abc"})
    void filtroInvalidoRetorna400(String parametro) throws Exception {
        String[] partes = parametro.split("=", -1);
        mvc.perform(get("/api/v1/prestadores").param(partes[0], partes[1])).andExpect(status().isBadRequest());
        verifyNoInteractions(caso);
    }
    @Test
    void uuidInvalidoRetorna400() throws Exception {
        mvc.perform(get("/api/v1/prestadores/uuid-invalido")).andExpect(status().isBadRequest());
        verifyNoInteractions(caso);
    }
}
