package br.com.edu.ifpe.mobifix.api.agenda.infrastructure.web;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import br.com.edu.ifpe.mobifix.api.agenda.application.GerenciarAgenda;
import br.com.edu.ifpe.mobifix.api.agenda.infrastructure.web.dto.HorarioDisponivelResponse;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/prestadores/{prestadorId}/horarios")
public class AgendaPublicaController {
    private final GerenciarAgenda agenda;
    public AgendaPublicaController(GerenciarAgenda agenda) { this.agenda = agenda; }
    @GetMapping
    public List<HorarioDisponivelResponse> listar(@PathVariable UUID prestadorId,
            @RequestParam(required = false) LocalDate inicio, @RequestParam(required = false) LocalDate fim) {
        // Ainda nao existem reservas: toda a capacidade do horario aberto esta disponivel.
        return agenda.listarPublicos(prestadorId, inicio, fim).stream()
                .map(h -> new HorarioDisponivelResponse(h.id(), h.data(), h.horaInicio(), h.capacidadeTotal())).toList();
    }
}
