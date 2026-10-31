package br.com.edu.ifpe.mobifix.api.catalogo.infrastructure.web;

import br.com.edu.ifpe.mobifix.api.catalogo.application.ListarTiposVeiculo;
import br.com.edu.ifpe.mobifix.api.catalogo.infrastructure.web.dto.TipoVeiculoResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tipos-veiculo")
public class TipoVeiculoController {

    private final ListarTiposVeiculo listarTiposVeiculo;

    public TipoVeiculoController(ListarTiposVeiculo listarTiposVeiculo) {
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
}
