package br.com.edu.ifpe.mobifix.api.prestador.application;

import java.util.UUID;

import br.com.edu.ifpe.mobifix.api.catalogo.domain.port.EspecialidadeRepository;
import br.com.edu.ifpe.mobifix.api.catalogo.domain.port.TipoVeiculoRepository;

import br.com.edu.ifpe.mobifix.api.prestador.application.exception.CadastroPrestadorInvalidoException;
import br.com.edu.ifpe.mobifix.api.prestador.application.exception.PerfilPrestadorJaCadastradoException;
import br.com.edu.ifpe.mobifix.api.prestador.application.useCase.criarPerfilPrestador.CriarPerfilPrestadorCommand;
import br.com.edu.ifpe.mobifix.api.prestador.domain.model.PerfilPrestador;
import br.com.edu.ifpe.mobifix.api.prestador.domain.port.PerfilPrestadorRepository;

import br.com.edu.ifpe.mobifix.api.usuario.application.exception.UsuarioNaoEncontradoException;
import br.com.edu.ifpe.mobifix.api.usuario.domain.model.TipoUsuario;
import br.com.edu.ifpe.mobifix.api.usuario.domain.model.Usuario;
import br.com.edu.ifpe.mobifix.api.usuario.domain.port.UsuarioRepository;

public class CriarPerfilPrestador {

    private final UsuarioRepository usuarioRepository;
    private final PerfilPrestadorRepository perfilRepository;
    private final TipoVeiculoRepository tipoVeiculoRepository;
    private final EspecialidadeRepository especialidadeRepository;

    public CriarPerfilPrestador(UsuarioRepository usuarioRepository, PerfilPrestadorRepository perfilRepository, TipoVeiculoRepository tipoVeiculoRepository, EspecialidadeRepository especialidadeRepository) {
        this.usuarioRepository = usuarioRepository;
        this.perfilRepository = perfilRepository;
        this.tipoVeiculoRepository = tipoVeiculoRepository;
        this.especialidadeRepository = especialidadeRepository;
    }

    public PerfilPrestador executar(
            String firebaseIde,
            CriarPerfilPrestadorCommand command
    ) {
        Usuario usuario = usuarioRepository.buscarPorFirebaseId(firebaseIde)
                .orElseThrow(UsuarioNaoEncontradoException::new);

        if (!usuario.ativo()) {
            throw new CadastroPrestadorInvalidoException("A conta precisa estar ativa.");
        }

        if (usuario.tipo() != TipoUsuario.PRESTADOR) {
            throw new CadastroPrestadorInvalidoException("Somente contas de prestador podem criar um perfil profissional.");
        }

        if (perfilRepository.existePorUsuarioId(usuario.id())) {
            throw new PerfilPrestadorJaCadastradoException();
        }

        PerfilPrestador perfil = new PerfilPrestador(
                UUID.randomUUID(),
                usuario.id(),
                command.nomeFantasia(),
                command.descricao(),
                command.endereco(),
                command.tiposVeiculoIds(),
                command.especialidadeIds()
        );

        if (!tipoVeiculoRepository.existemTodosPorIds(perfil.tiposVeiculoIds())) {
            throw new CadastroPrestadorInvalidoException("Um ou mais tipos de veículos não existem.");
        }

        if (!especialidadeRepository.existemTodosPorIds(perfil.especialidadeIds())) {
            throw new CadastroPrestadorInvalidoException("Uma ou mais especialidades não existem.");
        }

        return perfilRepository.salvar(perfil);
    }
}