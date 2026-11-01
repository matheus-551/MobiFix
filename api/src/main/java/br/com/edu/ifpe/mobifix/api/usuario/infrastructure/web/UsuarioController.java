package br.com.edu.ifpe.mobifix.api.usuario.infrastructure.web;

import br.com.edu.ifpe.mobifix.api.shared.infrastructure.web.hal.ApiHalAssembler;
import io.swagger.v3.oas.annotations.Hidden;
import org.springframework.hateoas.EntityModel;

import java.util.UUID;
import br.com.edu.ifpe.mobifix.api.usuario.application.useCase.atualizarUsuarioAtual.AtualizarUsuarioAtual;
import br.com.edu.ifpe.mobifix.api.usuario.application.useCase.atualizarUsuarioAtual.AtualizarUsuarioCommand;
import br.com.edu.ifpe.mobifix.api.usuario.application.useCase.desativarUsuarioAtual.DesativarUsuarioAtual;
import br.com.edu.ifpe.mobifix.api.usuario.infrastructure.web.dto.AtualizarUsuarioRequest;

import br.com.edu.ifpe.mobifix.api.usuario.application.useCase.consultarUsuarioAtual.ConsultarUsuarioAtual;
import br.com.edu.ifpe.mobifix.api.usuario.application.useCase.criarUsuario.CriarUsuario;
import br.com.edu.ifpe.mobifix.api.usuario.application.useCase.criarUsuario.CriarUsuarioCommand;
import br.com.edu.ifpe.mobifix.api.usuario.domain.model.Usuario;
import br.com.edu.ifpe.mobifix.api.usuario.infrastructure.web.dto.CriarUsuarioRequest;
import br.com.edu.ifpe.mobifix.api.usuario.infrastructure.web.dto.UsuarioResponse;

import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(value = "/api/v1/usuarios", produces = "application/json")
public class UsuarioController {
    private final ApiHalAssembler hal;

    private final CriarUsuario criarUsuario;
    private final ConsultarUsuarioAtual consultarUsuarioAtual;
    private final UUID firebaseIdMock;
    private final AtualizarUsuarioAtual atualizarUsuarioAtual;
    private final DesativarUsuarioAtual desativarUsuarioAtual;

    public UsuarioController(CriarUsuario criarUsuario, ConsultarUsuarioAtual consultarUsuarioAtual, AtualizarUsuarioAtual atualizarUsuarioAtual, DesativarUsuarioAtual desativarUsuarioAtual, @Value("${app.mock.firebase-id}") UUID firebaseIdMock, ApiHalAssembler hal) {
        this.hal = hal;
        this.criarUsuario = criarUsuario;
        this.atualizarUsuarioAtual = atualizarUsuarioAtual;
        this.desativarUsuarioAtual = desativarUsuarioAtual;
        this.consultarUsuarioAtual = consultarUsuarioAtual;
        this.firebaseIdMock = firebaseIdMock;
    }

    @PostMapping
    public ResponseEntity<UsuarioResponse> criar(@Valid @RequestBody CriarUsuarioRequest request) {
        CriarUsuarioCommand command = new CriarUsuarioCommand(
                request.nome(),
                request.sobrenome(),
                request.email(),
                request.telefone(),
                request.uf(),
                request.tipo()
        );

        Usuario usuario = criarUsuario.executar(firebaseIdMock.toString(), command);

        UsuarioResponse response = toResponse(usuario);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/me")
    public UsuarioResponse consultarAtual() {
        Usuario usuario = consultarUsuarioAtual.executar(
                firebaseIdMock.toString()
        );

        return toResponse(usuario);
    }

    @PutMapping("/me")
    public UsuarioResponse atualizarAtual(@Valid @RequestBody AtualizarUsuarioRequest request) {
        Usuario usuario = atualizarUsuarioAtual.executar(firebaseIdMock.toString(), new AtualizarUsuarioCommand(
                request.nome(), request.sobrenome(), request.telefone(), request.uf()
        ));
        return toResponse(usuario);
    }

    @DeleteMapping(value = "/me", produces = {"application/json", "application/hal+json"})
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void desativarAtual() {
        desativarUsuarioAtual.executar(firebaseIdMock.toString());
    }
    private UsuarioResponse toResponse(Usuario usuario) {
        return new UsuarioResponse(
                usuario.id(),
                usuario.nome(),
                usuario.sobrenome(),
                usuario.email(),
                usuario.telefone(),
                usuario.uf(),
                usuario.tipo().name(),
                usuario.ativo()
        );
    }

    @Hidden
    @PostMapping(produces = "application/hal+json")
    public ResponseEntity<EntityModel<Object>> criarHal(@Valid @RequestBody CriarUsuarioRequest request) {
        var resposta = criar(request);
        return ResponseEntity.status(resposta.getStatusCode()).headers(resposta.getHeaders()).body(hal.recurso(resposta.getBody()));
    }
    @Hidden
    @GetMapping(value = "/me", produces = "application/hal+json")
    public EntityModel<Object> consultarHal() { return hal.recurso(consultarAtual()); }
    @Hidden
    @PutMapping(value = "/me", produces = "application/hal+json")
    public EntityModel<Object> atualizarHal(@Valid @RequestBody AtualizarUsuarioRequest request) { return hal.recurso(atualizarAtual(request)); }
}
