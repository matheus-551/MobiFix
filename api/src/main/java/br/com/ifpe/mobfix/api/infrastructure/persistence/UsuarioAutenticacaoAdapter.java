package br.com.ifpe.mobfix.api.infrastructure.persistence;

import br.com.ifpe.mobfix.api.application.auth.BuscarUsuarioPorFirebaseUid;
import br.com.ifpe.mobfix.api.application.auth.UsuarioAutenticado;
import br.com.ifpe.mobfix.api.infrastructure.persistence.repository.UsuarioRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;

@Component
public class UsuarioAutenticacaoAdapter implements BuscarUsuarioPorFirebaseUid {
    private final UsuarioRepository repository;

    public UsuarioAutenticacaoAdapter(UsuarioRepository repository) {
        this.repository = repository;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<UsuarioAutenticado> buscarAtivo(String firebaseUid) {
        return repository.findByFirebaseUid(firebaseUid)
            .filter(usuario -> Boolean.TRUE.equals(usuario.getHabilitado()))
            .filter(usuario -> "ATIVO".equals(usuario.getStatus()))
            .filter(usuario -> "CLIENTE".equals(usuario.getPapel()) || "PRESTADOR".equals(usuario.getPapel()))
            .map(usuario -> new UsuarioAutenticado(usuario.getId(), usuario.getFirebaseUid(),
                usuario.getEmail(), usuario.getPapel()));
    }
}
