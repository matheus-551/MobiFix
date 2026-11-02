package br.com.edu.ifpe.mobifix.api.veiculo.domain.port;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import br.com.edu.ifpe.mobifix.api.veiculo.domain.model.Veiculo;

public interface VeiculoRepository {
    Veiculo salvar(Veiculo veiculo);
    List<Veiculo> listarPorClienteId(UUID clienteId);
    Optional<Veiculo> buscarAtivoPorIdEClienteId(UUID id, UUID clienteId);
    Veiculo atualizar(Veiculo veiculo);
    void desativar(UUID id, UUID clienteId);
}
