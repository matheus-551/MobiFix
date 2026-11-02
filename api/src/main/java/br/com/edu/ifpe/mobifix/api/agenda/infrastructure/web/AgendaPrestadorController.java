package br.com.edu.ifpe.mobifix.api.agenda.infrastructure.web;

import br.com.edu.ifpe.mobifix.api.shared.infrastructure.web.hal.ApiHalAssembler;
import io.swagger.v3.oas.annotations.Hidden;
import org.springframework.hateoas.EntityModel;
import org.springframework.hateoas.CollectionModel;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import br.com.edu.ifpe.mobifix.api.agenda.application.*;
import br.com.edu.ifpe.mobifix.api.agenda.domain.model.HorarioAtendimento;
import br.com.edu.ifpe.mobifix.api.agenda.infrastructure.web.dto.*;
import jakarta.validation.Valid;
import br.com.edu.ifpe.mobifix.api.shared.infrastructure.security.IdentidadeAtual;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(value = "/api/v1/prestadores/me/horarios", produces = "application/json")
public class AgendaPrestadorController {
    private final ApiHalAssembler hal;
    private final GerenciarAgenda agenda;
    private final IdentidadeAtual identidadeAtual;
    public AgendaPrestadorController(GerenciarAgenda agenda, IdentidadeAtual identidadeAtual, ApiHalAssembler hal) {
        this.hal = hal;
        this.agenda = agenda; this.identidadeAtual = identidadeAtual;
    }
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public HorarioResponse criar(@Valid @RequestBody CriarHorarioRequest request) {
        return toResponse(agenda.criar(identidadeAtual.firebaseId(), new CriarHorarioCommand(request.data(), request.horaInicio(), request.capacidadeTotal())));
    }
    @GetMapping
    public List<HorarioResponse> listar(@RequestParam(required = false) LocalDate inicio, @RequestParam(required = false) LocalDate fim) {
        return agenda.listarMeus(identidadeAtual.firebaseId(), inicio, fim).stream().map(this::toResponse).toList();
    }
    @PutMapping("/{id}")
    public HorarioResponse atualizar(@PathVariable UUID id, @Valid @RequestBody AtualizarHorarioRequest request) {
        return toResponse(agenda.atualizar(identidadeAtual.firebaseId(), id, new AtualizarHorarioCommand(request.capacidadeTotal(), request.bloqueado())));
    }
    private HorarioResponse toResponse(HorarioAtendimento horario) {
        return new HorarioResponse(horario.id(), horario.prestadorId(), horario.data(), horario.horaInicio(), horario.capacidadeTotal(), horario.bloqueado());
    }

    @Hidden
    @PostMapping(produces = "application/hal+json")
    @ResponseStatus(HttpStatus.CREATED)
    public EntityModel<Object> criarHal(@Valid @RequestBody CriarHorarioRequest request) { return hal.recurso(criar(request)); }
    @Hidden
    @GetMapping(produces = "application/hal+json")
    public CollectionModel<?> listarHal(
            @RequestParam(required = false) LocalDate inicio, @RequestParam(required = false) LocalDate fim) {
        return hal.colecao(listar(inicio, fim), HorarioResponse.class);
    }
    @Hidden
    @PutMapping(value = "/{id}", produces = "application/hal+json")
    public EntityModel<Object> atualizarHal(@PathVariable UUID id, @Valid @RequestBody AtualizarHorarioRequest request) { return hal.recurso(atualizar(id, request)); }
}
