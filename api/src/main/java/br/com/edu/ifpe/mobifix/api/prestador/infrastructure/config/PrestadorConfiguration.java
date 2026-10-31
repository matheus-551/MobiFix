package br.com.edu.ifpe.mobifix.api.prestador.infrastructure.config;

import br.com.edu.ifpe.mobifix.api.catalogo.domain.port.EspecialidadeRepository;
import br.com.edu.ifpe.mobifix.api.catalogo.domain.port.TipoVeiculoRepository;

import br.com.edu.ifpe.mobifix.api.prestador.application.ConsultarPerfilPrestadorAtual;
import br.com.edu.ifpe.mobifix.api.prestador.application.CriarPerfilPrestador;
import br.com.edu.ifpe.mobifix.api.prestador.domain.port.PerfilPrestadorRepository;

import br.com.edu.ifpe.mobifix.api.usuario.domain.port.UsuarioRepository;

import br.com.edu.ifpe.mobifix.api.prestador.application.useCase.atualizarPerfilPrestador.AtualizarPerfilPrestador;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class PrestadorConfiguration {

    @Bean
    public AtualizarPerfilPrestador atualizarPerfilPrestador(
            ConsultarPerfilPrestadorAtual consultarPerfilAtual,
            PerfilPrestadorRepository perfilRepository,
            TipoVeiculoRepository tipoVeiculoRepository,
            EspecialidadeRepository especialidadeRepository
    ) {
        return new AtualizarPerfilPrestador(
                consultarPerfilAtual, perfilRepository,
                tipoVeiculoRepository, especialidadeRepository
        );
    }
    @Bean
    public CriarPerfilPrestador criarPerfilPrestador(UsuarioRepository usuarioRepository, PerfilPrestadorRepository perfilRepository, TipoVeiculoRepository tipoVeiculoRepository, EspecialidadeRepository especialidadeRepository) {
        return new CriarPerfilPrestador(
                usuarioRepository,
                perfilRepository,
                tipoVeiculoRepository,
                especialidadeRepository
        );
    }

    @Bean
    public ConsultarPerfilPrestadorAtual consultarPerfilPrestadorAtual(UsuarioRepository usuarioRepository, PerfilPrestadorRepository perfilRepository) {
        return new ConsultarPerfilPrestadorAtual(
                usuarioRepository,
                perfilRepository
        );
    }
}