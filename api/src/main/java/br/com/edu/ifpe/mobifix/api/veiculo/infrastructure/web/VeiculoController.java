package br.com.edu.ifpe.mobifix.api.veiculo.infrastructure.web;

import java.util.List;
import java.util.UUID;
import br.com.edu.ifpe.mobifix.api.veiculo.application.CriarVeiculoCommand;
import br.com.edu.ifpe.mobifix.api.veiculo.application.VeiculosDoCliente;
import br.com.edu.ifpe.mobifix.api.veiculo.domain.model.Veiculo;
import br.com.edu.ifpe.mobifix.api.veiculo.infrastructure.web.dto.CriarVeiculoRequest;
import br.com.edu.ifpe.mobifix.api.veiculo.infrastructure.web.dto.VeiculoResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/veiculos")
public class VeiculoController {
    private final VeiculosDoCliente veiculos;
    private final UUID firebaseIdMock;
    public VeiculoController(VeiculosDoCliente veiculos, @Value("${app.mock.firebase-id}") UUID firebaseIdMock) {
        this.veiculos = veiculos;
        this.firebaseIdMock = firebaseIdMock;
    }
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public VeiculoResponse criar(@Valid @RequestBody CriarVeiculoRequest request) {
        return toResponse(veiculos.criar(firebaseIdMock.toString(), new CriarVeiculoCommand(
                request.tipoVeiculoId(), request.marca(), request.modelo(), request.ano(), request.placa())));
    }
    @GetMapping("/me")
    public List<VeiculoResponse> listarMeus() {
        return veiculos.listar(firebaseIdMock.toString()).stream().map(this::toResponse).toList();
    }
    private VeiculoResponse toResponse(Veiculo veiculo) {
        return new VeiculoResponse(veiculo.id(), veiculo.clienteId(), veiculo.tipoVeiculoId(),
                veiculo.marca(), veiculo.modelo(), veiculo.ano(), veiculo.placa());
    }
}
