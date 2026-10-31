package br.com.edu.ifpe.mobifix.api.usuario.infrastructure.web;

import java.util.UUID;

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
@RequestMapping("/api/v1/usuarios")
public class UsuarioController {

    private final CriarUsuario criarUsuario;
    private final ConsultarUsuarioAtual consultarUsuarioAtual;
    private final UUID firebaseIdMock;

    public UsuarioController(CriarUsuario criarUsuario, ConsultarUsuarioAtual consultarUsuarioAtual, @Value("${app.mock.firebase-id}") UUID firebaseIdMock) {
        this.criarUsuario = criarUsuario;
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
}