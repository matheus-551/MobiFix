package br.com.edu.ifpe.mobifix.api.usuario.infrastructure.config;

import br.com.edu.ifpe.mobifix.api.usuario.application.useCase.consultarUsuarioAtual.ConsultarUsuarioAtual;
import br.com.edu.ifpe.mobifix.api.usuario.application.useCase.criarUsuario.CriarUsuario;
import br.com.edu.ifpe.mobifix.api.usuario.domain.port.UsuarioRepository;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class UsuarioConfiguration {

    @Bean
    public CriarUsuario criarUsuario(UsuarioRepository repository) {
        return new CriarUsuario(repository);
    }

    @Bean
    public ConsultarUsuarioAtual consultarUsuarioAtual(UsuarioRepository repository) { return new ConsultarUsuarioAtual(repository);}
}