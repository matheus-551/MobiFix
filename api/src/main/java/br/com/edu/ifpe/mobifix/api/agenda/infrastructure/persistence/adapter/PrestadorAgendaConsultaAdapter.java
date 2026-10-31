package br.com.edu.ifpe.mobifix.api.agenda.infrastructure.persistence.adapter;

import java.util.UUID;
import br.com.edu.ifpe.mobifix.api.agenda.application.PrestadorAgendaConsulta;
import br.com.edu.ifpe.mobifix.api.prestador.infrastructure.persistence.repository.PerfilPrestadorJpaRepository;
import br.com.edu.ifpe.mobifix.api.usuario.domain.model.TipoUsuario;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public class PrestadorAgendaConsultaAdapter implements PrestadorAgendaConsulta {
    private final PerfilPrestadorJpaRepository repository;
    public PrestadorAgendaConsultaAdapter(PerfilPrestadorJpaRepository repository) { this.repository = repository; }
    @Override
    @Transactional(readOnly = true)
    public boolean estaDisponivel(UUID prestadorId) {
        return repository.findById(prestadorId)
                .filter(perfil -> perfil.getUsuario().isAtivo() && perfil.getUsuario().getTipo() == TipoUsuario.PRESTADOR).isPresent();
    }
}
