package br.com.edu.ifpe.mobifix.api.veiculo.application;

import java.util.List;
import br.com.edu.ifpe.mobifix.api.veiculo.application.exception.VeiculoNaoEncontradoException;
import java.util.Set;
import java.util.UUID;
import br.com.edu.ifpe.mobifix.api.catalogo.domain.port.TipoVeiculoRepository;
import br.com.edu.ifpe.mobifix.api.usuario.application.exception.UsuarioNaoEncontradoException;
import br.com.edu.ifpe.mobifix.api.usuario.domain.model.TipoUsuario;
import br.com.edu.ifpe.mobifix.api.usuario.domain.model.Usuario;
import br.com.edu.ifpe.mobifix.api.usuario.domain.port.UsuarioRepository;
import br.com.edu.ifpe.mobifix.api.veiculo.application.exception.OperacaoVeiculoInvalidaException;
import br.com.edu.ifpe.mobifix.api.veiculo.domain.model.Veiculo;
import br.com.edu.ifpe.mobifix.api.veiculo.domain.port.VeiculoRepository;

public class VeiculosDoCliente {
    private final UsuarioRepository usuarios;
    private final TipoVeiculoRepository tipos;
    private final VeiculoRepository veiculos;

    public VeiculosDoCliente(UsuarioRepository usuarios, TipoVeiculoRepository tipos, VeiculoRepository veiculos) {
        this.usuarios = usuarios;
        this.tipos = tipos;
        this.veiculos = veiculos;
    }

    public Veiculo criar(String firebaseId, CriarVeiculoCommand command) {
        Usuario cliente = consultarCliente(firebaseId);
        Veiculo veiculo = new Veiculo(UUID.randomUUID(), cliente.id(), command.tipoVeiculoId(),
                command.marca(), command.modelo(), command.ano(), command.placa());
        if (!tipos.existemTodosPorIds(Set.of(veiculo.tipoVeiculoId()))) {
            throw new OperacaoVeiculoInvalidaException("O tipo de veículo informado não existe.");
        }
        return veiculos.salvar(veiculo);
    }

    public List<Veiculo> listar(String firebaseId) {
        return veiculos.listarPorClienteId(consultarCliente(firebaseId).id());
    }

    public Veiculo consultar(String firebaseId, UUID id) {
        Usuario cliente = consultarCliente(firebaseId);
        return veiculos.buscarAtivoPorIdEClienteId(id, cliente.id())
                .orElseThrow(VeiculoNaoEncontradoException::new);
    }

    public Veiculo atualizar(String firebaseId, UUID id, AtualizarVeiculoCommand command) {
        Veiculo atual = consultar(firebaseId, id);
        Veiculo atualizado = new Veiculo(atual.id(), atual.clienteId(), command.tipoVeiculoId(),
                command.marca(), command.modelo(), command.ano(), command.placa());
        if (!tipos.existemTodosPorIds(Set.of(atualizado.tipoVeiculoId()))) {
            throw new OperacaoVeiculoInvalidaException("O tipo de veículo informado não existe.");
        }
        return veiculos.atualizar(atualizado);
    }

    public void desativar(String firebaseId, UUID id) {
        Usuario cliente = consultarCliente(firebaseId);
        veiculos.desativar(id, cliente.id());
    }
    private Usuario consultarCliente(String firebaseId) {
        Usuario usuario = usuarios.buscarPorFirebaseId(firebaseId).orElseThrow(UsuarioNaoEncontradoException::new);
        if (!usuario.ativo() || usuario.tipo() != TipoUsuario.CLIENTE) {
            throw new OperacaoVeiculoInvalidaException("A operação exige uma conta de cliente ativa.");
        }
        return usuario;
    }
}
