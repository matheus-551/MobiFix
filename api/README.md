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

O Hibernate atualiza as tabelas na inicialização (`ddl-auto: update`); o projeto ainda não utiliza migrations. Os inicializadores cadastram os catálogos de tipos de veículo e especialidades, sem criar automaticamente a conta do usuário simulado.

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
| `APP_MOCK_FIREBASE_ID` | `550e8400-e29b-41d4-a716-446655440101` | Identidade simulada do usuário atual |
| `SERVER_PORT` | `8080` | Porta HTTP da API |

Exemplo no PowerShell, antes de iniciar a aplicação:

```powershell
$env:DB_URL = 'jdbc:postgresql://localhost:5433/mobifix'
$env:DB_USERNAME = 'mobifix'
$env:DB_PASSWORD = 'mobfix_dev'
$env:APP_MOCK_FIREBASE_ID = '550e8400-e29b-41d4-a716-446655440101'
.\mvnw.cmd spring-boot:run
```

As variáveis valem para esse terminal e seus processos. No IntelliJ, configure-as na configuração de execução. Para voltar ao valor do arquivo após parar a API, remova a variável correspondente, por exemplo `Remove-Item Env:APP_MOCK_FIREBASE_ID`, e reinicie.

## Mock do Firebase: funcionamento atual

**A autenticação Firebase ainda não está implementada na API.** Não é necessário fazer login, enviar um Bearer token ou configurar credenciais Firebase para executar esta versão. A presença da dependência `firebase-admin` não ativa a autenticação.

Em `src/main/resources/application.yaml`, a propriedade abaixo simula a identidade do usuário autenticado:

```yaml
app:
  mock:
    firebase-id: "550e8400-e29b-41d4-a716-446655440101"
```

Os controllers de usuários, veículos, perfil profissional e gerenciamento da agenda utilizam esse mesmo valor. Todas as requisições de gerenciamento da mesma instância da API atuam como a mesma identidade, independentemente de quem as enviou. Um header ou um campo `firebaseId` no corpo não troca o usuário atual.

O mock exige um UUID válido porque a configuração é recebida como `UUID` pelos controllers. Isso é uma restrição temporária da implementação: o UID real do Firebase não precisa ter formato UUID.

O identificador simulado é persistido em `usuario.firebase_id`. Ele é diferente do `id` interno do usuário, gerado pela API. Também não deve ser confundido com o ID do perfil profissional usado nas consultas públicas de prestadores.

### Testar como cliente

1. Configure o mock com `550e8400-e29b-41d4-a716-446655440101` e inicie a API.
2. No Swagger, execute `POST /api/v1/usuarios` com o corpo:

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

3. Execute `GET /api/v1/usuarios/me` e confirme a conta criada.
4. Utilize as operações de veículos. O proprietário será o cliente associado ao mock; não é informado livremente no corpo.

A conta não é criada apenas por configurar o mock. Se ela ainda não existir, a consulta `/usuarios/me` retorna 404. Se já estiver cadastrada, utilize a consulta em vez de repetir o cadastro: a identidade e o e-mail não podem ser duplicados.

### Testar como prestador

1. Pare a aplicação.
2. No terminal em que irá iniciá-la, escolha outra identidade:

```powershell
$env:APP_MOCK_FIREBASE_ID = '550e8400-e29b-41d4-a716-446655440102'
.\mvnw.cmd spring-boot:run
```

3. Execute `POST /api/v1/usuarios` com outro e-mail e `tipo: PRESTADOR`:

```json
{
  "nome": "Carlos",
  "sobrenome": "Santos",
  "email": "carlos.prestador@example.com",
  "telefone": "81999990002",
  "uf": "PE",
  "tipo": "PRESTADOR"
}
```

4. Cadastre o perfil profissional por `POST /api/v1/prestadores/me/perfil`, seguindo os campos e exemplos do Swagger. Consulte os catálogos para informar IDs existentes de tipos de veículo e especialidades.
5. Utilize as operações de gerenciamento da agenda com essa identidade.

Uma conta possui apenas um tipo nesta versão: cliente ou prestador. Para voltar ao cliente, pare a API, restaure o UUID do cliente e reinicie. Trocar o mock seleciona outra conta; não altera nem apaga os dados da conta anterior. O tipo da conta não é alterado pela edição do usuário.

As consultas públicas de prestadores e disponibilidade não dependem da identidade simulada. Nas operações de gerenciamento, as regras de tipo, conta ativa e propriedade dos recursos continuam sendo aplicadas. O mock não oferece autenticação real e deve ficar restrito ao desenvolvimento e aos testes controlados.

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
- **Usuário não encontrado em `/me`:** confira o mock efetivo, reinicie após alterar a configuração e cadastre a conta correspondente.
- **Cadastro duplicado:** utilize o cadastro existente ou escolha outro UUID e outro e-mail para uma nova conta.
