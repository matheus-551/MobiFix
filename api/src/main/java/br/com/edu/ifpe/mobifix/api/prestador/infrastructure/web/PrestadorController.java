package br.com.edu.ifpe.mobifix.api.prestador.infrastructure.web;

import br.com.edu.ifpe.mobifix.api.shared.infrastructure.web.hal.ApiHalAssembler;
import io.swagger.v3.oas.annotations.Hidden;
import org.springframework.hateoas.EntityModel;

import java.util.UUID;
import br.com.edu.ifpe.mobifix.api.prestador.application.useCase.atualizarPerfilPrestador.AtualizarPerfilPrestador;
import br.com.edu.ifpe.mobifix.api.prestador.application.useCase.atualizarPerfilPrestador.AtualizarPerfilPrestadorCommand;
import br.com.edu.ifpe.mobifix.api.prestador.infrastructure.web.dto.AtualizarPerfilPrestadorRequest;

import br.com.edu.ifpe.mobifix.api.prestador.application.ConsultarPerfilPrestadorAtual;
import br.com.edu.ifpe.mobifix.api.prestador.application.CriarPerfilPrestador;
import br.com.edu.ifpe.mobifix.api.prestador.application.useCase.criarPerfilPrestador.CriarPerfilPrestadorCommand;
import br.com.edu.ifpe.mobifix.api.prestador.domain.model.Endereco;
import br.com.edu.ifpe.mobifix.api.prestador.domain.model.PerfilPrestador;
import br.com.edu.ifpe.mobifix.api.prestador.infrastructure.web.dto.CriarPerfilPrestadorRequest;
import br.com.edu.ifpe.mobifix.api.prestador.infrastructure.web.dto.EnderecoRequest;
import br.com.edu.ifpe.mobifix.api.prestador.infrastructure.web.dto.PerfilPrestadorResponse;

import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(value = "/api/v1/prestadores/me/perfil", produces = "application/json")
public class PrestadorController {
    private final ApiHalAssembler hal;

    private final CriarPerfilPrestador criarPerfilPrestador;
    private final ConsultarPerfilPrestadorAtual consultarPerfilPrestadorAtual;
    private final UUID firebaseIdMock;
    private final AtualizarPerfilPrestador atualizarPerfilPrestador;

    public PrestadorController(CriarPerfilPrestador criarPerfilPrestador, ConsultarPerfilPrestadorAtual consultarPerfilPrestadorAtual, AtualizarPerfilPrestador atualizarPerfilPrestador, @Value("${app.mock.firebase-id}") UUID firebaseIdeMock, ApiHalAssembler hal) {
        this.hal = hal;
        this.criarPerfilPrestador = criarPerfilPrestador;
        this.atualizarPerfilPrestador = atualizarPerfilPrestador;
        this.consultarPerfilPrestadorAtual = consultarPerfilPrestadorAtual;
        this.firebaseIdMock = firebaseIdeMock;
    }

    @PostMapping
    public ResponseEntity<PerfilPrestadorResponse> criar(@Valid @RequestBody CriarPerfilPrestadorRequest request) {
        EnderecoRequest entrada = request.endereco();

        Endereco endereco = new Endereco(
                entrada.logradouro(),
                entrada.numero(),
                entrada.complemento(),
                entrada.bairro(),
                entrada.cidade(),
                entrada.uf(),
                entrada.cep()
        );

        CriarPerfilPrestadorCommand command =
                new CriarPerfilPrestadorCommand(
                        request.nomeFantasia(),
                        request.descricao(),
                        endereco,
                        request.tiposVeiculoIds(),
                        request.especialidadeIds()
                );

        PerfilPrestador perfil = criarPerfilPrestador.executar(firebaseIdMock.toString(), command);

        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(perfil));
    }

    @PutMapping
    public PerfilPrestadorResponse atualizar(@Valid @RequestBody AtualizarPerfilPrestadorRequest request) {
        EnderecoRequest entrada = request.endereco();
        Endereco endereco = new Endereco(
                entrada.logradouro(), entrada.numero(), entrada.complemento(),
                entrada.bairro(), entrada.cidade(), entrada.uf(), entrada.cep()
        );
        AtualizarPerfilPrestadorCommand command = new AtualizarPerfilPrestadorCommand(
                request.nomeFantasia(), request.descricao(), endereco,
                request.tiposVeiculoIds(), request.especialidadeIds()
        );
        return toResponse(atualizarPerfilPrestador.executar(firebaseIdMock.toString(), command));
    }
    @GetMapping
    public PerfilPrestadorResponse consultarAtual() {
        PerfilPrestador perfil = consultarPerfilPrestadorAtual.executar(firebaseIdMock.toString());

        return toResponse(perfil);
    }

    private PerfilPrestadorResponse toResponse(PerfilPrestador perfil) {
        Endereco endereco = perfil.endereco();

        var enderecoResponse =
                new PerfilPrestadorResponse.EnderecoResponse(
                        endereco.logradouro(),
                        endereco.numero(),
                        endereco.complemento(),
                        endereco.bairro(),
                        endereco.cidade(),
                        endereco.uf(),
                        endereco.cep()
                );

        return new PerfilPrestadorResponse(
                perfil.id(),
                perfil.usuarioId(),
                perfil.nomeFantasia(),
                perfil.descricao(),
                enderecoResponse,
                perfil.tiposVeiculoIds(),
                perfil.especialidadeIds()
        );
    }

    @Hidden
    @PostMapping(produces = "application/hal+json")
    public ResponseEntity<EntityModel<Object>> criarHal(@Valid @RequestBody CriarPerfilPrestadorRequest request) {
        var resposta = criar(request);
        return ResponseEntity.status(resposta.getStatusCode()).headers(resposta.getHeaders()).body(hal.recurso(resposta.getBody()));
    }
    @Hidden
    @GetMapping(produces = "application/hal+json")
    public EntityModel<Object> consultarHal() { return hal.recurso(consultarAtual()); }
    @Hidden
    @PutMapping(produces = "application/hal+json")
    public EntityModel<Object> atualizarHal(@Valid @RequestBody AtualizarPerfilPrestadorRequest request) { return hal.recurso(atualizar(request)); }
}
