package br.com.edu.ifpe.mobifix.api.usuario.application.useCase.criarUsuario;

import java.util.UUID;

import br.com.edu.ifpe.mobifix.api.usuario.application.exception.UsuarioJaCadastradoException;
import br.com.edu.ifpe.mobifix.api.usuario.domain.model.Usuario;
import br.com.edu.ifpe.mobifix.api.usuario.domain.port.UsuarioRepository;

public class CriarUsuario {

    private final UsuarioRepository repository;

    public CriarUsuario(UsuarioRepository repository) {
        this.repository = repository;
    }

    public Usuario executar(String firebaseId, CriarUsuarioCommand command) {
        Usuario usuario = new Usuario(
                UUID.randomUUID(),
                firebaseId,
                command.nome(),
                command.sobrenome(),
                command.email(),
                command.telefone(),
                command.uf(),
                command.tipo(),
                true
        );

        if (repository.existePorFirebaseId(usuario.firebaseId())) {
            throw new UsuarioJaCadastradoException("Esta identidade já possui cadastro.");
        }

        if (repository.existePorEmail(usuario.email())) {
            throw new UsuarioJaCadastradoException("Este e-mail já possui cadastro.");
        }

        return repository.salvar(usuario);
    }
}