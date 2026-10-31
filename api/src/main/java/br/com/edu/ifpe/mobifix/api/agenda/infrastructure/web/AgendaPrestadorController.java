package br.com.edu.ifpe.mobifix.api.agenda.infrastructure.web;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import br.com.edu.ifpe.mobifix.api.agenda.application.*;
import br.com.edu.ifpe.mobifix.api.agenda.domain.model.HorarioAtendimento;
import br.com.edu.ifpe.mobifix.api.agenda.infrastructure.web.dto.*;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/prestadores/me/horarios")
public class AgendaPrestadorController {
    private final GerenciarAgenda agenda;
    private final UUID firebaseId;
    public AgendaPrestadorController(GerenciarAgenda agenda, @Value("${app.mock.firebase-id}") UUID firebaseId) {
        this.agenda = agenda; this.firebaseId = firebaseId;
    }
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public HorarioResponse criar(@Valid @RequestBody CriarHorarioRequest request) {
        return toResponse(agenda.criar(firebaseId.toString(), new CriarHorarioCommand(request.data(), request.horaInicio(), request.capacidadeTotal())));
    }
    @GetMapping
    public List<HorarioResponse> listar(@RequestParam(required = false) LocalDate inicio, @RequestParam(required = false) LocalDate fim) {
        return agenda.listarMeus(firebaseId.toString(), inicio, fim).stream().map(this::toResponse).toList();
    }
    @PutMapping("/{id}")
    public HorarioResponse atualizar(@PathVariable UUID id, @Valid @RequestBody AtualizarHorarioRequest request) {
        return toResponse(agenda.atualizar(firebaseId.toString(), id, new AtualizarHorarioCommand(request.capacidadeTotal(), request.bloqueado())));
    }
    private HorarioResponse toResponse(HorarioAtendimento horario) {
        return new HorarioResponse(horario.id(), horario.prestadorId(), horario.data(), horario.horaInicio(), horario.capacidadeTotal(), horario.bloqueado());
    }
}
