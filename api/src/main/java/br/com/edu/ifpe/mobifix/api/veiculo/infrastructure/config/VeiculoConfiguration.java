package br.com.edu.ifpe.mobifix.api.veiculo.infrastructure.config;
import br.com.edu.ifpe.mobifix.api.catalogo.domain.port.TipoVeiculoRepository;
import br.com.edu.ifpe.mobifix.api.usuario.domain.port.UsuarioRepository;
import br.com.edu.ifpe.mobifix.api.veiculo.application.VeiculosDoCliente;
import br.com.edu.ifpe.mobifix.api.veiculo.domain.port.VeiculoRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class VeiculoConfiguration {
    @Bean
    public VeiculosDoCliente veiculosDoCliente(UsuarioRepository usuarios, TipoVeiculoRepository tipos, VeiculoRepository veiculos) {
        return new VeiculosDoCliente(usuarios, tipos, veiculos);
    }
}
