package br.com.edu.ifpe.mobifix.api.agenda.infrastructure.persistence.adapter;

import java.sql.Date;
import java.sql.Time;
import java.util.List;
import java.util.UUID;
import br.com.edu.ifpe.mobifix.api.agenda.application.geracao.GeracaoAgendaMensalPort;
import br.com.edu.ifpe.mobifix.api.agenda.domain.model.HorarioAtendimento;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Repository
public class GeracaoAgendaMensalJdbcAdapter implements GeracaoAgendaMensalPort {
    private static final String PRESTADORES_ELEGIVEIS = """
            select p.id from perfil_prestador p join usuario u on u.id = p.usuario_id
            where u.ativo = true and u.tipo = 'PRESTADOR'
              and exists (select 1 from prestador_tipo_veiculo t where t.prestador_id = p.id)
              and exists (select 1 from prestador_especialidade e where e.prestador_id = p.id)
            """;
    private final JdbcTemplate jdbc;
    public GeracaoAgendaMensalJdbcAdapter(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    @Override
    @Transactional(readOnly = true)
    public List<UUID> listarPrestadoresElegiveis() {
        return jdbc.query(PRESTADORES_ELEGIVEIS + " order by p.id", (rs, row) -> rs.getObject("id", UUID.class));
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public int inserirAusentes(UUID prestadorId, List<HorarioAtendimento> horarios) {
        if (horarios.stream().anyMatch(h -> !h.prestadorId().equals(prestadorId))) {
            throw new IllegalArgumentException("Os horários precisam pertencer ao prestador informado.");
        }
        // Revalida a elegibilidade e impede desativacao da conta durante a gravacao.
        var elegiveis = jdbc.query(PRESTADORES_ELEGIVEIS + " and p.id = ? for share of p, u",
                (rs, row) -> rs.getObject("id", UUID.class), prestadorId);
        if (elegiveis.isEmpty() || horarios.isEmpty()) return 0;

        int[][] resultados = jdbc.batchUpdate("""
                insert into horario_atendimento (id, prestador_id, data, hora_inicio, capacidade_total, bloqueado)
                values (?, ?, ?, ?, ?, ?)
                on conflict (prestador_id, data, hora_inicio) do nothing
                """, horarios, 100, (ps, h) -> {
            ps.setObject(1, h.id()); ps.setObject(2, h.prestadorId());
            ps.setDate(3, Date.valueOf(h.data())); ps.setTime(4, Time.valueOf(h.horaInicio()));
            ps.setInt(5, h.capacidadeTotal()); ps.setBoolean(6, h.bloqueado());
        });
        int criados = 0;
        for (int[] lote : resultados) {
            for (int quantidade : lote) {
                if (quantidade == java.sql.Statement.SUCCESS_NO_INFO) criados++;
                else if (quantidade > 0) criados += quantidade;
            }
        }
        return criados;
    }
}
