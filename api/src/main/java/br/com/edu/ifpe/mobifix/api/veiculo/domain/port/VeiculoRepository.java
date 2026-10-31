package br.com.edu.ifpe.mobifix.api.veiculo.domain.port;
import java.util.List;
import java.util.UUID;
import br.com.edu.ifpe.mobifix.api.veiculo.domain.model.Veiculo;

public interface VeiculoRepository {
    Veiculo salvar(Veiculo veiculo);
    List<Veiculo> listarPorClienteId(UUID clienteId);
}
