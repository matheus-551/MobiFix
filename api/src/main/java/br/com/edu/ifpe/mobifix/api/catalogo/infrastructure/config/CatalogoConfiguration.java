package br.com.edu.ifpe.mobifix.api.catalogo.infrastructure.config;

import br.com.edu.ifpe.mobifix.api.catalogo.application.ListarEspecialidades;
import br.com.edu.ifpe.mobifix.api.catalogo.application.ListarTiposVeiculo;
import br.com.edu.ifpe.mobifix.api.catalogo.domain.port.EspecialidadeRepository;
import br.com.edu.ifpe.mobifix.api.catalogo.domain.port.TipoVeiculoRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CatalogoConfiguration {

    @Bean
    public ListarTiposVeiculo listarTiposVeiculo(TipoVeiculoRepository repository) {
        return new ListarTiposVeiculo(repository);
    }

    @Bean
    public ListarEspecialidades listarEspecialidades(EspecialidadeRepository repository) {
        return new ListarEspecialidades(repository);
    }
}
