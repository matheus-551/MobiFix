package br.com.edu.ifpe.mobifix.api.prestador.infrastructure.web;

import java.util.UUID;
import br.com.edu.ifpe.mobifix.api.prestador.application.busca.*;
import br.com.edu.ifpe.mobifix.api.prestador.infrastructure.web.dto.BuscaPrestadoresResponse;
import br.com.edu.ifpe.mobifix.api.prestador.infrastructure.web.dto.PrestadorPublicoResponse;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/prestadores")
public class PrestadorPublicoController {
    private final BuscarPrestadores buscarPrestadores;
    public PrestadorPublicoController(BuscarPrestadores buscarPrestadores) {
        this.buscarPrestadores = buscarPrestadores;
    }
    @GetMapping
    public BuscaPrestadoresResponse buscar(
            @RequestParam(required = false) Long tipoVeiculoId,
            @RequestParam(required = false) Long especialidadeId,
            @RequestParam(required = false) String uf,
            @RequestParam(required = false) String cidade,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        PaginaPrestadores resultado = buscarPrestadores.executar(new FiltroPrestadores(tipoVeiculoId, especialidadeId, uf, cidade, page, size));
        return new BuscaPrestadoresResponse(resultado.content().stream().map(this::toResponse).toList(), resultado.page(), resultado.size(), resultado.totalElements(), resultado.totalPages());
    }
    @GetMapping("/{id}")
    public PrestadorPublicoResponse consultar(@PathVariable UUID id) {
        return toResponse(buscarPrestadores.consultar(id));
    }
    private PrestadorPublicoResponse toResponse(PrestadorPublico perfil) {
        return new PrestadorPublicoResponse(perfil.id(), perfil.nome(), perfil.descricao(), perfil.cidade(), perfil.uf(),
                perfil.tiposVeiculo().stream().map(item -> new PrestadorPublicoResponse.ItemCatalogoResponse(item.id(), item.nome())).toList(),
                perfil.especialidades().stream().map(item -> new PrestadorPublicoResponse.ItemCatalogoResponse(item.id(), item.nome())).toList());
    }
}
