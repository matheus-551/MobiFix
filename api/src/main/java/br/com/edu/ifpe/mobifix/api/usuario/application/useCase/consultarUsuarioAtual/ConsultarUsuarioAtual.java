package br.com.edu.ifpe.mobifix.api.usuario.application.useCase.consultarUsuarioAtual;

import br.com.edu.ifpe.mobifix.api.usuario.application.exception.UsuarioNaoEncontradoException;
import br.com.edu.ifpe.mobifix.api.usuario.domain.model.Usuario;
import br.com.edu.ifpe.mobifix.api.usuario.domain.port.UsuarioRepository;

public class ConsultarUsuarioAtual {

    private final UsuarioRepository repository;

    public ConsultarUsuarioAtual(UsuarioRepository repository) {
        this.repository = repository;
    }

    public Usuario executar(String firebaseId) {
        return repository.buscarPorFirebaseId(firebaseId)
                .orElseThrow(UsuarioNaoEncontradoException::new);
    }
}
