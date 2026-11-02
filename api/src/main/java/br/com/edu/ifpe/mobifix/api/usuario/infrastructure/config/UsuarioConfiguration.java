package br.com.edu.ifpe.mobifix.api.usuario.infrastructure.config;

import br.com.edu.ifpe.mobifix.api.usuario.application.useCase.consultarUsuarioAtual.ConsultarUsuarioAtual;
import br.com.edu.ifpe.mobifix.api.usuario.application.useCase.criarUsuario.CriarUsuario;
import br.com.edu.ifpe.mobifix.api.usuario.domain.port.UsuarioRepository;

import br.com.edu.ifpe.mobifix.api.usuario.application.useCase.atualizarUsuarioAtual.AtualizarUsuarioAtual;
import br.com.edu.ifpe.mobifix.api.usuario.application.useCase.desativarUsuarioAtual.DesativarUsuarioAtual;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class UsuarioConfiguration {
    @Bean
    public AtualizarUsuarioAtual atualizarUsuarioAtual(UsuarioRepository repository) {
        return new AtualizarUsuarioAtual(repository);
    }

    @Bean
    public DesativarUsuarioAtual desativarUsuarioAtual(UsuarioRepository repository) {
        return new DesativarUsuarioAtual(repository);
    }

    @Bean
    public CriarUsuario criarUsuario(UsuarioRepository repository) {
        return new CriarUsuario(repository);
    }

    @Bean
    public ConsultarUsuarioAtual consultarUsuarioAtual(UsuarioRepository repository) { return new ConsultarUsuarioAtual(repository);}
}
