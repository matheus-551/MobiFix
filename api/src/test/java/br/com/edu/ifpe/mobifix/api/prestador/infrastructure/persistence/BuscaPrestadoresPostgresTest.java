package br.com.edu.ifpe.mobifix.api.prestador.infrastructure.persistence;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import br.com.edu.ifpe.mobifix.api.catalogo.domain.port.EspecialidadeRepository;
import br.com.edu.ifpe.mobifix.api.catalogo.domain.port.TipoVeiculoRepository;
import br.com.edu.ifpe.mobifix.api.prestador.application.busca.*;
import br.com.edu.ifpe.mobifix.api.prestador.domain.model.Endereco;
import br.com.edu.ifpe.mobifix.api.prestador.domain.model.PerfilPrestador;
import br.com.edu.ifpe.mobifix.api.prestador.domain.port.PerfilPrestadorRepository;
import br.com.edu.ifpe.mobifix.api.usuario.application.useCase.desativarUsuarioAtual.DesativarUsuarioAtual;
import br.com.edu.ifpe.mobifix.api.usuario.domain.model.*;
import br.com.edu.ifpe.mobifix.api.usuario.domain.port.UsuarioRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import static org.junit.jupiter.api.Assertions.*;

@EnabledIfSystemProperty(named = "mobifix.test.postgres", matches = "true")
@SpringBootTest
@Transactional
class BuscaPrestadoresPostgresTest {
    @Autowired BuscarPrestadores busca;
    @Autowired UsuarioRepository usuarios;
    @Autowired PerfilPrestadorRepository perfis;
    @Autowired TipoVeiculoRepository tipos;
    @Autowired EspecialidadeRepository especialidades;
    @Autowired DesativarUsuarioAtual desativar;
    @Autowired EntityManager em;
    private Long tipo1, tipo2, esp1, esp2;
    private PerfilPrestador oficinaA, oficinaB, autonomo, inativo, clienteComPerfil;

    private Usuario conta(TipoUsuario tipo, boolean ativo) {
        String identidade = UUID.randomUUID().toString();
        return usuarios.salvar(new Usuario(UUID.randomUUID(), identidade, "João", "Silva", identidade + "@example.com", "81999999999", "PE", tipo, ativo));
    }
    private PerfilPrestador perfil(TipoUsuario tipo, boolean ativo, String nome, String cidade, String uf, Set<Long> idsTipos, Set<Long> idsEsp) {
        Usuario usuario = conta(tipo, ativo);
        return perfis.salvar(new PerfilPrestador(UUID.randomUUID(), usuario.id(), nome, "Descrição pública",
                new Endereco("Rua privada", "10", null, "Centro", cidade, uf, "50000000"), idsTipos, idsEsp));
    }
    @BeforeEach
    void dados() {
        tipo1 = tipos.listarTodos().get(0).id(); tipo2 = tipos.listarTodos().get(1).id();
        esp1 = especialidades.listarTodos().get(0).id(); esp2 = especialidades.listarTodos().get(1).id();
        oficinaA = perfil(TipoUsuario.PRESTADOR, true, "Oficina", "Recife", "PE", Set.of(tipo1, tipo2), Set.of(esp1, esp2));
        oficinaB = perfil(TipoUsuario.PRESTADOR, true, "Oficina", "Olinda", "PE", Set.of(tipo2), Set.of(esp2));
        autonomo = perfil(TipoUsuario.PRESTADOR, true, null, "Recife", "PE", Set.of(tipo1), Set.of(esp1));
        perfil(TipoUsuario.PRESTADOR, true, "Outra oficina", "Recife", "SP", Set.of(tipo1), Set.of(esp2));
        inativo = perfil(TipoUsuario.PRESTADOR, false, "Inativo", "Recife", "PE", Set.of(tipo1), Set.of(esp1));
        clienteComPerfil = perfil(TipoUsuario.CLIENTE, true, "Cliente", "Recife", "PE", Set.of(tipo1), Set.of(esp1));
        conta(TipoUsuario.PRESTADOR, true); // Cadastro incompleto: sem perfil profissional.
        em.flush(); em.clear();
    }
    private FiltroPrestadores filtro(Long tipo, Long esp, String uf, String cidade, int page, int size) {
        return new FiltroPrestadores(tipo, esp, uf, cidade, page, size);
    }
    private List<UUID> ids(PaginaPrestadores pagina) {
        return pagina.content().stream().map(PrestadorPublico::id).toList();
    }
    @Test
    void listaSomentePrestadoresAtivosComPerfilSemDuplicar() {
        var resultado = busca.executar(filtro(null, null, null, null, 0, 20));
        assertEquals(4, resultado.totalElements());
        assertEquals(4, Set.copyOf(ids(resultado)).size());
        assertFalse(ids(resultado).contains(inativo.id()));
        assertFalse(ids(resultado).contains(clienteComPerfil.id()));
    }
    @Test
    void aplicaFiltrosIndividualmente() {
        assertEquals(3, busca.executar(filtro(tipo1, null, null, null, 0, 20)).totalElements());
        assertEquals(2, busca.executar(filtro(null, esp1, null, null, 0, 20)).totalElements());
        assertEquals(3, busca.executar(filtro(null, null, "PE", null, 0, 20)).totalElements());
        assertEquals(3, busca.executar(filtro(null, null, null, "recife", 0, 20)).totalElements());
    }
    @Test
    void combinaTodosOsFiltrosComAnd() {
        var resultado = busca.executar(filtro(tipo2, esp1, "pe", " Recife ", 0, 20));
        assertEquals(List.of(oficinaA.id()), ids(resultado));
        assertEquals(2, resultado.content().getFirst().tiposVeiculo().size());
        assertEquals(2, resultado.content().getFirst().especialidades().size());
    }
    @Test
    void paginacaoMantemTotalEOrdemMesmoComNomesIguais() {
        var todos = busca.executar(filtro(null, null, null, null, 0, 20));
        var pagina0 = busca.executar(filtro(null, null, null, null, 0, 2));
        var pagina1 = busca.executar(filtro(null, null, null, null, 1, 2));
        assertEquals(4, pagina0.totalElements());
        assertEquals(2, pagina0.totalPages());
        assertEquals(ids(todos).subList(0, 2), ids(pagina0));
        assertEquals(ids(todos).subList(2, 4), ids(pagina1));
        assertEquals(ids(pagina0), ids(busca.executar(filtro(null, null, null, null, 0, 2))));
        var fora = busca.executar(filtro(null, null, null, null, 10, 2));
        assertTrue(fora.content().isEmpty());
        assertEquals(4, fora.totalElements());
    }
    @Test
    void catalogoInexistenteRetornaPaginaVazia() {
        var resultado = busca.executar(filtro(Long.MAX_VALUE, null, null, null, 0, 20));
        assertTrue(resultado.content().isEmpty());
        assertEquals(0, resultado.totalElements());
    }
    @Test
    void detalheTrazNomeProfissionalQuandoNaoHaFantasia() {
        assertEquals("João Silva", busca.consultar(autonomo.id()).nome());
        assertEquals("Oficina", busca.consultar(oficinaA.id()).nome());
    }
    @Test
    void detalheIndisponivelNaoRevelaExistencia() {
        assertThrows(PrestadorPublicoNaoEncontradoException.class, () -> busca.consultar(inativo.id()));
        assertThrows(PrestadorPublicoNaoEncontradoException.class, () -> busca.consultar(clienteComPerfil.id()));
        assertThrows(PrestadorPublicoNaoEncontradoException.class, () -> busca.consultar(UUID.randomUUID()));
    }
    @Test
    void alteracoesDoPerfilRefletemNaBusca() {
        perfis.atualizar(new PerfilPrestador(oficinaB.id(), oficinaB.usuarioId(), "Atualizada", null,
                new Endereco("Rua B", "20", null, "Centro", "Recife", "PE", "50000000"), Set.of(tipo1), Set.of(esp1)));
        em.flush(); em.clear();
        var resultado = busca.executar(filtro(tipo1, esp1, "PE", "Recife", 0, 20));
        assertTrue(ids(resultado).contains(oficinaB.id()));
        assertEquals("Atualizada", busca.consultar(oficinaB.id()).nome());
    }
    @Test
    void desativacaoRemoveDaBuscaEDoDetalhe() {
        String firebaseId = em.find(br.com.edu.ifpe.mobifix.api.usuario.infrastructure.persistence.entity.UsuarioEntity.class, oficinaA.usuarioId()).getFirebaseId();
        desativar.executar(firebaseId);
        em.flush(); em.clear();
        assertEquals(3, busca.executar(filtro(null, null, null, null, 0, 20)).totalElements());
        assertThrows(PrestadorPublicoNaoEncontradoException.class, () -> busca.consultar(oficinaA.id()));
    }
}
