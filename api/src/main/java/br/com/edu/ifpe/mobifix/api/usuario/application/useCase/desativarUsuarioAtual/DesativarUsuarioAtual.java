package br.com.edu.ifpe.mobifix.api.usuario.application.useCase.desativarUsuarioAtual;

import br.com.edu.ifpe.mobifix.api.usuario.domain.port.UsuarioRepository;

public class DesativarUsuarioAtual {
    private final UsuarioRepository repository;

    public DesativarUsuarioAtual(UsuarioRepository repository) {
        this.repository = repository;
    }

    public void executar(String firebaseId) {
        repository.desativarPorFirebaseId(firebaseId);
    }
}
