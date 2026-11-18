package br.com.edu.ifpe.mobifix.api.agendamento.infrastructure.web;

import br.com.edu.ifpe.mobifix.api.agendamento.application.Agendamentos;
import br.com.edu.ifpe.mobifix.api.agendamento.application.CriarAgendamentoCommand;
import br.com.edu.ifpe.mobifix.api.agendamento.infrastructure.web.dto.AgendamentoResponse;
import br.com.edu.ifpe.mobifix.api.agendamento.infrastructure.web.dto.CriarAgendamentoRequest;
import br.com.edu.ifpe.mobifix.api.agendamento.infrastructure.web.dto.PaginaAgendamentosResponse;
import br.com.edu.ifpe.mobifix.api.shared.infrastructure.security.IdentidadeAtual;
import br.com.edu.ifpe.mobifix.api.shared.infrastructure.web.hal.ApiHalAssembler;

import io.swagger.v3.oas.annotations.Hidden;

import jakarta.validation.Valid;

import org.springframework.hateoas.EntityModel;
import org.springframework.hateoas.PagedModel;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.util.UUID;

@RestController
@RequestMapping(value = "/api/v1/agendamentos", produces = "application/json")
public class AgendamentoController {

    private final Agendamentos agendamentos;

    private final IdentidadeAtual identidade;

    private final ApiHalAssembler hal;

    public AgendamentoController(
            Agendamentos agendamentos, IdentidadeAtual identidade, ApiHalAssembler hal) {
        this.agendamentos = agendamentos;
        this.identidade = identidade;
        this.hal = hal;
    }

    @PostMapping
    public ResponseEntity<AgendamentoResponse> criar(
            @Valid @RequestBody CriarAgendamentoRequest request) {
        var resposta =
                AgendamentoResponse.de(
                        agendamentos.criar(
                                identidade.firebaseId(),
                                new CriarAgendamentoCommand(
                                        request.veiculoId(),
                                        request.horarioId(),
                                        request.especialidadeId())));
        var location =
                ServletUriComponentsBuilder.fromCurrentContextPath()
                        .path("/api/v1/agendamentos/{id}")
                        .buildAndExpand(resposta.id())
                        .toUri();

        return ResponseEntity.created(location).body(resposta);
    }

    @GetMapping("/me")
    public PaginaAgendamentosResponse listar(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return PaginaAgendamentosResponse.de(
                agendamentos.listarMeus(identidade.firebaseId(), page, size));
    }

    @GetMapping("/{id}")
    public AgendamentoResponse consultar(@PathVariable UUID id) {
        return AgendamentoResponse.de(agendamentos.consultar(identidade.firebaseId(), id));
    }

    @Hidden
    @PostMapping(produces = "application/hal+json")
    public ResponseEntity<EntityModel<Object>> criarHal(
            @Valid @RequestBody CriarAgendamentoRequest request) {
        var resposta = criar(request);

        return ResponseEntity.status(resposta.getStatusCode())
                .headers(resposta.getHeaders())
                .body(hal.recurso(resposta.getBody()));
    }

    @Hidden
    @GetMapping(value = "/me", produces = "application/hal+json")
    public PagedModel<?> listarHal(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return hal.pagina(listar(page, size));
    }

    @Hidden
    @GetMapping(value = "/{id}", produces = "application/hal+json")
    public EntityModel<Object> consultarHal(@PathVariable UUID id) {
        return hal.recurso(consultar(id));
    }
}
