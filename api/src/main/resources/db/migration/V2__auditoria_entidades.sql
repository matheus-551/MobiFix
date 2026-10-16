ALTER TABLE usuario
    ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP,
    ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP,
    ADD COLUMN versao BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN habilitado BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN criado_por UUID,
    ADD COLUMN atualizado_por UUID;

-- Datas legadas ausentes recebem o instante da migração, sem inventar autores.
UPDATE usuario
SET criado_em = COALESCE(criado_em, CURRENT_TIMESTAMP),
    atualizado_em = COALESCE(atualizado_em, criado_em, CURRENT_TIMESTAMP);

ALTER TABLE usuario
    ALTER COLUMN criado_em SET NOT NULL,
    ALTER COLUMN atualizado_em SET NOT NULL;

ALTER TABLE perfil_cliente
    ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP,
    ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP,
    ADD COLUMN versao BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN habilitado BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN criado_por UUID,
    ADD COLUMN atualizado_por UUID;

-- Datas legadas ausentes recebem o instante da migração, sem inventar autores.
UPDATE perfil_cliente
SET criado_em = COALESCE(criado_em, CURRENT_TIMESTAMP),
    atualizado_em = COALESCE(atualizado_em, criado_em, CURRENT_TIMESTAMP);

ALTER TABLE perfil_cliente
    ALTER COLUMN criado_em SET NOT NULL,
    ALTER COLUMN atualizado_em SET NOT NULL;

ALTER TABLE perfil_prestador
    ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP,
    ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP,
    ADD COLUMN versao BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN habilitado BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN criado_por UUID,
    ADD COLUMN atualizado_por UUID;

-- Datas legadas ausentes recebem o instante da migração, sem inventar autores.
UPDATE perfil_prestador
SET criado_em = COALESCE(criado_em, CURRENT_TIMESTAMP),
    atualizado_em = COALESCE(atualizado_em, criado_em, CURRENT_TIMESTAMP);

ALTER TABLE perfil_prestador
    ALTER COLUMN criado_em SET NOT NULL,
    ALTER COLUMN atualizado_em SET NOT NULL;

ALTER TABLE tipo_veiculo
    ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP,
    ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP,
    ADD COLUMN versao BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN habilitado BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN criado_por UUID,
    ADD COLUMN atualizado_por UUID;

-- Datas legadas ausentes recebem o instante da migração, sem inventar autores.
UPDATE tipo_veiculo
SET criado_em = COALESCE(criado_em, CURRENT_TIMESTAMP),
    atualizado_em = COALESCE(atualizado_em, criado_em, CURRENT_TIMESTAMP);

ALTER TABLE tipo_veiculo
    ALTER COLUMN criado_em SET NOT NULL,
    ALTER COLUMN atualizado_em SET NOT NULL;

ALTER TABLE especialidade
    ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP,
    ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP,
    ADD COLUMN versao BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN habilitado BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN criado_por UUID,
    ADD COLUMN atualizado_por UUID;

-- Datas legadas ausentes recebem o instante da migração, sem inventar autores.
UPDATE especialidade
SET criado_em = COALESCE(criado_em, CURRENT_TIMESTAMP),
    atualizado_em = COALESCE(atualizado_em, criado_em, CURRENT_TIMESTAMP);

ALTER TABLE especialidade
    ALTER COLUMN criado_em SET NOT NULL,
    ALTER COLUMN atualizado_em SET NOT NULL;

ALTER TABLE veiculo
    ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP,
    ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP,
    ADD COLUMN versao BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN habilitado BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN criado_por UUID,
    ADD COLUMN atualizado_por UUID;

-- Datas legadas ausentes recebem o instante da migração, sem inventar autores.
UPDATE veiculo
SET criado_em = COALESCE(criado_em, CURRENT_TIMESTAMP),
    atualizado_em = COALESCE(atualizado_em, criado_em, CURRENT_TIMESTAMP);

ALTER TABLE veiculo
    ALTER COLUMN criado_em SET NOT NULL,
    ALTER COLUMN atualizado_em SET NOT NULL;

ALTER TABLE agendamento
    ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP,
    ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP,
    ADD COLUMN versao BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN habilitado BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN criado_por UUID,
    ADD COLUMN atualizado_por UUID;

-- Datas legadas ausentes recebem o instante da migração, sem inventar autores.
UPDATE agendamento
SET criado_em = COALESCE(criado_em, CURRENT_TIMESTAMP),
    atualizado_em = COALESCE(atualizado_em, criado_em, CURRENT_TIMESTAMP);

ALTER TABLE agendamento
    ALTER COLUMN criado_em SET NOT NULL,
    ALTER COLUMN atualizado_em SET NOT NULL;

ALTER TABLE avaliacao
    ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP,
    ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP,
    ADD COLUMN versao BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN habilitado BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN criado_por UUID,
    ADD COLUMN atualizado_por UUID;

-- Datas legadas ausentes recebem o instante da migração, sem inventar autores.
UPDATE avaliacao
SET criado_em = COALESCE(criado_em, CURRENT_TIMESTAMP),
    atualizado_em = COALESCE(atualizado_em, criado_em, CURRENT_TIMESTAMP);

ALTER TABLE avaliacao
    ALTER COLUMN criado_em SET NOT NULL,
    ALTER COLUMN atualizado_em SET NOT NULL;

ALTER TABLE horario_disponibilidade
    ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP,
    ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP,
    ADD COLUMN versao BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN habilitado BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN criado_por UUID,
    ADD COLUMN atualizado_por UUID;

-- Datas legadas ausentes recebem o instante da migração, sem inventar autores.
UPDATE horario_disponibilidade
SET criado_em = COALESCE(criado_em, CURRENT_TIMESTAMP),
    atualizado_em = COALESCE(atualizado_em, criado_em, CURRENT_TIMESTAMP);

ALTER TABLE horario_disponibilidade
    ALTER COLUMN criado_em SET NOT NULL,
    ALTER COLUMN atualizado_em SET NOT NULL;

ALTER TABLE prestador_tipo_veiculo
    ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP,
    ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP,
    ADD COLUMN versao BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN habilitado BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN criado_por UUID,
    ADD COLUMN atualizado_por UUID;

-- Datas legadas ausentes recebem o instante da migração, sem inventar autores.
UPDATE prestador_tipo_veiculo
SET criado_em = COALESCE(criado_em, CURRENT_TIMESTAMP),
    atualizado_em = COALESCE(atualizado_em, criado_em, CURRENT_TIMESTAMP);

ALTER TABLE prestador_tipo_veiculo
    ALTER COLUMN criado_em SET NOT NULL,
    ALTER COLUMN atualizado_em SET NOT NULL;

ALTER TABLE prestador_especialidade
    ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP,
    ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP,
    ADD COLUMN versao BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN habilitado BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN criado_por UUID,
    ADD COLUMN atualizado_por UUID;

-- Datas legadas ausentes recebem o instante da migração, sem inventar autores.
UPDATE prestador_especialidade
SET criado_em = COALESCE(criado_em, CURRENT_TIMESTAMP),
    atualizado_em = COALESCE(atualizado_em, criado_em, CURRENT_TIMESTAMP);

ALTER TABLE prestador_especialidade
    ALTER COLUMN criado_em SET NOT NULL,
    ALTER COLUMN atualizado_em SET NOT NULL;
