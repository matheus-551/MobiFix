package br.com.edu.ifpe.mobifix.api.prestador.application.useCase.atualizarPerfilPrestador;

import br.com.edu.ifpe.mobifix.api.catalogo.domain.port.EspecialidadeRepository;
import br.com.edu.ifpe.mobifix.api.catalogo.domain.port.TipoVeiculoRepository;
import br.com.edu.ifpe.mobifix.api.prestador.application.ConsultarPerfilPrestadorAtual;
import br.com.edu.ifpe.mobifix.api.prestador.application.exception.CadastroPrestadorInvalidoException;
import br.com.edu.ifpe.mobifix.api.prestador.domain.model.PerfilPrestador;
import br.com.edu.ifpe.mobifix.api.prestador.domain.port.PerfilPrestadorRepository;

public class AtualizarPerfilPrestador {

    private final ConsultarPerfilPrestadorAtual consultarPerfilAtual;
    private final PerfilPrestadorRepository perfilRepository;
    private final TipoVeiculoRepository tipoVeiculoRepository;
    private final EspecialidadeRepository especialidadeRepository;

    public AtualizarPerfilPrestador(
            ConsultarPerfilPrestadorAtual consultarPerfilAtual,
            PerfilPrestadorRepository perfilRepository,
            TipoVeiculoRepository tipoVeiculoRepository,
            EspecialidadeRepository especialidadeRepository
    ) {
        this.consultarPerfilAtual = consultarPerfilAtual;
        this.perfilRepository = perfilRepository;
        this.tipoVeiculoRepository = tipoVeiculoRepository;
        this.especialidadeRepository = especialidadeRepository;
    }

    public PerfilPrestador executar(String firebaseId, AtualizarPerfilPrestadorCommand command) {
        // Reutiliza as verificacoes de conta ativa, tipo PRESTADOR e perfil existente.
        PerfilPrestador atual = consultarPerfilAtual.executar(firebaseId);
        PerfilPrestador atualizado = new PerfilPrestador(
                atual.id(), atual.usuarioId(), command.nomeFantasia(), command.descricao(),
                command.endereco(), command.tiposVeiculoIds(), command.especialidadeIds()
        );

        if (!tipoVeiculoRepository.existemTodosPorIds(atualizado.tiposVeiculoIds())) {
            throw new CadastroPrestadorInvalidoException("Um ou mais tipos de veículos não existem.");
        }
        if (!especialidadeRepository.existemTodosPorIds(atualizado.especialidadeIds())) {
            throw new CadastroPrestadorInvalidoException("Uma ou mais especialidades não existem.");
        }
        return perfilRepository.atualizar(atualizado);
    }
}