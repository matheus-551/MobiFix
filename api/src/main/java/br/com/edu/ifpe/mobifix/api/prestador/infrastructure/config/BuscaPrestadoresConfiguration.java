package br.com.edu.ifpe.mobifix.api.prestador.infrastructure.config;

import br.com.edu.ifpe.mobifix.api.prestador.application.busca.BuscarPrestadores;
import br.com.edu.ifpe.mobifix.api.prestador.application.busca.PrestadorPublicoConsulta;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class BuscaPrestadoresConfiguration {
    @Bean
    public BuscarPrestadores buscarPrestadores(PrestadorPublicoConsulta consulta) {
        return new BuscarPrestadores(consulta);
    }
}
