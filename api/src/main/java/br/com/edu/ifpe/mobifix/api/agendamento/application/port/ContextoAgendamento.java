package br.com.edu.ifpe.mobifix.api.agendamento.application.port;

import br.com.edu.ifpe.mobifix.api.agenda.domain.model.HorarioAtendimento;
import br.com.edu.ifpe.mobifix.api.usuario.domain.model.TipoUsuario;
import br.com.edu.ifpe.mobifix.api.usuario.domain.model.Usuario;
import br.com.edu.ifpe.mobifix.api.veiculo.domain.model.Veiculo;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

public interface ContextoAgendamento {

    Usuario usuarioAtual(String firebaseId);

    Usuario clienteParaReserva(String firebaseId);

    Optional<Veiculo> veiculoParaReserva(UUID id, UUID clienteId);

    Optional<HorarioAtendimento> horarioParaReserva(UUID id);

    Prestador consultarPrestador(UUID id);

    record Prestador(
            boolean ativo, TipoUsuario tipo, Set<Long> tiposVeiculo, Set<Long> especialidades) {}

    void bloquearVeiculo(UUID id);
}
