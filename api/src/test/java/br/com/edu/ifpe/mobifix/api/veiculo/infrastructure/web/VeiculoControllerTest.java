package br.com.edu.ifpe.mobifix.api.veiculo.infrastructure.web;

import java.util.List;
import java.util.UUID;
import br.com.edu.ifpe.mobifix.api.veiculo.application.VeiculosDoCliente;
import br.com.edu.ifpe.mobifix.api.veiculo.application.exception.OperacaoVeiculoInvalidaException;
import br.com.edu.ifpe.mobifix.api.veiculo.application.exception.VeiculoNaoEncontradoException;
import br.com.edu.ifpe.mobifix.api.veiculo.domain.model.Veiculo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class VeiculoControllerTest {
    private final VeiculosDoCliente caso = mock(VeiculosDoCliente.class);
    private final UUID identidade = UUID.randomUUID();
    private final UUID id = UUID.randomUUID();
    private final Veiculo veiculo = new Veiculo(id, UUID.randomUUID(), 1L, "Fiat", "Uno", 2020, "ABC1234");
    private MockMvc mvc;
    private final String body = """
            {"tipoVeiculoId":1,"marca":"Fiat","modelo":"Uno","ano":2020,"placa":"ABC1234"}
            """;
    @BeforeEach
    void configurar() {
        mvc = MockMvcBuilders.standaloneSetup(new VeiculoController(caso, identidade, null))
                .defaultRequest(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/").accept(org.springframework.http.MediaType.APPLICATION_JSON)).setControllerAdvice(new VeiculoExceptionHandler()).build();
    }
    @Test
    void consultaPorUuid() throws Exception {
        when(caso.consultar(identidade.toString(), id)).thenReturn(veiculo);
        mvc.perform(get("/api/v1/veiculos/{id}", id)).andExpect(status().isOk()).andExpect(jsonPath("$.id").value(id.toString()));
    }
    @Test
    void editaRetornando200() throws Exception {
        when(caso.atualizar(eq(identidade.toString()), eq(id), any())).thenReturn(veiculo);
        mvc.perform(put("/api/v1/veiculos/{id}", id).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk()).andExpect(jsonPath("$.id").value(id.toString()));
    }
    @Test
    void deleteRetorna204SemCorpo() throws Exception {
        mvc.perform(delete("/api/v1/veiculos/{id}", id)).andExpect(status().isNoContent()).andExpect(content().string(""));
        verify(caso).desativar(identidade.toString(), id);
    }
    @Test
    void dadosInvalidosNaoChegamAoCasoDeUso() throws Exception {
        mvc.perform(put("/api/v1/veiculos/{id}", id).contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(caso);
    }
    @Test
    void uuidInvalidoRetorna400() throws Exception {
        mvc.perform(get("/api/v1/veiculos/nao-e-uuid")).andExpect(status().isBadRequest());
        verifyNoInteractions(caso);
    }
    @Test
    void naoEncontradoRetorna404() throws Exception {
        when(caso.consultar(identidade.toString(), id)).thenThrow(new VeiculoNaoEncontradoException());
        mvc.perform(get("/api/v1/veiculos/{id}", id)).andExpect(status().isNotFound());
    }
    @Test
    void tipoInexistenteRetorna422() throws Exception {
        when(caso.atualizar(eq(identidade.toString()), eq(id), any())).thenThrow(new OperacaoVeiculoInvalidaException("Tipo inexistente."));
        mvc.perform(put("/api/v1/veiculos/{id}", id).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().is(422));
    }
    @Test
    void rotaMeContinuaFuncionando() throws Exception {
        when(caso.listar(identidade.toString())).thenReturn(List.of(veiculo));
        mvc.perform(get("/api/v1/veiculos/me")).andExpect(status().isOk()).andExpect(jsonPath("$[0].id").value(id.toString()));
    }
}
