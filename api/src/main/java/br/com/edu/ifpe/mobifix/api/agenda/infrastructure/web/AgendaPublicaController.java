package br.com.edu.ifpe.mobifix.api.agenda.infrastructure.web;

import br.com.edu.ifpe.mobifix.api.shared.infrastructure.web.hal.ApiHalAssembler;
import io.swagger.v3.oas.annotations.Hidden;
import org.springframework.hateoas.CollectionModel;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import br.com.edu.ifpe.mobifix.api.agenda.application.GerenciarAgenda;
import br.com.edu.ifpe.mobifix.api.agenda.infrastructure.web.dto.HorarioDisponivelResponse;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(value = "/api/v1/prestadores/{prestadorId}/horarios", produces = "application/json")
public class AgendaPublicaController {
    private final ApiHalAssembler hal;
    private final GerenciarAgenda agenda;
    public AgendaPublicaController(GerenciarAgenda agenda, ApiHalAssembler hal) {
        this.hal = hal; this.agenda = agenda; }
    @GetMapping
    public List<HorarioDisponivelResponse> listar(@PathVariable UUID prestadorId,
            @RequestParam(required = false) LocalDate inicio, @RequestParam(required = false) LocalDate fim) {
        // Ainda nao existem reservas: toda a capacidade do horario aberto esta disponivel.
        return agenda.listarPublicos(prestadorId, inicio, fim).stream()
                .map(h -> new HorarioDisponivelResponse(h.id(), h.data(), h.horaInicio(), h.capacidadeTotal())).toList();
    }

    @Hidden
    @GetMapping(produces = "application/hal+json")
    public CollectionModel<?> listarHal(@PathVariable UUID prestadorId,
            @RequestParam(required = false) LocalDate inicio, @RequestParam(required = false) LocalDate fim) {
        return hal.colecao(listar(prestadorId, inicio, fim), HorarioDisponivelResponse.class);
    }
}
