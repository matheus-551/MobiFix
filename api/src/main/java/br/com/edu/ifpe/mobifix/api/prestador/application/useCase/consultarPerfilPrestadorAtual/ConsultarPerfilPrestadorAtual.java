package br.com.edu.ifpe.mobifix.api.prestador.application;

import br.com.edu.ifpe.mobifix.api.prestador.application.exception.CadastroPrestadorInvalidoException;
import br.com.edu.ifpe.mobifix.api.prestador.application.exception.PerfilPrestadorNaoEncontradoException;
import br.com.edu.ifpe.mobifix.api.prestador.domain.model.PerfilPrestador;
import br.com.edu.ifpe.mobifix.api.prestador.domain.port.PerfilPrestadorRepository;

import br.com.edu.ifpe.mobifix.api.usuario.application.exception.UsuarioNaoEncontradoException;
import br.com.edu.ifpe.mobifix.api.usuario.domain.model.TipoUsuario;
import br.com.edu.ifpe.mobifix.api.usuario.domain.model.Usuario;
import br.com.edu.ifpe.mobifix.api.usuario.domain.port.UsuarioRepository;

public class ConsultarPerfilPrestadorAtual {

    private final UsuarioRepository usuarioRepository;
    private final PerfilPrestadorRepository perfilRepository;

    public ConsultarPerfilPrestadorAtual(UsuarioRepository usuarioRepository, PerfilPrestadorRepository perfilRepository) {
        this.usuarioRepository = usuarioRepository;
        this.perfilRepository = perfilRepository;
    }

    public PerfilPrestador executar(String firebaseIde) {
        Usuario usuario = usuarioRepository
                .buscarPorFirebaseId(firebaseIde)
                .orElseThrow(UsuarioNaoEncontradoException::new);

        if (!usuario.ativo()) {
            throw new CadastroPrestadorInvalidoException("A conta precisa estar ativa.");
        }

        if (usuario.tipo() != TipoUsuario.PRESTADOR) {
            throw new CadastroPrestadorInvalidoException("Somente contas de prestador possuem perfil profissional.");
        }

        return perfilRepository.buscarPorUsuarioId(usuario.id())
                .orElseThrow(PerfilPrestadorNaoEncontradoException::new);
    }
}