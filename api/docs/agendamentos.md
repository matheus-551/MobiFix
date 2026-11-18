# Agendamentos: criação e consultas

Esta etapa cria reservas com status **PENDENTE**. Cada agendamento já ocupa uma vaga do horário. Confirmação, cancelamento, conclusão, duração de serviços e remarcação serão tratados em etapas posteriores.

## Endpoints

| Método | Rota | Finalidade |
| --- | --- | --- |
| POST | `/api/v1/agendamentos` | Cliente cria uma reserva |
| GET | `/api/v1/agendamentos/me?page=0&size=20` | Cliente ou prestador lista os próprios agendamentos |
| GET | `/api/v1/agendamentos/{id}` | Consulta restrita ao cliente e prestador envolvidos |

Todas as rotas exigem `Authorization: Bearer <ID token Firebase>`. O UID vem do token e o cliente não pode ser escolhido pelo corpo da requisição. Contas inativas não podem utilizar essas operações. Um prestador ativo sem agendamentos recebe uma página vazia.

```json
{
  "veiculoId": "550e8400-e29b-41d4-a716-446655440201",
  "horarioId": "550e8400-e29b-41d4-a716-446655440301",
  "especialidadeId": 1
}
```

Os IDs acima são ilustrativos. Obtenha os IDs reais por `/api/v1/veiculos/me`, pela consulta pública de horários e pelas especialidades do perfil público do prestador. O perfil deve atender tanto o tipo do veículo quanto a especialidade.

O POST retorna `201`, o agendamento com seu ID, data, hora, vínculos, status e instante de criação, e o header `Location` da consulta individual. Não há endpoint de alteração ou exclusão da reserva nesta etapa. Após falha de conexão ou resposta perdida, consulte a listagem antes de repetir o POST; uma reserva já confirmada no banco pode gerar `409` na repetição.

## Regras e concorrência

- Somente um cliente ativo pode criar; o veículo deve estar ativo e pertencer a essa conta.
- O horário deve existir, estar no futuro no fuso `America/Sao_Paulo`, estar aberto e ter capacidade livre.
- O prestador deve estar ativo e atender o tipo do veículo e a especialidade solicitada.
- O mesmo veículo não pode ser reservado para a mesma data e hora, inclusive em prestadores diferentes. Como não há duração de serviço nesta etapa, a regra compara o instante inicial exato.
- `vagasDisponiveis = capacidadeTotal - reservas PENDENTES`. Horários lotados deixam de aparecer na consulta pública.
- O prestador pode aumentar capacidade e bloquear/reabrir o horário. Não pode reduzir a capacidade abaixo das reservas existentes. O bloqueio não cancela agendamentos anteriores.

A criação utiliza uma única transação. Os bloqueios são adquiridos em ordem: cliente, veículo e horário. O veículo serializa tentativas duplicadas, e o horário serializa o cálculo das vagas e sua gravação. A alteração de capacidade utiliza o mesmo bloqueio do horário e confere novamente a ocupação. O banco também possui uma restrição única para veículo/data/hora e vínculos por chaves estrangeiras.

As regras ficam em `agendamento/application`, sem dependências Spring. O adapter `AgendamentosTransacionais` estabelece a transação, e os adapters de persistência exigem uma transação ativa. A nova tabela `agendamento` e seus índices são criados pelo `ddl-auto: update` atual; não foram introduzidas migrations. A evolução para cancelamentos precisará rever a regra de unicidade para permitir novas reservas após liberar uma vaga.

## Paginação e formatos

`page` começa em zero. `size` aceita 1 a 100, com padrão 20. A ordem é data, hora e ID em ordem crescente. A consulta sempre aplica o vínculo do usuário autenticado, inclusive antes de calcular os totais.

Com `Accept: application/json`, a página possui `content`, `page`, `size`, `totalElements` e `totalPages`. Com `Accept: application/hal+json`, os itens ficam em `_embedded.agendamentos`, os metadados em `page` e a navegação em `_links`. Página vazia mantém o array nomeado. Os recursos HAL oferecem `self`, `collection` e consulta pública do prestador; não anunciam ações ainda não implementadas.

## Erros

| Status | Situação |
| --- | --- |
| 400 | Corpo, UUID, especialidade ou parâmetros de paginação inválidos |
| 401 | Token ausente, inválido ou expirado |
| 404 | Conta local ou recurso inexistente; veículo/agendamento não acessível ao usuário |
| 409 | Horário lotado, duplicidade do veículo ou conflito de gravação |
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
