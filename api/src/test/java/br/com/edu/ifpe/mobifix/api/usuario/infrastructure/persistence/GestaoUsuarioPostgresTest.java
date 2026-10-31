package br.com.edu.ifpe.mobifix.api.usuario.infrastructure.persistence;

import java.util.Set;
import java.util.UUID;
import br.com.edu.ifpe.mobifix.api.catalogo.domain.port.EspecialidadeRepository;
import br.com.edu.ifpe.mobifix.api.catalogo.domain.port.TipoVeiculoRepository;
import br.com.edu.ifpe.mobifix.api.prestador.application.ConsultarPerfilPrestadorAtual;
import br.com.edu.ifpe.mobifix.api.prestador.application.exception.CadastroPrestadorInvalidoException;
import br.com.edu.ifpe.mobifix.api.prestador.domain.model.*;
import br.com.edu.ifpe.mobifix.api.prestador.domain.port.PerfilPrestadorRepository;
import br.com.edu.ifpe.mobifix.api.usuario.application.exception.*;
import br.com.edu.ifpe.mobifix.api.usuario.application.useCase.atualizarUsuarioAtual.*;
import br.com.edu.ifpe.mobifix.api.usuario.application.useCase.consultarUsuarioAtual.ConsultarUsuarioAtual;
import br.com.edu.ifpe.mobifix.api.usuario.application.useCase.criarUsuario.*;
import br.com.edu.ifpe.mobifix.api.usuario.application.useCase.desativarUsuarioAtual.DesativarUsuarioAtual;
import br.com.edu.ifpe.mobifix.api.usuario.domain.model.*;
import br.com.edu.ifpe.mobifix.api.usuario.domain.port.UsuarioRepository;
import br.com.edu.ifpe.mobifix.api.usuario.infrastructure.persistence.repository.UsuarioJpaRepository;
import br.com.edu.ifpe.mobifix.api.veiculo.application.VeiculosDoCliente;
import br.com.edu.ifpe.mobifix.api.veiculo.application.exception.OperacaoVeiculoInvalidaException;
import br.com.edu.ifpe.mobifix.api.veiculo.domain.model.Veiculo;
import br.com.edu.ifpe.mobifix.api.veiculo.domain.port.VeiculoRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import static org.junit.jupiter.api.Assertions.*;

// Execucao opcional contra PostgreSQL isolado, com propriedades spring.datasource.*.
@EnabledIfSystemProperty(named = "mobifix.test.postgres", matches = "true")
@SpringBootTest
@Transactional
class GestaoUsuarioPostgresTest {
    @Autowired UsuarioRepository usuarios;
    @Autowired UsuarioJpaRepository usuariosJpa;
    @Autowired AtualizarUsuarioAtual atualizar;
    @Autowired DesativarUsuarioAtual desativar;
    @Autowired ConsultarUsuarioAtual consultar;
    @Autowired CriarUsuario criar;
    @Autowired VeiculoRepository veiculos;
    @Autowired VeiculosDoCliente veiculosDoCliente;
    @Autowired TipoVeiculoRepository tipos;
    @Autowired EspecialidadeRepository especialidades;
    @Autowired PerfilPrestadorRepository perfis;
    @Autowired ConsultarPerfilPrestadorAtual consultarPerfil;
    @Autowired EntityManager em;

    private Usuario conta(TipoUsuario tipo) {
        String identidade = UUID.randomUUID().toString();
        return usuarios.salvar(new Usuario(UUID.randomUUID(), identidade, "Ana", "Silva", identidade + "@example.com", "81999999999", "PE", tipo, true));
    }
    @Test
    void persisteEdicaoSemAlterarIdentidadeNemOutraConta() {
        Usuario atual = conta(TipoUsuario.CLIENTE);
        Usuario outra = conta(TipoUsuario.CLIENTE);
        atualizar.executar(atual.firebaseId(), new AtualizarUsuarioCommand("Maria", "Souza", "11988888888", "SP"));
        em.flush(); em.clear();
        Usuario salvo = consultar.executar(atual.firebaseId());
        assertEquals(atual.id(), salvo.id());
        assertEquals(atual.email(), salvo.email());
        assertEquals(atual.tipo(), salvo.tipo());
        assertEquals("Maria", salvo.nome());
        assertEquals("Ana", consultar.executar(outra.firebaseId()).nome());
    }
    @Test
    void desativacaoMantemVeiculoEBloqueiaOperacoesERecadastro() {
        Usuario atual = conta(TipoUsuario.CLIENTE);
        Usuario outra = conta(TipoUsuario.CLIENTE);
        Long tipoId = tipos.listarTodos().getFirst().id();
        Veiculo veiculo = veiculos.salvar(new Veiculo(UUID.randomUUID(), atual.id(), tipoId, "Fiat", "Uno", 2020, null));
        desativar.executar(atual.firebaseId());
        em.flush(); em.clear();
        assertFalse(consultar.executar(atual.firebaseId()).ativo());
        assertTrue(usuariosJpa.existsById(atual.id()));
        assertEquals(veiculo.id(), veiculos.listarPorClienteId(atual.id()).getFirst().id());
        assertTrue(consultar.executar(outra.firebaseId()).ativo());
        assertThrows(OperacaoVeiculoInvalidaException.class, () -> veiculosDoCliente.listar(atual.firebaseId()));
        assertThrows(UsuarioInativoException.class, () -> atualizar.executar(atual.firebaseId(), new AtualizarUsuarioCommand("Maria", "Souza", "11988888888", "SP")));
        assertThrows(UsuarioJaCadastradoException.class, () -> criar.executar(atual.firebaseId(), new CriarUsuarioCommand("Ana", "Silva", atual.email(), "81999999999", "PE", TipoUsuario.CLIENTE)));
    }
    @Test
    void desativacaoMantemPerfilProfissionalESuasAssociacoes() {
        Usuario atual = conta(TipoUsuario.PRESTADOR);
        Long tipoId = tipos.listarTodos().getFirst().id();
        Long especialidadeId = especialidades.listarTodos().getFirst().id();
        PerfilPrestador perfil = perfis.salvar(new PerfilPrestador(UUID.randomUUID(), atual.id(), "Oficina", null,
                new Endereco("Rua A", "10", null, "Centro", "Recife", "PE", "50000000"), Set.of(tipoId), Set.of(especialidadeId)));
        desativar.executar(atual.firebaseId());
        em.flush(); em.clear();
        PerfilPrestador preservado = perfis.buscarPorUsuarioId(atual.id()).orElseThrow();
        assertEquals(perfil.id(), preservado.id());
        assertEquals(Set.of(tipoId), preservado.tiposVeiculoIds());
        assertEquals(Set.of(especialidadeId), preservado.especialidadeIds());
        assertThrows(CadastroPrestadorInvalidoException.class, () -> consultarPerfil.executar(atual.firebaseId()));
    }
    @Test
    void repetirDesativacaoNaoApagaConta() {
        Usuario atual = conta(TipoUsuario.CLIENTE);
        desativar.executar(atual.firebaseId());
        desativar.executar(atual.firebaseId());
        em.flush(); em.clear();
        assertFalse(consultar.executar(atual.firebaseId()).ativo());
        assertTrue(usuariosJpa.existsById(atual.id()));
    }
}
