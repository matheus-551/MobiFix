CREATE TABLE usuario (
    id UUID PRIMARY KEY,
    firebase_uid VARCHAR(128) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    papel VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    email_verificado BOOLEAN NOT NULL,
    criado_em TIMESTAMP,
    atualizado_em TIMESTAMP
);

CREATE TABLE perfil_cliente (
    usuario_id UUID PRIMARY KEY REFERENCES usuario(id),
    primeiro_nome VARCHAR(100) NOT NULL,
    sobrenome VARCHAR(100) NOT NULL,
    telefone VARCHAR(20),
    estado_uf CHAR(2)
);

CREATE TABLE perfil_prestador (
    usuario_id UUID PRIMARY KEY REFERENCES usuario(id),
    nome_exibicao VARCHAR(150) NOT NULL,
    endereco VARCHAR(255),
    estado_uf CHAR(2)
);

CREATE TABLE tipo_veiculo (
    id UUID PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE especialidade (
    id UUID PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    ativo BOOLEAN NOT NULL
);

CREATE TABLE veiculo (
    id UUID PRIMARY KEY,
    marca VARCHAR(100) NOT NULL,
    modelo VARCHAR(100) NOT NULL,
    ano INTEGER,
    placa VARCHAR(10) NOT NULL,
    cliente_id UUID NOT NULL REFERENCES perfil_cliente(usuario_id),
    tipo_veiculo_id UUID NOT NULL REFERENCES tipo_veiculo(id)
);

CREATE TABLE agendamento (
    id UUID PRIMARY KEY,
    inicio_solicitado TIMESTAMP NOT NULL,
    fim_solicitado TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL,
    descricao TEXT,
    criado_em TIMESTAMP,
    cliente_id UUID NOT NULL REFERENCES perfil_cliente(usuario_id),
    prestador_id UUID NOT NULL REFERENCES perfil_prestador(usuario_id),
    veiculo_id UUID NOT NULL REFERENCES veiculo(id),
    especialidade_id UUID NOT NULL REFERENCES especialidade(id),
    CONSTRAINT ck_agendamento_periodo CHECK (fim_solicitado > inicio_solicitado)
);

CREATE TABLE avaliacao (
    id UUID PRIMARY KEY,
    nota INTEGER NOT NULL,
    comentario TEXT,
    criado_em TIMESTAMP,
    agendamento_id UUID NOT NULL REFERENCES agendamento(id) UNIQUE,
    cliente_id UUID NOT NULL REFERENCES perfil_cliente(usuario_id),
    prestador_id UUID NOT NULL REFERENCES perfil_prestador(usuario_id),
    CONSTRAINT ck_avaliacao_nota CHECK (nota BETWEEN 1 AND 5)
);

CREATE TABLE horario_disponibilidade (
    id UUID PRIMARY KEY,
    inicio_em TIMESTAMP NOT NULL,
    fim_em TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL,
    prestador_id UUID NOT NULL REFERENCES perfil_prestador(usuario_id),
    CONSTRAINT ck_disponibilidade_periodo CHECK (fim_em > inicio_em)
);

CREATE TABLE prestador_tipo_veiculo (
    prestador_id UUID NOT NULL REFERENCES perfil_prestador(usuario_id),
    tipo_veiculo_id UUID NOT NULL REFERENCES tipo_veiculo(id),
    PRIMARY KEY (prestador_id, tipo_veiculo_id)
);

CREATE TABLE prestador_especialidade (
    prestador_id UUID NOT NULL REFERENCES perfil_prestador(usuario_id),
    especialidade_id UUID NOT NULL REFERENCES especialidade(id),
    PRIMARY KEY (prestador_id, especialidade_id)
);

CREATE INDEX idx_veiculo_cliente_id ON veiculo (cliente_id);

CREATE INDEX idx_veiculo_tipo_veiculo_id ON veiculo (tipo_veiculo_id);

CREATE INDEX idx_agendamento_cliente_id ON agendamento (cliente_id);

CREATE INDEX idx_agendamento_prestador_id ON agendamento (prestador_id);

CREATE INDEX idx_agendamento_veiculo_id ON agendamento (veiculo_id);

CREATE INDEX idx_agendamento_especialidade_id ON agendamento (especialidade_id);

CREATE INDEX idx_avaliacao_cliente_id ON avaliacao (cliente_id);

CREATE INDEX idx_avaliacao_prestador_id ON avaliacao (prestador_id);

CREATE INDEX idx_horario_disponibilidade_prestador_id ON horario_disponibilidade (prestador_id);
