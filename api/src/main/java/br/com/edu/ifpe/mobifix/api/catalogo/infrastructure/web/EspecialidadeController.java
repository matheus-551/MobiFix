package br.com.edu.ifpe.mobifix.api.catalogo.infrastructure.web;

import br.com.edu.ifpe.mobifix.api.catalogo.application.ListarEspecialidades;
import br.com.edu.ifpe.mobifix.api.catalogo.infrastructure.web.dto.EspecialidadeResponse;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/especialidades")
public class EspecialidadeController {

    private final ListarEspecialidades listarEspecialidades;

    public EspecialidadeController(
            ListarEspecialidades listarEspecialidades
    ) {
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
}