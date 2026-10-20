# API MobiFix

Backend da plataforma MobiFix, que conecta clientes a prestadores de serviços
automotivos para manutenção, reparos e agendamentos. Desenvolvido com Java e
Spring Boot, utiliza PostgreSQL, JPA para persistência e Flyway para versionar
a estrutura do banco. A API valida ID tokens do Firebase Authentication, vincula
o UID ao usuário local e registra os autores das alterações na auditoria.
O endpoint `GET /api/auth/me` retorna os dados do usuário autenticado; os demais
fluxos de negócio serão implementados nas próximas etapas.

## Executar em ambiente local

### Pré-requisitos

- JDK 25 ou superior, configurado no terminal ou na IDE.
- Docker Desktop iniciado, usando containers Linux.
- Um projeto Firebase com Authentication configurado e um usuário com e-mail verificado.
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
Configure também `FIREBASE_PROJECT_ID` com o **ID do projeto** exibido nas configurações
do Firebase, não com a chave de API nem com o ID do aplicativo. Essa variável é obrigatória.
A validação usa as chaves públicas do Google; não é necessário um arquivo de conta de serviço.
É necessário acesso à internet para obter e atualizar essas chaves.

**Pelo IntelliJ:**

1. Abra o projeto Maven em `api/pom.xml` e aguarde a importação das dependências.
2. Acesse **Run → Edit Configurations** e selecione ou crie uma configuração para
   `br.com.ifpe.mobfix.api.ApiApplication`, usando o módulo da API.
3. Selecione um JDK 25 ou superior e configure **Environment variables**:

   ```text
   DB_URL=jdbc:postgresql://127.0.0.1:5433/mobifix
   DB_USERNAME=mobifix
   DB_PASSWORD=mobifix_local
   FIREBASE_PROJECT_ID=seu-id-do-projeto
   ```

4. Aplique as configurações e execute `ApiApplication` pelo botão **Run**.

**Pelo Git Bash:**

```bash
export DB_URL='jdbc:postgresql://127.0.0.1:5433/mobifix'
export DB_USERNAME='mobifix'
export DB_PASSWORD='mobifix_local'
export FIREBASE_PROJECT_ID='seu-id-do-projeto'
./mvnw spring-boot:run
```

**Pelo PowerShell:**

```powershell
$env:DB_URL = 'jdbc:postgresql://127.0.0.1:5433/mobifix'
$env:DB_USERNAME = 'mobifix'
$env:DB_PASSWORD = 'mobifix_local'
$env:FIREBASE_PROJECT_ID = 'seu-id-do-projeto'
.\mvnw.cmd spring-boot:run
```

Na inicialização, o Flyway aplica as migrações pendentes e o Hibernate valida o banco.
A mensagem `Started ApiApplication` indica que a inicialização foi concluída.
O endereço padrão é `http://localhost:8080`. As rotas exigem autenticação; acessar
pelo navegador sem um token retorna 401. Não há página inicial.

### 3. Validar a autenticação

O login é feito no Firebase pelo cliente Web/Mobile. Envie o **ID token** obtido
com `getIdToken()` no header `Authorization: Bearer <ID_TOKEN>` da requisição:

```bash
curl http://localhost:8080/api/auth/me \
  -H "Authorization: Bearer <ID_TOKEN>"
```

O usuário precisa existir na tabela `usuario`, com `firebase_uid` igual ao UID
validado no token, `habilitado=true`, `status=ATIVO` e `papel=CLIENTE` ou
`PRESTADOR`. O token deve indicar `email_verified=true`. A API busca a conta
pelo UID, nunca pelo e-mail, e usa o UUID interno para `criado_por` e `atualizado_por`.
Não cria usuários automaticamente e não recebe senhas. O cadastro de contas locais
será implementado em outra etapa.

Para uma primeira validação **somente no banco local de desenvolvimento**, é possível
inserir uma conta usando o UID real copiado de Firebase Authentication → Users e um
email que ainda não exista no banco. Execute pelo cliente SQL conectado ao banco local:

```sql
INSERT INTO usuario (
    id, firebase_uid, email, papel, status, email_verificado,
    criado_em, atualizado_em, versao, habilitado
) VALUES (
    gen_random_uuid(), 'UID_REAL_DO_FIREBASE', 'email-do-usuario@example.com',
    'CLIENTE', 'ATIVO', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, true
);
```

Essa inserção não cria perfis nem substitui o futuro fluxo de cadastro. Os autores
da inserção manual ficam nulos porque ela não passa pela autenticação da API.

Uma resposta 200 contém `id`, `firebaseUid`, `email` e `papel`. Ausência de token,
token inválido/expirado, projeto incorreto, email não verificado ou conta local
inexistente/desabilitada/inativa retornam 401. Claims de papel e email do token
não substituem os dados locais.

A validação verifica assinatura RS256, emissor, projeto, UID e datas do ID token.
Não consulta revogações ou bloqueios remotos do Firebase a cada requisição;
um token já emitido pode continuar válido até expirar. Desabilitar a conta local
bloqueia as próximas requisições. A auditoria registra criação e última alteração,
sem um histórico completo de revisões.

### 4. Executar testes e encerrar

Com o banco iniciado e as variáveis de conexão configuradas no terminal
(use um banco separado de desenvolvimento para os testes):

```bash
# Git Bash
./mvnw test
```

No PowerShell, use `.\mvnw.cmd test`. Os testes de autenticação geram suas próprias
chaves e tokens; não acessam seu projeto Firebase nem usam tokens reais.
Para encerrar a API, use **Stop** na IDE ou `Ctrl+C` no terminal. Para parar o banco:

```bash
docker compose down
```

Os dados permanecem no volume. Alterar a senha no `.env` não modifica a senha de
um banco já inicializado; nesse caso, use a credencial existente ou altere-a no PostgreSQL.
