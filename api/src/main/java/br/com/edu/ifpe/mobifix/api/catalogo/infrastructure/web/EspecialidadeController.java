package br.com.edu.ifpe.mobifix.api.catalogo.infrastructure.web;

import br.com.edu.ifpe.mobifix.api.shared.infrastructure.web.hal.ApiHalAssembler;
import io.swagger.v3.oas.annotations.Hidden;
import org.springframework.hateoas.CollectionModel;

import br.com.edu.ifpe.mobifix.api.catalogo.application.ListarEspecialidades;
import br.com.edu.ifpe.mobifix.api.catalogo.infrastructure.web.dto.EspecialidadeResponse;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value = "/api/v1/especialidades", produces = "application/json")
public class EspecialidadeController {
    private final ApiHalAssembler hal;

    private final ListarEspecialidades listarEspecialidades;

    public EspecialidadeController(
            ListarEspecialidades listarEspecialidades,
            ApiHalAssembler hal) {
        this.hal = hal;
        this.listarEspecialidades = listarEspecialidades;
    }

    @GetMapping
    public List<EspecialidadeResponse> listar() {
        return listarEspecialidades.executar()
                .stream()
                .map(especialidade -> new EspecialidadeResponse(
                        especialidade.id(),
                        especialidade.nome()
                ))
                .toList();
    }

    @Hidden
    @GetMapping(produces = "application/hal+json")
    public CollectionModel<?> listarHal() { return hal.colecao(listar(), EspecialidadeResponse.class); }

}
