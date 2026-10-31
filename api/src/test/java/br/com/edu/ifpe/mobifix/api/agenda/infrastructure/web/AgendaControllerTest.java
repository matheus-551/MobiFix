package br.com.edu.ifpe.mobifix.api.agenda.infrastructure.web;

import java.time.*;
import java.util.*;
import br.com.edu.ifpe.mobifix.api.agenda.application.*;
import br.com.edu.ifpe.mobifix.api.agenda.application.exception.*;
import br.com.edu.ifpe.mobifix.api.agenda.domain.model.HorarioAtendimento;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AgendaControllerTest {
    private final GerenciarAgenda agenda = mock(GerenciarAgenda.class);
    private final UUID identidade = UUID.randomUUID(), prestador = UUID.randomUUID(), id = UUID.randomUUID();
    private final HorarioAtendimento horario = new HorarioAtendimento(id, prestador, LocalDate.of(2030, 1, 2), LocalTime.of(8, 30), 3, false);
    private final String rota = "/api/v1/prestadores/me/horarios";
    private MockMvc mvc;
    @BeforeEach
    void configurar() {
        mvc = MockMvcBuilders.standaloneSetup(new AgendaPrestadorController(agenda, identidade), new AgendaPublicaController(agenda))
                .setControllerAdvice(new AgendaExceptionHandler()).build();
    }
    @Test
    void criaRetornando201() throws Exception {
        when(agenda.criar(eq(identidade.toString()), any())).thenReturn(horario);
        mvc.perform(post(rota).contentType(MediaType.APPLICATION_JSON).content("""
                {"data":"2030-01-02","horaInicio":"08:30","capacidadeTotal":3}
                """)).andExpect(status().isCreated()).andExpect(jsonPath("$.id").value(id.toString()));
    }
    @Test
    void listaAgendaPropriaPorPeriodo() throws Exception {
        when(agenda.listarMeus(eq(identidade.toString()), any(), any())).thenReturn(List.of(horario));
        mvc.perform(get(rota).param("inicio", "2030-01-01").param("fim", "2030-01-31"))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].capacidadeTotal").value(3));
        verify(agenda).listarMeus(identidade.toString(), LocalDate.of(2030, 1, 1), LocalDate.of(2030, 1, 31));
    }
    @Test
    void atualizaCapacidadeEBloqueio() throws Exception {
        when(agenda.atualizar(eq(identidade.toString()), eq(id), any())).thenReturn(new HorarioAtendimento(id, prestador, horario.data(), horario.horaInicio(), 0, true));
        mvc.perform(put(rota + "/{id}", id).contentType(MediaType.APPLICATION_JSON).content("{\"capacidadeTotal\":0,\"bloqueado\":true}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.capacidadeTotal").value(0)).andExpect(jsonPath("$.bloqueado").value(true));
    }
    @Test
    void capacidadeNegativaRetorna400() throws Exception {
        mvc.perform(put(rota + "/{id}", id).contentType(MediaType.APPLICATION_JSON).content("{\"capacidadeTotal\":-1,\"bloqueado\":false}"))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(agenda);
    }
    @Test
    void camposAusentesRetornam400() throws Exception {
        mvc.perform(post(rota).contentType(MediaType.APPLICATION_JSON).content("{}")) .andExpect(status().isBadRequest());
        verifyNoInteractions(agenda);
    }
    @Test
    void horarioDuplicadoRetorna409() throws Exception {
        when(agenda.criar(eq(identidade.toString()), any())).thenThrow(new HorarioDuplicadoException());
        mvc.perform(post(rota).contentType(MediaType.APPLICATION_JSON).content("{\"data\":\"2030-01-02\",\"horaInicio\":\"08:30\",\"capacidadeTotal\":3}"))
                .andExpect(status().isConflict());
    }
    @Test
    void passadoRetorna422() throws Exception {
        when(agenda.criar(eq(identidade.toString()), any())).thenThrow(new RegraAgendaException("Horário passado."));
        mvc.perform(post(rota).contentType(MediaType.APPLICATION_JSON).content("{\"data\":\"2020-01-02\",\"horaInicio\":\"08:30\",\"capacidadeTotal\":3}"))
                .andExpect(status().is(422));
    }
    @Test
    void horarioDeOutroPrestadorRetorna404() throws Exception {
        when(agenda.atualizar(eq(identidade.toString()), eq(id), any())).thenThrow(new HorarioNaoEncontradoException());
        mvc.perform(put(rota + "/{id}", id).contentType(MediaType.APPLICATION_JSON).content("{\"capacidadeTotal\":3,\"bloqueado\":false}"))
                .andExpect(status().isNotFound());
    }
    @Test
    void consultaPublicaNaoPrecisaIdentidadeENaoExpoeCamposInternos() throws Exception {
        when(agenda.listarPublicos(prestador, null, null)).thenReturn(List.of(horario));
        mvc.perform(get("/api/v1/prestadores/{id}/horarios", prestador)).andExpect(status().isOk())
                .andExpect(jsonPath("$[0].vagasDisponiveis").value(3)).andExpect(jsonPath("$[0].prestadorId").doesNotExist())
                .andExpect(jsonPath("$[0].bloqueado").doesNotExist());
    }
    @Test
    void dataInvalidaNaQueryRetorna400() throws Exception {
        mvc.perform(get(rota).param("inicio", "data-invalida")).andExpect(status().isBadRequest());
        verifyNoInteractions(agenda);
    }
}
