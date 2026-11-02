package br.com.edu.ifpe.mobifix.api.catalogo.infrastructure.web;

import br.com.edu.ifpe.mobifix.api.shared.infrastructure.web.hal.ApiHalAssembler;
import io.swagger.v3.oas.annotations.Hidden;
import org.springframework.hateoas.CollectionModel;

import br.com.edu.ifpe.mobifix.api.catalogo.application.ListarTiposVeiculo;
import br.com.edu.ifpe.mobifix.api.catalogo.infrastructure.web.dto.TipoVeiculoResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping(value = "/api/v1/tipos-veiculo", produces = "application/json")
public class TipoVeiculoController {
    private final ApiHalAssembler hal;

    private final ListarTiposVeiculo listarTiposVeiculo;

    public TipoVeiculoController(ListarTiposVeiculo listarTiposVeiculo, ApiHalAssembler hal) {
        this.hal = hal;
        this.listarTiposVeiculo = listarTiposVeiculo;
    }

    @GetMapping
    public List<TipoVeiculoResponse> listar() {
        return listarTiposVeiculo.executar()
                .stream()
                .map(tipo -> new TipoVeiculoResponse(
                        tipo.id(),
                        tipo.nome()
                )).toList();
    }

    @Hidden
    @GetMapping(produces = "application/hal+json")
    public CollectionModel<?> listarHal() { return hal.colecao(listar(), TipoVeiculoResponse.class); }

}
