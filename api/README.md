# API MobiFix

Backend da plataforma MobiFix, que conecta clientes a prestadores de serviços
automotivos para manutenção, reparos e agendamentos. Desenvolvido com Java e
Spring Boot, utiliza PostgreSQL, JPA para persistência e Flyway para versionar
a estrutura do banco. A base atual contém os mapeamentos das entidades e auditoria;
os endpoints e a integração com Firebase serão implementados nas próximas etapas.

## Executar em ambiente local

### Pré-requisitos

- JDK 25 ou superior, configurado no terminal ou na IDE.
- Docker Desktop iniciado, usando containers Linux.
- Acesso à internet na primeira execução para baixar as dependências e a imagem do banco.

O projeto inclui o Maven Wrapper; não é necessário instalar o Maven separadamente.
Execute os comandos abaixo dentro da pasta `api`.

### 1. Configurar e iniciar o banco

Na primeira configuração, copie `.env.example` para `.env`:

```bash
# Git Bash
cp -n .env.example .env
```

No PowerShell, use `Copy-Item .env.example .env` somente se `.env` ainda não existir.
Edite o arquivo para definir os valores locais, por exemplo:

```dotenv
POSTGRES_DB=mobifix
POSTGRES_USER=mobifix
POSTGRES_PASSWORD=mobifix_local
POSTGRES_PORT=5433
```

```bash
docker compose up -d --wait
```

A porta `5433` é usada no computador; dentro do container o PostgreSQL utiliza
`5432`. Se a porta escolhida estiver indisponível, altere `POSTGRES_PORT` e ajuste
a URL da aplicação para a mesma porta.

### 2. Executar a API

O Compose lê o `.env`, mas a aplicação Java não o carrega automaticamente.
Configure `DB_URL`, `DB_USERNAME` e `DB_PASSWORD` com os valores definidos no passo anterior.

**Pelo IntelliJ:**

1. Abra o projeto Maven em `api/pom.xml` e aguarde a importação das dependências.
2. Acesse **Run → Edit Configurations** e selecione ou crie uma configuração para
   `br.com.ifpe.mobfix.api.ApiApplication`, usando o módulo da API.
3. Selecione um JDK 25 ou superior e configure **Environment variables**:

   ```text
   DB_URL=jdbc:postgresql://127.0.0.1:5433/mobifix
   DB_USERNAME=mobifix
   DB_PASSWORD=mobifix_local
   ```

4. Aplique as configurações e execute `ApiApplication` pelo botão **Run**.

**Pelo Git Bash:**

```bash
export DB_URL='jdbc:postgresql://127.0.0.1:5433/mobifix'
export DB_USERNAME='mobifix'
export DB_PASSWORD='mobifix_local'
./mvnw spring-boot:run
```

**Pelo PowerShell:**

```powershell
$env:DB_URL = 'jdbc:postgresql://127.0.0.1:5433/mobifix'
$env:DB_USERNAME = 'mobifix'
$env:DB_PASSWORD = 'mobifix_local'
.\mvnw.cmd spring-boot:run
```

Na inicialização, o Flyway aplica as migrações pendentes e o Hibernate valida o banco.
A mensagem `Started ApiApplication` indica que a inicialização foi concluída.
O endereço padrão é `http://localhost:8080`. Como ainda não há endpoints de negócio,
acessar a raiz pelo navegador pode retornar 404.

### 3. Executar testes e encerrar

Com o banco iniciado e as variáveis de conexão configuradas no terminal:

```bash
# Git Bash
./mvnw test
```

No PowerShell, use `.\mvnw.cmd test`.
Para encerrar a API, use **Stop** na IDE ou `Ctrl+C` no terminal. Para parar o banco:

```bash
docker compose down
```

Os dados permanecem no volume. Alterar a senha no `.env` não modifica a senha de
um banco já inicializado; nesse caso, use a credencial existente ou altere-a no PostgreSQL.
