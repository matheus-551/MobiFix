# Swagger e HATEOAS

## Documentacao e identidade

- Swagger UI: `/swagger-ui/index.html`.
- OpenAPI JSON: `/v3/api-docs`.
- A API ainda usa a identidade de `app.mock.firebase-id`. Nao existe autenticacao Firebase ativa nesta etapa.
- Os IDs dos exemplos sao ilustrativos. Consulte os catalogos antes de cadastrar os recursos.

## Negociacao de conteudo

Os mesmos endpoints oferecem duas representacoes:

```http
Accept: application/json
```

Mantem os objetos, arrays e a pagina com `content`, `page`, `size`, `totalElements` e `totalPages` que ja existiam. Esse e o padrao quando Accept nao especifica uma preferencia.

```http
Accept: application/hal+json
```

Retorna recursos com `_links`, colecoes em `_embedded` e metadados de paginacao no objeto `page` (`number`, `size`, `totalElements`, `totalPages`). Colecoes vazias preservam o nome e o array vazio em `_embedded`.

O corpo enviado em POST e PUT continua usando `Content-Type: application/json`. Accept controla a resposta, nao o formato do corpo enviado.

## Links e metodos

- `self`: consulta do recurso, quando existe um GET individual.
- `collection`, `catalogo`, `agenda`, `perfil`, `veiculos`, `horarios`, `publico`, `disponibilidade`: navegacao para recursos relacionados.
- `editar`: executar PUT no href, com o corpo documentado no Swagger.
- `desativar`: executar DELETE no href.
- `first`, `prev`, `next`, `last`: navegacao da busca paginada preservando os filtros.

Um link nao executa automaticamente PUT ou DELETE e nao substitui a verificacao de permissao. A consulta publica nao apresenta links de gerenciamento. Contas desativadas nao recebem links para alterar a conta. Horarios passados nao recebem link de edicao. Catalogos e horarios sem GET individual apontam para as colecoes reais, sem inventar endpoints.

## Teste manual

1. Inicie PostgreSQL e a API e abra o Swagger.
2. Confira as tags, exemplos, parametros e os codigos de resposta.
3. Execute GET `/api/v1/tipos-veiculo` com Accept JSON: o resultado continua sendo um array.
4. Repita com Accept HAL: confira `_embedded.tiposVeiculo` e `_links.self`.
5. Cadastre e consulte o usuario e um veiculo. Verifique que JSON nao contem `_links` e que HAL mantem os campos mais os links.
6. Na busca de prestadores, use filtros e size=1. Siga `next` e confira a preservacao dos filtros.
7. Verifique um resultado vazio, erros de validacao e recurso inexistente.
8. Execute DELETE numa conta de teste. Confirme 204 sem corpo e que GET /usuarios/me em HAL nao oferece editar/desativar.

Exemplo em PowerShell:

```powershell
Invoke-RestMethod -Uri 'http://localhost:8080/api/v1/tipos-veiculo' -Headers @{ Accept = 'application/hal+json' } | ConvertTo-Json -Depth 10
```

Nao e necessario mudar o banco, habilitar migrations ou modificar regras do dominio para utilizar as representacoes.
