package br.com.edu.ifpe.mobifix.api.agenda.infrastructure.persistence;

import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import br.com.edu.ifpe.mobifix.api.agenda.application.geracao.*;
import br.com.edu.ifpe.mobifix.api.agenda.domain.model.HorarioAtendimento;
import br.com.edu.ifpe.mobifix.api.agenda.domain.service.PlanejarAgendaMensal;
import br.com.edu.ifpe.mobifix.api.agenda.infrastructure.scheduler.GeracaoAgendaAutomatica;
import br.com.edu.ifpe.mobifix.api.catalogo.domain.port.*;
import br.com.edu.ifpe.mobifix.api.prestador.domain.model.*;
import br.com.edu.ifpe.mobifix.api.prestador.domain.port.PerfilPrestadorRepository;
import br.com.edu.ifpe.mobifix.api.usuario.application.useCase.desativarUsuarioAtual.DesativarUsuarioAtual;
import br.com.edu.ifpe.mobifix.api.usuario.domain.model.*;
import br.com.edu.ifpe.mobifix.api.usuario.domain.port.UsuarioRepository;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import static org.junit.jupiter.api.Assertions.*;

@EnabledIfSystemProperty(named = "mobifix.test.postgres", matches = "true")
@SpringBootTest
class GeracaoMensalPostgresTest {
    @Autowired UsuarioRepository usuarios;
    @Autowired PerfilPrestadorRepository perfis;
    @Autowired TipoVeiculoRepository tipos;
    @Autowired EspecialidadeRepository especialidades;
    @Autowired GerarAgendaMensal geracao;
    @Autowired GeracaoAgendaMensalPort port;
    @Autowired GeracaoAgendaAutomatica automatica;
    @Autowired DesativarUsuarioAtual desativar;
    @Autowired JdbcTemplate jdbc;
    @Autowired PlatformTransactionManager transactionManager;
    private final List<UUID> usuariosCriados = new ArrayList<>();
    private final List<UUID> perfisCriados = new ArrayList<>();
    private final ZoneId zone = ZoneId.of("America/Sao_Paulo");
    private YearMonth mes;
    private int esperados;
    @BeforeEach
    void configurar() {
        mes = YearMonth.now(zone).plusMonths(1);
        esperados = new PlanejarAgendaMensal().planejar(UUID.randomUUID(), mes).size();
    }
    private PerfilPrestador novoPerfil(TipoUsuario tipo, boolean ativo) {
        return new TransactionTemplate(transactionManager).execute(status -> {
            String firebase = UUID.randomUUID().toString();
            Usuario usuario = usuarios.salvar(new Usuario(UUID.randomUUID(), firebase, "Ana", "Silva", firebase + "@example.com", "81999999999", "PE", tipo, ativo));
            usuariosCriados.add(usuario.id());
            PerfilPrestador perfil = perfis.salvar(new PerfilPrestador(UUID.randomUUID(), usuario.id(), "Oficina", null,
                    new Endereco("Rua A", "10", null, "Centro", "Recife", "PE", "50000000"),
                    Set.of(tipos.listarTodos().getFirst().id()), Set.of(especialidades.listarTodos().getFirst().id())));
            perfisCriados.add(perfil.id());
            return perfil;
        });
    }
    private int quantidade(UUID perfilId) {
        return jdbc.queryForObject("select count(*) from horario_atendimento where prestador_id = ?", Integer.class, perfilId);
    }
    @AfterEach
    void limpar() {
        // Limpa exclusivamente os registros criados por este teste no banco isolado.
        for (UUID id : perfisCriados) {
            jdbc.update("delete from horario_atendimento where prestador_id = ?", id);
            jdbc.update("delete from prestador_especialidade where prestador_id = ?", id);
            jdbc.update("delete from prestador_tipo_veiculo where prestador_id = ?", id);
            jdbc.update("delete from perfil_prestador where id = ?", id);
        }
        for (UUID id : usuariosCriados) jdbc.update("delete from usuario where id = ?", id);
    }
    @Test
    void perfilConfirmadoRecebeAgendaImediataSomenteDoProximoMes() {
        var perfil = novoPerfil(TipoUsuario.PRESTADOR, true);
        assertEquals(esperados, quantidade(perfil.id()));
        assertEquals(0, jdbc.queryForObject("select count(*) from horario_atendimento where prestador_id = ? and (data < ? or data > ?)",
                Integer.class, perfil.id(), java.sql.Date.valueOf(mes.atDay(1)), java.sql.Date.valueOf(mes.atEndOfMonth())));
        assertEquals(0, jdbc.queryForObject("select count(*) from horario_atendimento where prestador_id = ? and (extract(isodow from data) > 5 or capacidade_total <> 3 or bloqueado = true)", Integer.class, perfil.id()));
    }
    @Test
    void reexecucaoNaoDuplicaNemAlteraCapacidadeBloqueioOuHorarioManual() {
        var perfil = novoPerfil(TipoUsuario.PRESTADOR, true);
        var primeiro = new PlanejarAgendaMensal().planejar(perfil.id(), mes).getFirst();
        UUID original = jdbc.queryForObject("select id from horario_atendimento where prestador_id = ? and data = ? and hora_inicio = ?",
                UUID.class, perfil.id(), java.sql.Date.valueOf(primeiro.data()), java.sql.Time.valueOf(primeiro.horaInicio()));
        jdbc.update("update horario_atendimento set capacidade_total = 0, bloqueado = true where id = ?", original);
        UUID manual = UUID.randomUUID();
        jdbc.update("insert into horario_atendimento(id, prestador_id, data, hora_inicio, capacidade_total, bloqueado) values (?, ?, ?, ?, 7, false)",
                manual, perfil.id(), java.sql.Date.valueOf(mes.atDay(1)), java.sql.Time.valueOf("22:30:00"));
        assertEquals(0, geracao.gerarParaPrestador(perfil.id()));
        assertEquals(esperados + 1, quantidade(perfil.id()));
        assertEquals(0, jdbc.queryForObject("select capacidade_total from horario_atendimento where id = ?", Integer.class, original));
        assertEquals(true, jdbc.queryForObject("select bloqueado from horario_atendimento where id = ?", Boolean.class, original));
        assertEquals(7, jdbc.queryForObject("select capacidade_total from horario_atendimento where id = ?", Integer.class, manual));
    }
    @Test
    void inicializacaoRecuperaHorarioAusente() {
        var perfil = novoPerfil(TipoUsuario.PRESTADOR, true);
        jdbc.update("delete from horario_atendimento where id = (select id from horario_atendimento where prestador_id = ? limit 1)", perfil.id());
        assertEquals(esperados - 1, quantidade(perfil.id()));
        automatica.run(new DefaultApplicationArguments());
        assertEquals(esperados, quantidade(perfil.id()));
    }
    @Test
    void clientesEContasInativasNaoRecebemAgenda() {
        var inativo = novoPerfil(TipoUsuario.PRESTADOR, false);
        var cliente = novoPerfil(TipoUsuario.CLIENTE, true);
        assertEquals(0, quantidade(inativo.id())); assertEquals(0, quantidade(cliente.id()));
        assertFalse(port.listarPrestadoresElegiveis().contains(inativo.id()));
        assertFalse(port.listarPrestadoresElegiveis().contains(cliente.id()));
    }
    @Test
    void revalidaContaDesativadaAposListagemSemRecriarHorarios() {
        var perfil = novoPerfil(TipoUsuario.PRESTADOR, true);
        String firebase = jdbc.queryForObject("select firebase_id from usuario where id = ?", String.class, perfil.usuarioId());
        desativar.executar(firebase);
        jdbc.update("delete from horario_atendimento where prestador_id = ?", perfil.id());
        assertEquals(0, geracao.gerarParaPrestador(perfil.id()));
        assertEquals(0, quantidade(perfil.id()));
    }
    @Test
    void duasExecucoesSimultaneasCriamUmaUnicaAgenda() throws Exception {
        var perfil = novoPerfil(TipoUsuario.PRESTADOR, true);
        jdbc.update("delete from horario_atendimento where prestador_id = ?", perfil.id());
        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch inicio = new CountDownLatch(1);
        try {
            Callable<Integer> tarefa = () -> { inicio.await(); return geracao.gerarParaPrestador(perfil.id()); };
            Future<Integer> primeira = executor.submit(tarefa), segunda = executor.submit(tarefa);
            inicio.countDown();
            assertEquals(esperados, primeira.get(30, TimeUnit.SECONDS) + segunda.get(30, TimeUnit.SECONDS));
            assertEquals(esperados, quantidade(perfil.id()));
        } finally { executor.shutdownNow(); }
    }
    @Test
    void transacaoDesfeitaNaoDisparaAgendaInicial() {
        UUID perfilId = UUID.randomUUID();
        new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
            String firebase = UUID.randomUUID().toString();
            Usuario usuario = usuarios.salvar(new Usuario(UUID.randomUUID(), firebase, "Ana", "Silva", firebase + "@example.com", "81999999999", "PE", TipoUsuario.PRESTADOR, true));
            perfis.salvar(new PerfilPrestador(perfilId, usuario.id(), "Oficina", null,
                    new Endereco("Rua A", "10", null, "Centro", "Recife", "PE", "50000000"),
                    Set.of(tipos.listarTodos().getFirst().id()), Set.of(especialidades.listarTodos().getFirst().id())));
            status.setRollbackOnly();
        });
        assertEquals(0, quantidade(perfilId));
        assertEquals(0, jdbc.queryForObject("select count(*) from perfil_prestador where id = ?", Integer.class, perfilId));
    }
    @Test
    void cadastrosSemAssociacoesNaoSaoElegiveis() {
        var perfil = novoPerfil(TipoUsuario.PRESTADOR, true);
        jdbc.update("delete from horario_atendimento where prestador_id = ?", perfil.id());
        jdbc.update("delete from prestador_especialidade where prestador_id = ?", perfil.id());
        assertFalse(port.listarPrestadoresElegiveis().contains(perfil.id()));
        assertEquals(0, geracao.gerarParaPrestador(perfil.id()));
    }
    @Test
    void loteDeOutroPrestadorERejeitado() {
        var perfil = novoPerfil(TipoUsuario.PRESTADOR, true);
        var estranho = new HorarioAtendimento(UUID.randomUUID(), UUID.randomUUID(), mes.atDay(1), LocalTime.NOON, 3, false);
        var erro = assertThrows(org.springframework.dao.InvalidDataAccessApiUsageException.class,
                () -> port.inserirAusentes(perfil.id(), List.of(estranho)));
        assertInstanceOf(IllegalArgumentException.class, erro.getCause());
        assertEquals(esperados, quantidade(perfil.id()));
    }
}
