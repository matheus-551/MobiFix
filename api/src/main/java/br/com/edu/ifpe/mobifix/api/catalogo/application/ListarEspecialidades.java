package br.com.edu.ifpe.mobifix.api.catalogo.application;

import br.com.edu.ifpe.mobifix.api.catalogo.domain.model.Especialidade;
import br.com.edu.ifpe.mobifix.api.catalogo.domain.port.EspecialidadeRepository;

import java.util.List;

public class ListarEspecialidades {

    private final EspecialidadeRepository repository;

    public ListarEspecialidades(EspecialidadeRepository repository) {
        this.repository = repository;
    }

    public List<Especialidade> executar() {
        return repository.listarTodos();
    }
}