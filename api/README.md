# MobiFix API

API de serviços automotivos desenvolvida com Java 25, Spring Boot, Spring Data JPA e PostgreSQL. O Docker Compose executa o banco local; a aplicação é executada separadamente.

## Pré-requisitos

- JDK 25 e `JAVA_HOME` apontando para sua instalação.
- Docker com Docker Compose (no Windows, Docker Desktop iniciado).
- Maven pelo Wrapper incluído no projeto ou uma instalação local. Maven 3.9.11 foi utilizado na validação do projeto.
- Acesso à internet na primeira execução para baixar dependências e a imagem do PostgreSQL.

Os comandos abaixo usam PowerShell e devem ser executados na pasta `api` do repositório.

## Executar localmente

### 1. Conferir o Java

```powershell
java -version
.\mvnw.cmd -version
```

Ambos devem indicar Java 25. No IntelliJ, configure também o SDK do projeto, o nível de linguagem e o JDK do Maven como Java 25. Se utilizar Maven instalado, confira com `mvn -version`.

### 2. Iniciar o PostgreSQL

```powershell
docker compose up -d
docker compose ps
```

Configuração local definida em `docker-compose.yaml`:

| Campo | Valor |
| --- | --- |
| Host | `localhost` |
| Porta no computador | `5433` |
| Porta no container | `5432` |
| Banco | `mobifix` |
| Usuário | `mobifix` |
| Senha de desenvolvimento | `mobfix_dev` |
| URL JDBC | `jdbc:postgresql://localhost:5433/mobifix` |

O mapeamento `5433:5432` permite acessar o PostgreSQL pelo computador na porta 5433. As credenciais acima são apenas para desenvolvimento local.

### 3. Iniciar a API

```powershell
.\mvnw.cmd spring-boot:run
```

Como alternativa, utilizando Maven instalado:

```powershell
mvn spring-boot:run
```

No Linux/macOS, use `./mvnw spring-boot:run`. Pelo IntelliJ, execute a classe `br.com.edu.ifpe.mobifix.api.ApiApplication` com o JDK 25.

O Hibernate atualiza as tabelas na inicialização (`ddl-auto: update`); o projeto ainda não utiliza migrations. Os inicializadores cadastram os catálogos de tipos de veículo e especialidades, sem criar automaticamente contas de usuários.

### 4. Conferir a execução

- API: `http://localhost:8080/api/v1`
- Swagger UI: [http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html)
- OpenAPI: [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs)

A URL base não possui necessariamente uma página inicial. Para verificar uma rota existente:

```powershell
Invoke-RestMethod 'http://localhost:8080/api/v1/tipos-veiculo'
```

### 5. Encerrar

Use `Ctrl+C` no terminal da API. Para encerrar o banco preservando os dados:

```powershell
docker compose down
```

Os dados ficam no volume `postgres_data`. Alterar a senha no Compose não altera a senha de um banco já inicializado nesse volume.

## Configurações por ambiente

| Variável | Padrão | Finalidade |
| --- | --- | --- |
| `DB_URL` | `jdbc:postgresql://localhost:5433/mobifix` | Conexão JDBC do banco |
| `DB_USERNAME` | `mobifix` | Usuário do banco |
| `DB_PASSWORD` | `mobfix_dev` | Senha do banco |
| `FIREBASE_PROJECT_ID` | Sem padrão | ID do projeto Firebase que emite os tokens |
| `GOOGLE_APPLICATION_CREDENTIALS` | Sem padrão | Caminho absoluto do JSON da conta de serviço, fora do repositório |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173,http://localhost:3000,http://localhost:8081` | Origens web permitidas, separadas por vírgula |
| `SERVER_PORT` | `8080` | Porta HTTP da API |

Exemplo no PowerShell, antes de iniciar a aplicação:

```powershell
$env:DB_URL = 'jdbc:postgresql://localhost:5433/mobifix'
$env:DB_USERNAME = 'mobifix'
$env:DB_PASSWORD = 'mobfix_dev'
$env:FIREBASE_PROJECT_ID = 'seu-projeto-firebase'
$env:GOOGLE_APPLICATION_CREDENTIALS = 'C:\credenciais\mobifix-service-account.json'
.\mvnw.cmd spring-boot:run
```

As variáveis valem para esse terminal e seus processos. No IntelliJ, configure-as na configuração de execução. Reinicie a aplicação após alterá-las.

## Autenticação Firebase

O login acontece no web/mobile pelo Firebase Authentication. O cliente obtém um **ID token** e o envia à API:

```http
Authorization: Bearer <ID_TOKEN>
```

A API valida o token com o Firebase Admin SDK, incluindo assinatura, projeto emissor, expiração, revogação e usuário desabilitado. O UID validado identifica a conta em `usuario.firebase_id`; não precisa ser UUID. O `id` interno do usuário e o ID do perfil profissional continuam sendo identificadores distintos.

### Configurar o projeto

1. Utilize o mesmo projeto Firebase do web/mobile e habilite o provedor de login necessário em Authentication.
2. Nas configurações do projeto, em **Contas de serviço**, gere a chave privada do Firebase Admin SDK.
3. Armazene o JSON fora do repositório. Defina `GOOGLE_APPLICATION_CREDENTIALS` com o caminho absoluto e `FIREBASE_PROJECT_ID` com o ID do projeto.
4. Inicie a API conforme as instruções acima. Em ambientes Google com identidade de serviço configurada, podem ser utilizadas Application Default Credentials sem arquivo local.

Não use a configuração pública do SDK web como credencial do Admin SDK. Não envie a chave privada pelo chat, não a coloque no frontend e não a versione. O arquivo `.gitignore` inclui padrões comuns de credenciais, mas o armazenamento fora do repositório é preferível.

O Admin SDK é inicializado ao validar o primeiro token. A API pode iniciar e atender rotas públicas sem as credenciais; tentativas de validar tokens sem configuração válida retornam `503`. Não existe fallback para mock. A configuração atual rejeita `FIREBASE_AUTH_EMULATOR_HOST`; os testes automatizados substituem apenas o verificador no contexto de teste.

### Rotas públicas e protegidas

Sem token, podem ser consultados por `GET`:

- `/api/v1/tipos-veiculo` e `/api/v1/especialidades`;
- `/api/v1/prestadores` e `/api/v1/prestadores/{id}`;
- `/api/v1/prestadores/{prestadorId}/horarios`;
- Swagger UI e OpenAPI.

Cadastro de usuário, `/usuarios/me`, gerenciamento de veículos, perfil profissional e agenda exigem token válido. Se um header de autenticação inválido for enviado mesmo em uma rota pública, a resposta será `401`; para uma consulta anônima, omita o header.

As regras de negócio continuam sendo aplicadas depois da autenticação: conta ativa, tipo cliente/prestador e propriedade dos recursos. A autenticação não cria automaticamente o cadastro local. Um token válido sem conta cadastrada permite realizar `POST /api/v1/usuarios`; a consulta `/usuarios/me` retorna `404` até existir esse cadastro.

### Cadastrar e consultar uma conta

1. Faça login com o Firebase pelo web/mobile.
2. Obtenha o ID token pelo SDK cliente (`await usuario.getIdToken()`). Use o ID token, não um custom token ou refresh token.
3. Abra o Swagger, clique em **Authorize** e cole apenas o token, sem o prefixo `Bearer`.
4. Execute `POST /api/v1/usuarios`, por exemplo:

```json
{
  "nome": "Ana",
  "sobrenome": "Silva",
  "email": "ana.cliente@example.com",
  "telefone": "81999990001",
  "uf": "PE",
  "tipo": "CLIENTE"
}
```

O identificador Firebase é obtido exclusivamente do token. Não envie `firebaseId` no corpo ou um header com o UID para escolher uma conta. Uma conta possui apenas um tipo nesta versão, `CLIENTE` ou `PRESTADOR`; identidade e e-mail duplicados não são aceitos.

Consulte `GET /api/v1/usuarios/me` pelo Swagger ou pelo PowerShell:

```powershell
$token = Read-Host 'ID token Firebase'
Invoke-RestMethod 'http://localhost:8080/api/v1/usuarios/me' `
  -Headers @{ Authorization = "Bearer $token" }
```

Para testar como prestador, faça login com uma segunda conta Firebase e cadastre-a como `PRESTADOR`, utilizando outro e-mail. Depois cadastre o perfil profissional e utilize o gerenciamento de agenda. Trocar de conta exige somente trocar o token enviado; não é necessário reiniciar a API.

### Mocks antigos e erros de autenticação

`app.mock.firebase-id` e `APP_MOCK_FIREBASE_ID` não são mais utilizados. Contas criadas com UUIDs simulados permanecem no banco, mas não são vinculadas automaticamente ao UID de uma conta Firebase real. Cadastre contas reais com e-mails ainda disponíveis ou planeje separadamente a vinculação dos dados de teste; não altere identificadores de contas de outras pessoas.

- `401`: token ausente, malformado, inválido, expirado ou revogado, ou conta Firebase desabilitada/excluída. Obtenha um novo ID token quando necessário.
- `503`: falha de configuração, permissões da conta de serviço ou comunicação com o Firebase. Confira as variáveis e o acesso ao serviço; um token novo não corrige credenciais do servidor.
- `404` após autenticação em `/usuarios/me`: o UID ainda não possui cadastro local.

A API é stateless: não cria sessão nem endpoint próprio de login/logout. O logout no cliente interrompe o envio do token; tokens revogados são rejeitados na verificação. A versão atual não exige `email_verified` como condição de acesso.

### Verificação manual

1. Consulte um catálogo sem token: espere `200`.
2. Consulte `/usuarios/me` sem token ou com um valor inválido: espere `401`.
3. Faça login, cadastre o usuário com seu token e consulte `/usuarios/me`.
4. Faça login com outra conta e confira que `/me` retorna essa segunda conta.
5. Tente consultar/alterar um veículo da primeira conta com o token da segunda: o recurso não deve ser disponibilizado.
6. Confira JSON e HAL enviando, respectivamente, `Accept: application/json` e `Accept: application/hal+json`, sempre junto ao token nas rotas protegidas.

## Testes automatizados

```powershell
.\mvnw.cmd test
```

Por padrão, os testes que dependem de PostgreSQL, incluindo o carregamento completo da aplicação, ficam desabilitados.

Os testes de segurança usam um verificador substituto somente no ambiente de teste, sem acesso a chaves ou contas Firebase. Os testes do adaptador conferem o uso de `verifyIdToken(token, true)` e o tratamento dos erros do SDK. Isso não substitui a verificação manual com um token do projeto real.

Para incluir os testes de integração, utilize um PostgreSQL **exclusivo para testes** e informe a conexão; não utilize seu banco de desenvolvimento, pois os testes podem manipular os dados:

```powershell
.\mvnw.cmd test '-Dmobifix.test.postgres=true' `
  '-Dspring.datasource.url=jdbc:postgresql://localhost:5434/mobifix_test' `
  '-Dspring.datasource.username=mobifix_test' `
  '-Dspring.datasource.password=mobifix_test'
```

O banco do exemplo precisa estar disponível nessa porta antes do comando.

## JSON e HATEOAS

Sem preferência de formato, ou com `Accept: application/json`, a API retorna o JSON convencional. Para receber links HATEOAS e coleções HAL, envie `Accept: application/hal+json`:

```powershell
Invoke-RestMethod `
  'http://localhost:8080/api/v1/tipos-veiculo' `
  -Headers @{ Accept = 'application/hal+json' } |
  ConvertTo-Json -Depth 10
```

Consulte [Swagger e HATEOAS](docs/swagger-hateoas.md) para detalhes sobre links, paginação e testes manuais.

## Problemas frequentes

- **Classe compilada com versão mais recente / source 8:** confira o JDK usado pelo terminal, Maven e IntelliJ. O projeto requer Java 25.
- **Erro de injector do Maven no IntelliJ:** configure a instalação local do Maven 3.9.11 e o JDK 25 nas opções de Maven da IDE; essa combinação foi utilizada na validação.
- **Conexão recusada no banco:** confira `docker compose ps` e a porta 5433 na URL JDBC.
- **Falha de senha no PostgreSQL:** confira a senha configurada e lembre que um volume existente mantém as credenciais com que foi inicializado. Não remova o volume se precisar preservar os dados.
- **Usuário não encontrado em `/me`:** confira a conta Firebase do token e cadastre o usuário correspondente na API.
- **Cadastro duplicado:** utilize a conta existente ou outra conta Firebase e outro e-mail para um novo cadastro.
