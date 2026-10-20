package br.com.ifpe.mobfix.api;

import br.com.ifpe.mobfix.api.infrastructure.persistence.entity.*;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.AuditorAware;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties = "firebase.project-id=mobifix-test")
@Transactional
@Import(AuditoriaPersistenceTests.AuditorConfig.class)
class AuditoriaPersistenceTests {

    private static final UUID AUTOR = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @TestConfiguration
    static class AuditorConfig {
        @Bean
        @org.springframework.context.annotation.Primary
        AuditorAware<UUID> auditorDeTeste() {
            return () -> Optional.of(AUTOR);
        }
    }

    @Autowired
    private EntityManager entityManager;

    @Test
    void deveRegistrarCriacaoEAtualizacaoSemAlterarDadosDaCriacao() {
        TipoVeiculo tipo = new TipoVeiculo();
        tipo.setNome("Carro-" + UUID.randomUUID());
        entityManager.persist(tipo);
        entityManager.flush();
        UUID id = tipo.getId();
        entityManager.clear();
        tipo = entityManager.find(TipoVeiculo.class, id);
        LocalDateTime criacao = tipo.getCriadoEm();
        assertNotNull(criacao);
        assertNotNull(tipo.getAtualizadoEm());
        assertEquals(AUTOR, tipo.getCriadoPor());
        assertEquals(AUTOR, tipo.getAtualizadoPor());
        assertEquals(0L, tipo.getVersao());
        assertTrue(tipo.getHabilitado());
        tipo.setNome("Moto-" + UUID.randomUUID());
        entityManager.flush();
        entityManager.clear();
        tipo = entityManager.find(TipoVeiculo.class, id);
        assertEquals(criacao, tipo.getCriadoEm());
        assertFalse(tipo.getAtualizadoEm().isBefore(criacao));
        assertEquals(1L, tipo.getVersao());
        assertEquals(AUTOR, tipo.getCriadoPor());
    }

    @Test
    void deveAuditarPerfisEAssociacoesPreservandoChaves() {
        Usuario usuario = new Usuario();
        String sufixo = UUID.randomUUID().toString();
        usuario.setFirebaseUid(sufixo);
        usuario.setEmail(sufixo + "@example.com");
        usuario.setPapel("PRESTADOR");
        usuario.setStatus("ATIVO");
        usuario.setEmailVerificado(true);
        entityManager.persist(usuario);
        PerfilPrestador prestador = new PerfilPrestador();
        prestador.setUsuario(usuario);
        prestador.setNomeExibicao("Oficina");
        entityManager.persist(prestador);
        Especialidade especialidade = new Especialidade();
        especialidade.setNome("Mecanica-" + sufixo);
        especialidade.setAtivo(true);
        entityManager.persist(especialidade);
        PrestadorEspecialidade vinculo = new PrestadorEspecialidade();
        vinculo.setPrestador(prestador);
        vinculo.setEspecialidade(especialidade);
        entityManager.persist(vinculo);
        entityManager.flush();
        PrestadorEspecialidadeId id = vinculo.getId();
        UUID usuarioId = usuario.getId();
        entityManager.clear();
        vinculo = entityManager.find(PrestadorEspecialidade.class, id);
        prestador = entityManager.find(PerfilPrestador.class, usuarioId);
        assertEquals(usuarioId, prestador.getUsuarioId());
        assertNotNull(prestador.getCriadoEm());
        assertEquals(AUTOR, prestador.getCriadoPor());
        assertNotNull(vinculo.getCriadoEm());
        assertEquals(AUTOR, vinculo.getCriadoPor());
        assertEquals(0L, vinculo.getVersao());
        assertEquals(1, prestador.getEspecialidades().size());
    }
}
