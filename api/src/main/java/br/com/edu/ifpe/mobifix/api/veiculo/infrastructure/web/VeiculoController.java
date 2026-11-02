package br.com.edu.ifpe.mobifix.api.veiculo.infrastructure.web;

import br.com.edu.ifpe.mobifix.api.shared.infrastructure.web.hal.ApiHalAssembler;
import io.swagger.v3.oas.annotations.Hidden;
import org.springframework.hateoas.EntityModel;
import org.springframework.hateoas.CollectionModel;

import java.util.List;
import br.com.edu.ifpe.mobifix.api.veiculo.application.AtualizarVeiculoCommand;
import br.com.edu.ifpe.mobifix.api.veiculo.infrastructure.web.dto.AtualizarVeiculoRequest;
import java.util.UUID;
import br.com.edu.ifpe.mobifix.api.veiculo.application.CriarVeiculoCommand;
import br.com.edu.ifpe.mobifix.api.veiculo.application.VeiculosDoCliente;
import br.com.edu.ifpe.mobifix.api.veiculo.domain.model.Veiculo;
import br.com.edu.ifpe.mobifix.api.veiculo.infrastructure.web.dto.CriarVeiculoRequest;
import br.com.edu.ifpe.mobifix.api.veiculo.infrastructure.web.dto.VeiculoResponse;
import jakarta.validation.Valid;
import br.com.edu.ifpe.mobifix.api.shared.infrastructure.security.IdentidadeAtual;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(value = "/api/v1/veiculos", produces = "application/json")
public class VeiculoController {
    private final ApiHalAssembler hal;
    private final VeiculosDoCliente veiculos;
    private final IdentidadeAtual identidadeAtual;
    public VeiculoController(VeiculosDoCliente veiculos, IdentidadeAtual identidadeAtual, ApiHalAssembler hal) {
        this.hal = hal;
        this.veiculos = veiculos;
        this.identidadeAtual = identidadeAtual;
    }
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public VeiculoResponse criar(@Valid @RequestBody CriarVeiculoRequest request) {
        return toResponse(veiculos.criar(identidadeAtual.firebaseId(), new CriarVeiculoCommand(
                request.tipoVeiculoId(), request.marca(), request.modelo(), request.ano(), request.placa())));
    }
    @GetMapping("/me")
    public List<VeiculoResponse> listarMeus() {
        return veiculos.listar(identidadeAtual.firebaseId()).stream().map(this::toResponse).toList();
    }
    @GetMapping("/{id}")
    public VeiculoResponse consultar(@PathVariable UUID id) {
        return toResponse(veiculos.consultar(identidadeAtual.firebaseId(), id));
    }

    @PutMapping("/{id}")
    public VeiculoResponse atualizar(@PathVariable UUID id, @Valid @RequestBody AtualizarVeiculoRequest request) {
        return toResponse(veiculos.atualizar(identidadeAtual.firebaseId(), id, new AtualizarVeiculoCommand(
                request.tipoVeiculoId(), request.marca(), request.modelo(), request.ano(), request.placa())));
    }

    @DeleteMapping(value = "/{id}", produces = {"application/json", "application/hal+json"})
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void desativar(@PathVariable UUID id) {
        veiculos.desativar(identidadeAtual.firebaseId(), id);
    }
    private VeiculoResponse toResponse(Veiculo veiculo) {
        return new VeiculoResponse(veiculo.id(), veiculo.clienteId(), veiculo.tipoVeiculoId(),
                veiculo.marca(), veiculo.modelo(), veiculo.ano(), veiculo.placa());
    }

    @Hidden
    @PostMapping(produces = "application/hal+json")
    @ResponseStatus(HttpStatus.CREATED)
    public EntityModel<Object> criarHal(@Valid @RequestBody CriarVeiculoRequest request) { return hal.recurso(criar(request)); }
    @Hidden
    @GetMapping(value = "/me", produces = "application/hal+json")
    public CollectionModel<?> listarHal() { return hal.colecao(listarMeus(), VeiculoResponse.class); }
    @Hidden
    @GetMapping(value = "/{id}", produces = "application/hal+json")
    public EntityModel<Object> consultarHal(@PathVariable UUID id) { return hal.recurso(consultar(id)); }
    @Hidden
    @PutMapping(value = "/{id}", produces = "application/hal+json")
    public EntityModel<Object> atualizarHal(@PathVariable UUID id, @Valid @RequestBody AtualizarVeiculoRequest request) { return hal.recurso(atualizar(id, request)); }
}
