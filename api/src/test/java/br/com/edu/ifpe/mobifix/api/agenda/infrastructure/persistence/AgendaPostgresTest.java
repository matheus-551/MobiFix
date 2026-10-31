package br.com.edu.ifpe.mobifix.api.agenda.infrastructure.persistence;

import java.time.*;
import java.util.*;
import br.com.edu.ifpe.mobifix.api.agenda.application.*;
import br.com.edu.ifpe.mobifix.api.agenda.application.exception.*;
import br.com.edu.ifpe.mobifix.api.agenda.domain.model.HorarioAtendimento;
import br.com.edu.ifpe.mobifix.api.agenda.domain.port.HorarioAtendimentoRepository;
import br.com.edu.ifpe.mobifix.api.agenda.infrastructure.persistence.repository.HorarioAtendimentoJpaRepository;
import br.com.edu.ifpe.mobifix.api.catalogo.domain.port.*;
import br.com.edu.ifpe.mobifix.api.prestador.domain.model.*;
import br.com.edu.ifpe.mobifix.api.prestador.domain.port.PerfilPrestadorRepository;
import br.com.edu.ifpe.mobifix.api.prestador.application.exception.CadastroPrestadorInvalidoException;
import br.com.edu.ifpe.mobifix.api.usuario.application.useCase.desativarUsuarioAtual.DesativarUsuarioAtual;
import br.com.edu.ifpe.mobifix.api.usuario.domain.model.*;
import br.com.edu.ifpe.mobifix.api.usuario.domain.port.UsuarioRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.annotation.Transactional;
import static org.junit.jupiter.api.Assertions.*;

@EnabledIfSystemProperty(named = "mobifix.test.postgres", matches = "true")
@SpringBootTest
@Transactional
class AgendaPostgresTest {
    @Autowired GerenciarAgenda agenda;
    @Autowired UsuarioRepository usuarios;
    @Autowired PerfilPrestadorRepository perfis;
    @Autowired TipoVeiculoRepository tipos;
    @Autowired EspecialidadeRepository especialidades;
    @Autowired HorarioAtendimentoRepository horarios;
    @Autowired HorarioAtendimentoJpaRepository horariosJpa;
    @Autowired DesativarUsuarioAtual desativar;
    @Autowired EntityManager em;
    private Usuario usuario;
    private PerfilPrestador perfil;
    private LocalDate amanha;

    private Usuario conta(TipoUsuario tipo) {
        String firebase = UUID.randomUUID().toString();
        return usuarios.salvar(new Usuario(UUID.randomUUID(), firebase, "Ana", "Silva", firebase + "@example.com", "81999999999", "PE", tipo, true));
    }
    private PerfilPrestador perfil(Usuario usuario) {
        return perfis.salvar(new PerfilPrestador(UUID.randomUUID(), usuario.id(), "Oficina", null,
                new Endereco("Rua A", "10", null, "Centro", "Recife", "PE", "50000000"),
                Set.of(tipos.listarTodos().getFirst().id()), Set.of(especialidades.listarTodos().getFirst().id())));
    }
    @BeforeEach
    void dados() {
        usuario = conta(TipoUsuario.PRESTADOR);
        perfil = perfil(usuario);
        amanha = LocalDate.now(ZoneId.of("America/Sao_Paulo")).plusDays(1);
        em.flush(); em.clear();
    }
    private HorarioAtendimento criar(LocalTime hora, int capacidade) {
        return agenda.criar(usuario.firebaseId(), new CriarHorarioCommand(amanha, hora, capacidade));
    }
    @Test
    void criaEConsultaPersistidoEmOrdem() {
        criar(LocalTime.of(10, 30), 5);
        var primeiro = criar(LocalTime.of(8, 30), 3);
        em.flush(); em.clear();
        var lista = agenda.listarMeus(usuario.firebaseId(), amanha, amanha);
        assertEquals(2, lista.size()); assertEquals(primeiro.id(), lista.getFirst().id());
        assertEquals(3, lista.getFirst().capacidadeTotal());
    }
    @Test
    void mesmoHorarioPodeExistirParaOutroPrestador() {
        criar(LocalTime.NOON, 3);
        Usuario outraConta = conta(TipoUsuario.PRESTADOR);
        PerfilPrestador outro = perfil(outraConta);
        var horario = agenda.criar(outraConta.firebaseId(), new CriarHorarioCommand(amanha, LocalTime.NOON, 3));
        assertEquals(outro.id(), horario.prestadorId());
    }
    @Test
    void duplicidadeERejeitadaPeloCasoDeUso() {
        criar(LocalTime.NOON, 3);
        assertThrows(HorarioDuplicadoException.class, () -> criar(LocalTime.NOON, 5));
    }
    @Test
    void restricaoUnicaNoBancoProtegeContraConcorrencia() {
        criar(LocalTime.NOON, 3);
        assertThrows(DataIntegrityViolationException.class, () -> horarios.salvar(
                new HorarioAtendimento(UUID.randomUUID(), perfil.id(), amanha, LocalTime.NOON, 3, false)));
    }
    @Test
    void atualizaCapacidadeEBloqueioPreservandoIdentidadeDataEHora() {
        var original = criar(LocalTime.NOON, 3);
        agenda.atualizar(usuario.firebaseId(), original.id(), new AtualizarHorarioCommand(5, true));
        em.flush(); em.clear();
        var salvo = horarios.buscarPorIdEPrestadorId(original.id(), perfil.id()).orElseThrow();
        assertEquals(5, salvo.capacidadeTotal()); assertTrue(salvo.bloqueado());
        assertEquals(original.data(), salvo.data()); assertEquals(original.horaInicio(), salvo.horaInicio());
        assertEquals(original.id(), salvo.id()); assertEquals(original.prestadorId(), salvo.prestadorId());
        agenda.atualizar(usuario.firebaseId(), original.id(), new AtualizarHorarioCommand(0, false));
        assertTrue(agenda.listarPublicos(perfil.id(), amanha, amanha).isEmpty());
        agenda.atualizar(usuario.firebaseId(), original.id(), new AtualizarHorarioCommand(2, false));
        assertEquals(2, agenda.listarPublicos(perfil.id(), amanha, amanha).getFirst().capacidadeTotal());
    }
    @Test
    void consultaPublicaExcluiPassadosBloqueadosSemVagasEOutrosPrestadores() {
        var aberto = criar(LocalTime.of(8, 0), 3);
        var fechado = criar(LocalTime.of(9, 0), 3);
        agenda.atualizar(usuario.firebaseId(), fechado.id(), new AtualizarHorarioCommand(3, true));
        criar(LocalTime.of(10, 0), 0);
        horarios.salvar(new HorarioAtendimento(UUID.randomUUID(), perfil.id(), amanha.minusDays(2), LocalTime.NOON, 3, false));
        Usuario outraConta = conta(TipoUsuario.PRESTADOR);
        perfil(outraConta);
        agenda.criar(outraConta.firebaseId(), new CriarHorarioCommand(amanha, LocalTime.of(8, 0), 3));
        em.flush(); em.clear();
        var lista = agenda.listarPublicos(perfil.id(), amanha.minusDays(2), amanha);
        assertEquals(List.of(aberto.id()), lista.stream().map(HorarioAtendimento::id).toList());
        assertEquals(4, agenda.listarMeus(usuario.firebaseId(), amanha.minusDays(2), amanha).size());
    }
    @Test
    void outroPrestadorNaoConsegueEditarHorario() {
        var horario = criar(LocalTime.NOON, 3);
        Usuario outro = conta(TipoUsuario.PRESTADOR);
        perfil(outro);
        assertThrows(HorarioNaoEncontradoException.class, () -> agenda.atualizar(outro.firebaseId(), horario.id(), new AtualizarHorarioCommand(10, true)));
        assertEquals(3, horarios.buscarPorIdEPrestadorId(horario.id(), perfil.id()).orElseThrow().capacidadeTotal());
    }
    @Test
    void desativacaoDaContaOcultaAgendaSemExcluirHorarios() {
        var horario = criar(LocalTime.NOON, 3);
        desativar.executar(usuario.firebaseId());
        em.flush(); em.clear();
        assertThrows(HorarioNaoEncontradoException.class, () -> agenda.listarPublicos(perfil.id(), amanha, amanha));
        assertThrows(CadastroPrestadorInvalidoException.class, () -> agenda.listarMeus(usuario.firebaseId(), amanha, amanha));
        assertTrue(horariosJpa.existsById(horario.id()));
    }
    @Test
    void contaClienteNaoPodeCriarHorario() {
        Usuario cliente = conta(TipoUsuario.CLIENTE);
        assertThrows(CadastroPrestadorInvalidoException.class, () -> agenda.criar(cliente.firebaseId(), new CriarHorarioCommand(amanha, LocalTime.NOON, 3)));
    }
    @Test
    void prestadorSemHorariosTemDisponibilidadeVaziaEInexistenteRetorna404() {
        assertTrue(agenda.listarPublicos(perfil.id(), amanha, amanha).isEmpty());
        assertThrows(HorarioNaoEncontradoException.class, () -> agenda.listarPublicos(UUID.randomUUID(), amanha, amanha));
    }
}
