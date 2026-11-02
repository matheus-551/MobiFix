package br.com.edu.ifpe.mobifix.api.usuario.application.useCase.atualizarUsuarioAtual;

import br.com.edu.ifpe.mobifix.api.usuario.application.exception.UsuarioInativoException;
import br.com.edu.ifpe.mobifix.api.usuario.application.exception.UsuarioNaoEncontradoException;
import br.com.edu.ifpe.mobifix.api.usuario.domain.model.Usuario;
import br.com.edu.ifpe.mobifix.api.usuario.domain.port.UsuarioRepository;

public class AtualizarUsuarioAtual {
    private final UsuarioRepository repository;

    public AtualizarUsuarioAtual(UsuarioRepository repository) {
        this.repository = repository;
    }

    public Usuario executar(String firebaseId, AtualizarUsuarioCommand command) {
        Usuario atual = repository.buscarPorFirebaseId(firebaseId)
                .orElseThrow(UsuarioNaoEncontradoException::new);
        if (!atual.ativo()) throw new UsuarioInativoException();
        Usuario atualizado = atual.atualizarDadosPessoais(
                command.nome(), command.sobrenome(), command.telefone(), command.uf()
        );
        return repository.atualizarDadosPessoais(atualizado);
    }
}
