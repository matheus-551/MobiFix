# Agendamentos: criação e consultas

As reservas nascem **PENDENTE** e podem ser confirmadas, canceladas ou concluídas pelas regras abaixo. PENDENTE e CONFIRMADO ocupam vaga. Remarcação mantém o estado PENDENTE. A duração de serviços não é considerada.

## Endpoints

| Método | Rota | Finalidade |
| --- | --- | --- |
| POST | `/api/v1/agendamentos` | Cliente cria uma reserva |
| GET | `/api/v1/agendamentos/me?page=0&size=20` | Cliente ou prestador lista os próprios agendamentos |
| GET | `/api/v1/agendamentos/{id}` | Consulta restrita ao cliente e prestador envolvidos |
| PATCH | `/api/v1/agendamentos/{id}/confirmar` | Prestador confirma um pendente antes do início |
| PATCH | `/api/v1/agendamentos/{id}/cancelar` | Cliente ou prestador cancela pendente/confirmado antes do início |
| PATCH | `/api/v1/agendamentos/{id}/remarcar` | Cliente responsável troca um horário pendente antes do início |
| PATCH | `/api/v1/agendamentos/{id}/concluir` | Prestador conclui confirmado a partir do início |

Todas as rotas exigem `Authorization: Bearer <ID token Firebase>`. O UID vem do token e o cliente não pode ser escolhido pelo corpo da requisição. Contas inativas não podem utilizar essas operações. Um prestador ativo sem agendamentos recebe uma página vazia.

```json
{
  "veiculoId": "550e8400-e29b-41d4-a716-446655440201",
  "horarioId": "550e8400-e29b-41d4-a716-446655440301",
  "especialidadeId": 1
}
```

Os IDs acima são ilustrativos. Obtenha os IDs reais por `/api/v1/veiculos/me`, pela consulta pública de horários e pelas especialidades do perfil público do prestador. O perfil deve atender tanto o tipo do veículo quanto a especialidade.

O POST retorna `201`, o agendamento com seu ID, data, hora, vínculos, status e instante de criação, e o header `Location` da consulta individual. Confirmar, cancelar e concluir não recebem corpo; remarcar recebe `horarioId`. A identidade e o instante da ação são definidos pelo servidor. Não há exclusão física. Após falha de conexão ou resposta perdida, consulte a listagem antes de repetir o POST; uma reserva já confirmada no banco pode gerar `409` na repetição.

## Regras e concorrência

- Somente um cliente ativo pode criar; o veículo deve estar ativo e pertencer a essa conta.
- O horário deve existir, estar no futuro no fuso `America/Sao_Paulo`, estar aberto e ter capacidade livre.
- O prestador deve estar ativo e atender o tipo do veículo e a especialidade solicitada.
- O mesmo veículo não pode ser reservado para a mesma data e hora, inclusive em prestadores diferentes. Como não há duração de serviço nesta etapa, a regra compara o instante inicial exato.
- `vagasDisponiveis = capacidadeTotal - quantidade de reservas PENDENTE ou CONFIRMADO`. Horários lotados deixam de aparecer na consulta pública.
- O prestador pode aumentar capacidade e bloquear/reabrir o horário. Não pode reduzir a capacidade abaixo das reservas existentes. O bloqueio não cancela agendamentos anteriores.

A criação utiliza uma única transação. Os bloqueios são adquiridos em ordem: cliente, veículo e horário. O veículo serializa tentativas duplicadas, e o horário serializa o cálculo das vagas e sua gravação. A alteração de capacidade utiliza o mesmo bloqueio do horário e confere novamente a ocupação. O banco também possui uma restrição única parcial para veículo/data/hora em reservas ativas e vínculos por chaves estrangeiras.

As regras ficam em `agendamento/application`, sem dependências Spring. O adapter `AgendamentosTransacionais` estabelece a transação, e os adapters de persistência exigem uma transação ativa. O `ddl-auto: update` cria a tabela e as colunas de auditoria. Sem adicionar migrations, o `AgendamentoSchemaInitializer` ajusta na inicialização as duas restrições que o Hibernate não atualiza: o CHECK do enum e a unicidade parcial para veículo/data/hora em PENDENTE ou CONFIRMADO. O ajuste é idempotente, transacional, preserva registros e ocorre antes de a aplicação estar pronta. A conta do banco precisa ser proprietária da tabela, como já exigido pelo ddl-auto. Não é necessário apagar o banco. O índice novo é criado antes de remover a restrição antiga.

## Paginação e formatos

`page` começa em zero. `size` aceita 1 a 100, com padrão 20. A ordem é data, hora e ID em ordem crescente. A consulta sempre aplica o vínculo do usuário autenticado, inclusive antes de calcular os totais.

Com `Accept: application/json`, a página possui `content`, `page`, `size`, `totalElements` e `totalPages`. Com `Accept: application/hal+json`, os itens ficam em `_embedded.agendamentos`, os metadados em `page` e a navegação em `_links`. Página vazia mantém o array nomeado. Os recursos HAL oferecem navegação e as ações permitidas para a conta, estado e instante atuais. Siga `confirmar`, `cancelar`, `concluir` e `remarcar` por PATCH. Remarcar exige o novo `horarioId` no corpo. Os links não substituem as validações do backend.

## Erros

| Status | Situação |
| --- | --- |
| 400 | Corpo, UUID, especialidade ou parâmetros de paginação inválidos |
| 401 | Token ausente, inválido ou expirado |
| 403 | Cliente tentando confirmar/concluir ou prestador tentando remarcar |
| 404 | Conta local ou recurso inexistente; veículo/agendamento não acessível ao usuário |
| 409 | Horário lotado, duplicidade do veículo, transição de estado inválida ou conflito de gravação |
| 422 | Conta inativa, tipo de conta inadequado, atendimento incompatível, horário passado/bloqueado ou capacidade abaixo das reservas |
| 503 | Falha no serviço/configuração de autenticação Firebase |

Os erros usam Problem Details. Uma conta alheia recebe `404` ao consultar um agendamento, sem dados dos envolvidos.

## Teste manual pelo Swagger

1. Inicie a API pelo Java, com PostgreSQL e Firebase configurados, e abra `/swagger-ui/index.html`.
2. Faça login Firebase como cliente e utilize **Authorize** com o ID token. Cadastre a conta e um veículo, caso ainda não existam.
3. Utilize outra conta como prestador, crie o perfil com tipo de veículo e especialidade compatíveis e configure um horário futuro com três vagas.
4. Consulte o horário público e registre seus IDs. Volte ao token do cliente e execute o POST de agendamento: espere `201`, status `PENDENTE` e `Location`.
5. Consulte o recurso pelo cliente e pelo prestador: ambos devem conseguir. Uma terceira conta deve receber `404`.
6. Confira a listagem de cada conta, a paginação e os dois formatos JSON/HAL.
7. Consulte a disponibilidade pública: restam duas vagas. Reserve outros dois veículos e confirme que o horário lotado não aparece mais; uma quarta reserva retorna `409`.
8. Tente reservar um veículo de outra conta, especialidade não atendida, veículo desativado e horário bloqueado/passado. As tentativas não devem criar reservas.
9. Com o token do prestador, tente reduzir a capacidade abaixo da ocupação: espere `422`. Bloqueie o horário mantendo a capacidade e confirme que as reservas continuam consultáveis.

Os testes automatizados de concorrência executam transações independentes no PostgreSQL: seis tentativas disputam três vagas, um veículo tenta dois prestadores no mesmo instante e uma reserva disputa com redução de capacidade. Não é necessário criar usuários Firebase reais nos testes; o verificador é substituído somente no teste HTTP.

Execute a suíte com um banco **exclusivo de testes**, nunca o de desenvolvimento:

```powershell
mvn test '-Dmobifix.test.postgres=true' `
  '-Dspring.datasource.url=jdbc:postgresql://localhost:5434/mobifix_test' `
  '-Dspring.datasource.username=mobifix_test' `
  '-Dspring.datasource.password=mobifix_test'
```

O PostgreSQL deve estar disponível antes do comando. A execução normal da aplicação continua usando Java 25 e as variáveis de conexão já documentadas no README.

## Ciclo e auditoria

PENDENTE pode virar CONFIRMADO ou CANCELADO. CONFIRMADO pode virar CANCELADO ou CONCLUIDO. CANCELADO e CONCLUIDO são estados finais. Repetir uma ação já realizada retorna 409 sem alterar auditoria nem liberar vaga novamente.

Confirmação e cancelamento exigem instante estritamente anterior ao início. A conclusão aceita o instante inicial e os posteriores, no fuso America/Sao_Paulo. Bloquear um horário impede novas reservas, mas não impede gerenciar as reservas existentes dentro dessas regras.

As respostas incluem `confirmadoEm`/`confirmadoPor`, `canceladoEm`/`canceladoPor` e `concluidoEm`/`concluidoPor`. Os instantes são UTC e os responsáveis são IDs internos das contas. Os campos ficam nulos até a ação e o histórico anterior é preservado. A listagem mantém todos os estados.

As alterações bloqueiam o veículo, recarregam e bloqueiam o agendamento e só então bloqueiam seu horário atual. A remarcação bloqueia os dois horários em ordem de UUID, evitando impasses entre trocas opostas. A criação mantém a ordem cliente, veículo e horário. Assim, um cancelamento concorrente não pode ser sobrescrito por uma confirmação que tenha lido o estado antigo.

### Teste manual das ações

1. Crie um agendamento futuro e confirme com o token do prestador: espere 200, CONFIRMADO e auditoria do prestador. A ocupação permanece a mesma.
2. Tente confirmar com o cliente (403) e cancelar com uma terceira conta (404).
3. Cancele com o cliente ou prestador antes do início: espere CANCELADO e recuperação da vaga. Reserve novamente o mesmo veículo/horário e confira que o registro anterior continua consultável.
4. Repita confirmação ou cancelamento em um estado incompatível: espere 409.
5. Antes do início, tente concluir: espere 422. A partir do início, conclua um confirmado com o prestador: espere CONCLUIDO e auditoria, preservando os dados da confirmação.
6. Confira os links HAL com os tokens de cliente e prestador e a documentação dos PATCH no Swagger.


## Remarcação

`PATCH /api/v1/agendamentos/{id}/remarcar` com o token do cliente responsável:

```json
{
  "horarioId": "550e8400-e29b-41d4-a716-446655440301"
}
```

O ID é ilustrativo. Escolha outro horário da disponibilidade pública do mesmo prestador. A resposta é 200 com o mesmo ID do agendamento, novo horário/data/hora e estado PENDENTE. Cliente, prestador, veículo, especialidade e instante de criação são preservados.

- Somente PENDENTE e antes do início original. CONFIRMADO, CANCELADO e CONCLUIDO retornam 409.
- Conta e veículo devem continuar ativos. O destino deve ser futuro, aberto e com vaga; o prestador deve continuar ativo e compatível com o veículo e a especialidade.
- A troca é uma única transação. O horário anterior libera uma vaga e o novo passa a ocupá-la no commit. Qualquer falha mantém a reserva original; a resposta é 409 para lotação/conflito e 422 para horário bloqueado, passado, incompatível ou de outro prestador.
- Reenviar o horário atual retorna 200 sem alterar a ocupação nem a auditoria, mesmo se o horário estiver lotado ou bloqueado. As regras de autorização, estado, conta/veículo ativos e prazo original continuam sendo verificadas.
- `remarcadoEm` (UTC) e `remarcadoPor` (ID interno do cliente) registram apenas a última remarcação. Ficam nulos nos registros anteriores e são preservados nas ações posteriores. Não há histórico de cada troca.
- O link HAL `remarcar` aparece somente para o cliente em um PENDENTE futuro. Escolha o destino e envie o corpo ao seguir o link.

### Teste manual da remarcação

1. Configure dois horários futuros do mesmo prestador, com vagas, em dias ou horas diferentes. Crie uma reserva no primeiro como cliente.
2. Remarque para o segundo pelo Swagger. Confira ID e vínculos preservados, nova data/hora, auditoria do cliente, vaga recuperada na origem e ocupada no destino.
3. Repita o mesmo destino: espere 200 e auditoria inalterada. Confirme depois como prestador e confira que a auditoria da remarcação permanece.
4. Tente remarcar para horário cheio, bloqueado, passado ou de outro prestador. Confira erro e que a reserva e a ocupação originais permanecem.
5. Tente com prestador (403), outra conta (404), sem token (401), corpo vazio (400), estado confirmado (409) e pendente cujo início já passou (422).
6. Com duas reservas de clientes diferentes, dispute a última vaga do mesmo destino simultaneamente. Só uma troca deve ocorrer; a outra reserva continua na origem.

Os testes PostgreSQL também verificam trocas em sentidos opostos e remarcação concorrente com confirmação/cancelamento, usando transações independentes.
