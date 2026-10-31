package br.com.edu.ifpe.mobifix.api.catalogo.infrastructure.persistence;

import java.util.List;

import br.com.edu.ifpe.mobifix.api.catalogo.infrastructure.persistence.entity.EspecialidadeEntity;
import br.com.edu.ifpe.mobifix.api.catalogo.infrastructure.persistence.repository.EspecialidadeJpaRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class EspecialidadeInitializer implements ApplicationRunner {

    private final EspecialidadeJpaRepository repository;

    public EspecialidadeInitializer(
            EspecialidadeJpaRepository repository
    ) {
        this.repository = repository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<String> nomes = List.of(
                "Freios",
                "Suspensão",
                "Elétrica",
                "Troca de óleo",
                "Motor",
                "Transmissão",
                "Pneus",
                "Ar-condicionado"
        );

        for (String nome : nomes) {
            if (!repository.existsByNome(nome)) {
                repository.save(new EspecialidadeEntity(nome));
            }
        }
    }
}