package br.com.edu.ifpe.mobifix.api.usuario.infrastructure.web;

import java.util.UUID;
import br.com.edu.ifpe.mobifix.api.usuario.application.exception.UsuarioInativoException;
import br.com.edu.ifpe.mobifix.api.usuario.application.exception.UsuarioNaoEncontradoException;
import br.com.edu.ifpe.mobifix.api.usuario.application.useCase.atualizarUsuarioAtual.*;
import br.com.edu.ifpe.mobifix.api.usuario.application.useCase.consultarUsuarioAtual.ConsultarUsuarioAtual;
import br.com.edu.ifpe.mobifix.api.usuario.application.useCase.criarUsuario.CriarUsuario;
import br.com.edu.ifpe.mobifix.api.usuario.application.useCase.desativarUsuarioAtual.DesativarUsuarioAtual;
import br.com.edu.ifpe.mobifix.api.usuario.domain.model.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class UsuarioControllerTest {
    private final CriarUsuario criar = mock(CriarUsuario.class);
    private final ConsultarUsuarioAtual consultar = mock(ConsultarUsuarioAtual.class);
    private final AtualizarUsuarioAtual atualizar = mock(AtualizarUsuarioAtual.class);
    private final DesativarUsuarioAtual desativar = mock(DesativarUsuarioAtual.class);
    private final UUID identidade = UUID.randomUUID();
    private final UUID id = UUID.randomUUID();
    private MockMvc mvc;
    private final String body = """
            {"nome":"Maria","sobrenome":"Souza","telefone":"11988888888","uf":"SP"}
            """;
    @BeforeEach
    void configurar() {
        mvc = MockMvcBuilders.standaloneSetup(new UsuarioController(criar, consultar, atualizar, desativar, identidade, null))
                .defaultRequest(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/").accept(org.springframework.http.MediaType.APPLICATION_JSON)).setControllerAdvice(new UsuarioExceptionHandler()).build();
    }
    @Test
    void putRetornaDadosAtualizadosPreservandoCamposRestritos() throws Exception {
        Usuario usuario = new Usuario(id, identidade.toString(), "Maria", "Souza", "ana@example.com", "11988888888", "SP", TipoUsuario.CLIENTE, true);
        when(atualizar.executar(eq(identidade.toString()), any())).thenReturn(usuario);
        mvc.perform(put("/api/v1/usuarios/me").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk()).andExpect(jsonPath("$.id").value(id.toString()))
                .andExpect(jsonPath("$.email").value("ana@example.com"))
                .andExpect(jsonPath("$.tipo").value("CLIENTE")).andExpect(jsonPath("$.ativo").value(true));
    }
    @Test
    void corpoIncompletoRetorna400ComCampos() throws Exception {
        mvc.perform(put("/api/v1/usuarios/me").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors").isArray());
        verifyNoInteractions(atualizar);
    }
    @Test
    void formatoInvalidoRetorna400() throws Exception {
        mvc.perform(put("/api/v1/usuarios/me").contentType(MediaType.APPLICATION_JSON)
                .content(body.replace("11988888888", "abc").replace("SP", "XX")))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(atualizar);
    }
    @Test
    void contaInativaRetorna422() throws Exception {
        when(atualizar.executar(eq(identidade.toString()), any())).thenThrow(new UsuarioInativoException());
        mvc.perform(put("/api/v1/usuarios/me").contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().is(422));
    }
    @Test
    void contaInexistenteRetorna404() throws Exception {
        doThrow(new UsuarioNaoEncontradoException()).when(desativar).executar(identidade.toString());
        mvc.perform(delete("/api/v1/usuarios/me")).andExpect(status().isNotFound());
    }
    @Test
    void deleteRetorna204SemCorpo() throws Exception {
        mvc.perform(delete("/api/v1/usuarios/me")).andExpect(status().isNoContent()).andExpect(content().string(""));
        verify(desativar).executar(identidade.toString());
    }
    @Test
    void getContinuaMostrandoContaDesativada() throws Exception {
        when(consultar.executar(identidade.toString())).thenReturn(new Usuario(id, identidade.toString(), "Ana", "Silva", "ana@example.com", "81999999999", "PE", TipoUsuario.CLIENTE, false));
        mvc.perform(get("/api/v1/usuarios/me")).andExpect(status().isOk()).andExpect(jsonPath("$.ativo").value(false));
    }
}
