package br.com.edu.ifpe.mobifix.api.agendamento.infrastructure.persistence.initializer;

import org.springframework.beans.factory.SmartInitializingSingleton;
import org.springframework.context.annotation.DependsOn;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/** Ajustes idempotentes do PostgreSQL que ddl-auto não atualiza: enum e índice único parcial. */
@Component
@DependsOn("entityManagerFactory")
public class AgendamentoSchemaInitializer implements SmartInitializingSingleton {

    private final JdbcTemplate jdbc;

    private final TransactionTemplate transacao;

    public AgendamentoSchemaInitializer(JdbcTemplate jdbc, PlatformTransactionManager manager) {
        this.jdbc = jdbc;
        this.transacao = new TransactionTemplate(manager);
    }

    @Override
    public void afterSingletonsInstantiated() {
        transacao.executeWithoutResult(status -> {
            jdbc.execute("LOCK TABLE agendamento IN ACCESS EXCLUSIVE MODE");
            jdbc.execute(
                    "ALTER TABLE agendamento DROP CONSTRAINT IF EXISTS agendamento_status_check");
            jdbc.execute(
                    """
                    ALTER TABLE agendamento ADD CONSTRAINT agendamento_status_check
                    CHECK (status IN ('PENDENTE', 'CONFIRMADO', 'CANCELADO', 'CONCLUIDO'))
                    """);
            jdbc.execute(
                    """
                    CREATE UNIQUE INDEX IF NOT EXISTS uk_agendamento_veiculo_horario_ativo
                    ON agendamento (veiculo_id, data, hora_inicio)
                    WHERE status IN ('PENDENTE', 'CONFIRMADO')
                    """);
            jdbc.execute(
                    "ALTER TABLE agendamento DROP CONSTRAINT IF EXISTS"
                        + " uk_agendamento_veiculo_data_hora");
        });
    }
}
