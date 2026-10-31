package br.com.edu.ifpe.mobifix.api.catalogo.infrastructure.persistence.initializer;

import br.com.edu.ifpe.mobifix.api.catalogo.infrastructure.persistence.entity.TipoVeiculoEntity;
import br.com.edu.ifpe.mobifix.api.catalogo.infrastructure.persistence.repository.TipoVeiculoJpaRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * A classe é executa no momento da inicialização da aplicação
 * e cadastra os tipos de veículos caso necessário.
 */

@Component
public class TipoVeiculoInitializer implements ApplicationRunner {

    private final TipoVeiculoJpaRepository repository;

    public TipoVeiculoInitializer(TipoVeiculoJpaRepository repository) {
        this.repository = repository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<String> nomes = List.of(
                "Carro", "Moto", "Caminhão", "Van", "Ônibus"
        );

        for(String nome : nomes) {
            if (!repository.existsByNome(nome)) {
                repository.save(new TipoVeiculoEntity(nome));
            }
        }
    }
}
