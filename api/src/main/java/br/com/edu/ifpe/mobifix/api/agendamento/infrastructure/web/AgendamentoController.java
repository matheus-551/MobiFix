package br.com.edu.ifpe.mobifix.api.agendamento.infrastructure.web;

import br.com.edu.ifpe.mobifix.api.agendamento.application.Agendamentos;
import br.com.edu.ifpe.mobifix.api.agendamento.application.CriarAgendamentoCommand;
import br.com.edu.ifpe.mobifix.api.agendamento.infrastructure.web.dto.AgendamentoResponse;
import br.com.edu.ifpe.mobifix.api.agendamento.infrastructure.web.dto.CriarAgendamentoRequest;
import br.com.edu.ifpe.mobifix.api.agendamento.infrastructure.web.dto.PaginaAgendamentosResponse;
import br.com.edu.ifpe.mobifix.api.agendamento.infrastructure.web.dto.RemarcarAgendamentoRequest;
import br.com.edu.ifpe.mobifix.api.shared.infrastructure.security.IdentidadeAtual;
import br.com.edu.ifpe.mobifix.api.shared.infrastructure.web.hal.ApiHalAssembler;
import br.com.edu.ifpe.mobifix.api.usuario.application.useCase.consultarUsuarioAtual.ConsultarUsuarioAtual;
import br.com.edu.ifpe.mobifix.api.usuario.domain.model.TipoUsuario;

import io.swagger.v3.oas.annotations.Hidden;

import jakarta.validation.Valid;

import org.springframework.hateoas.EntityModel;
import org.springframework.hateoas.PagedModel;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
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

    private final ConsultarUsuarioAtual consultarUsuario;

    public AgendamentoController(
            Agendamentos agendamentos,
            IdentidadeAtual identidade,
            ApiHalAssembler hal,
            ConsultarUsuarioAtual consultarUsuario) {
        this.agendamentos = agendamentos;
        this.identidade = identidade;
        this.hal = hal;
        this.consultarUsuario = consultarUsuario;
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
                .body(hal.agendamento(resposta.getBody(), false));
    }

    @Hidden
    @GetMapping(value = "/me", produces = "application/hal+json")
    public PagedModel<?> listarHal(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return hal.pagina(listar(page, size), prestadorAtual());
    }

    @Hidden
    @GetMapping(value = "/{id}", produces = "application/hal+json")
    public EntityModel<Object> consultarHal(@PathVariable UUID id) {
        return hal.agendamento(consultar(id), prestadorAtual());
    }

    @PatchMapping("/{id}/confirmar")
    public AgendamentoResponse confirmar(@PathVariable UUID id) {
        return AgendamentoResponse.de(agendamentos.confirmar(identidade.firebaseId(), id));
    }

    @Hidden
    @PatchMapping(value = "/{id}/confirmar", produces = "application/hal+json")
    public EntityModel<Object> confirmarHal(@PathVariable UUID id) {
        return hal.agendamento(confirmar(id), prestadorAtual());
    }

    @PatchMapping("/{id}/cancelar")
    public AgendamentoResponse cancelar(@PathVariable UUID id) {
        return AgendamentoResponse.de(agendamentos.cancelar(identidade.firebaseId(), id));
    }

    @Hidden
    @PatchMapping(value = "/{id}/cancelar", produces = "application/hal+json")
    public EntityModel<Object> cancelarHal(@PathVariable UUID id) {
        return hal.agendamento(cancelar(id), prestadorAtual());
    }

    @PatchMapping("/{id}/concluir")
    public AgendamentoResponse concluir(@PathVariable UUID id) {
        return AgendamentoResponse.de(agendamentos.concluir(identidade.firebaseId(), id));
    }

    @Hidden
    @PatchMapping(value = "/{id}/concluir", produces = "application/hal+json")
    public EntityModel<Object> concluirHal(@PathVariable UUID id) {
        return hal.agendamento(concluir(id), prestadorAtual());
    }

    private boolean prestadorAtual() {
        return consultarUsuario.executar(identidade.firebaseId()).tipo() == TipoUsuario.PRESTADOR;
    }

    @PatchMapping("/{id}/remarcar")
    public AgendamentoResponse remarcar(
            @PathVariable UUID id, @Valid @RequestBody RemarcarAgendamentoRequest request) {
        return AgendamentoResponse.de(
                agendamentos.remarcar(identidade.firebaseId(), id, request.horarioId()));
    }

    @Hidden
    @PatchMapping(value = "/{id}/remarcar", produces = "application/hal+json")
    public EntityModel<Object> remarcarHal(
            @PathVariable UUID id, @Valid @RequestBody RemarcarAgendamentoRequest request) {
        return hal.agendamento(remarcar(id, request), prestadorAtual());
    }
}
