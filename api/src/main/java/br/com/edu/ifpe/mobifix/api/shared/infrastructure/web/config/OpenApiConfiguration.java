package br.com.edu.ifpe.mobifix.api.shared.infrastructure.web.config;

import java.util.List;
import java.util.Map;
import io.swagger.v3.oas.models.*;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.media.*;
import io.swagger.v3.oas.models.responses.ApiResponse;
import io.swagger.v3.oas.models.tags.Tag;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfiguration {
    private static final String JSON = "application/json";
    private static final String HAL = "application/hal+json";
    private static final String PROBLEM = "application/problem+json";

    @Bean
    public OpenAPI mobifixOpenApi() {
        return new OpenAPI().info(new Info().title("MobiFix API").version("v1").description("""
                API de serviços automotivos. A identidade atual é simulada pela configuração app.mock.firebase-id;
                não existe autenticação Firebase ativa nesta versão. Cada operação de gerenciamento usa a conta desse mock.

                application/json mantém o contrato original. Solicite Accept: application/hal+json para receber links em _links
                e coleções em _embedded. Em HAL, editar usa PUT e desativar usa DELETE; seguir apenas um href como GET não executa essas ações.
                Os links não substituem as validações de permissão. Respostas 204 não possuem corpo.

                Datas seguem ISO-8601. Os horários de atendimento usam o fuso America/Sao_Paulo.
                IDs de exemplos são ilustrativos: consulte os catálogos e utilize os identificadores do seu banco.
                """)).tags(List.of(
                new Tag().name("Catálogos").description("Tipos de veículos e especialidades disponíveis para seleção."),
                new Tag().name("Usuários").description("Cadastro, consulta, edição e desativação da conta do mock."),
                new Tag().name("Veículos").description("Veículos ativos pertencentes ao cliente do mock."),
                new Tag().name("Perfil profissional").description("Gerenciamento do próprio perfil de prestador."),
                new Tag().name("Busca de prestadores").description("Busca e consulta pública, sem dados pessoais privados."),
                new Tag().name("Agenda").description("Horários, capacidade e disponibilidade pública dos prestadores.")));
    }

    @Bean
    public OpenApiCustomizer documentarContratos() {
        return api -> {
            if (api.getComponents() == null) api.setComponents(new Components());
            api.getComponents().addSchemas("LinksHal", new ObjectSchema().additionalProperties(
                    new ObjectSchema().addProperty("href", new StringSchema().format("uri")).addProperty("templated", new BooleanSchema())));
            api.getComponents().addSchemas("ErroApi", new ObjectSchema()
                    .addProperty("type", new StringSchema().example("about:blank"))
                    .addProperty("title", new StringSchema().example("Bad Request"))
                    .addProperty("status", new IntegerSchema().example(400))
                    .addProperty("detail", new StringSchema().example("Revise os campos informados."))
                    .addProperty("instance", new StringSchema().example("/api/v1/usuarios/me"))
                    .addProperty("errors", new ArraySchema().items(new ObjectSchema()
                            .addProperty("field", new StringSchema()).addProperty("message", new StringSchema()))));
            if (api.getPaths() == null) return;
            api.getPaths().forEach((path, item) -> item.readOperationsMap().forEach((method, operation) -> {
                if (!path.startsWith("/api/v1/")) return;
                operation.setTags(List.of(tag(path)));
                operation.setSummary(resumo(path, method));
                operation.setDescription(descricao(path, method));
                if (operation.getParameters() != null) operation.getParameters().forEach(param -> {
                    param.setDescription(descricaoParametro(param.getName()));
                    if ("page".equals(param.getName())) param.getSchema().minimum(java.math.BigDecimal.ZERO);
                    if ("size".equals(param.getName())) param.getSchema().minimum(java.math.BigDecimal.ONE).maximum(java.math.BigDecimal.valueOf(100));
                });
                if (operation.getRequestBody() != null && operation.getRequestBody().getContent() != null) {
                    Object exemplo = exemplo(path, method);
                    if (exemplo != null) operation.getRequestBody().getContent().values().forEach(content -> content.setExample(exemplo));
                }
                if (operation.getResponses() == null) return;
                operation.getResponses().forEach((status, response) -> {
                    if (!status.startsWith("2") || status.equals("204") || response.getContent() == null) return;
                    var json = response.getContent().get(JSON);
                    if (json == null || json.getSchema() == null) return;
                    response.getContent().addMediaType(HAL, new MediaType().schema(schemaHal(path, json.getSchema())));
                });
                for (String status : erros(path, method)) {
                    operation.getResponses().addApiResponse(status, new ApiResponse().description(descricaoErro(status))
                            .content(new Content().addMediaType(PROBLEM, new MediaType().schema(new Schema<>().$ref("#/components/schemas/ErroApi")))));
                }
            }));
            api.getComponents().getSchemas().forEach(this::documentarSchema);
        };
    }

    private void documentarSchema(String nome, Schema<?> schema) {
        if (schema.getProperties() == null) return;
        schema.getProperties().forEach((campo, valor) -> {
            Schema<?> propriedade = valor;
            if (propriedade.getDescription() == null) propriedade.setDescription(descricaoCampo(campo));
            Object exemplo = exemploCampo(campo);
            if (exemplo != null && propriedade.getExample() == null && propriedade.get$ref() == null) propriedade.setExample(exemplo);
            if (nome.endsWith("Response") && List.of("id", "usuarioId", "clienteId", "prestadorId").contains(campo)) propriedade.setReadOnly(true);
        });
    }
    private Schema<?> schemaHal(String path, Schema<?> json) {
        if (path.equals("/api/v1/prestadores")) {
            return new ObjectSchema().addProperty("_embedded", new ObjectSchema().addProperty("prestadores",
                    new ArraySchema().items(recursoHal(new Schema<>().$ref("#/components/schemas/PrestadorPublicoResponse")))))
                    .addProperty("_links", links()).addProperty("page", new ObjectSchema()
                            .addProperty("size", new IntegerSchema()).addProperty("number", new IntegerSchema())
                            .addProperty("totalElements", new IntegerSchema().format("int64")).addProperty("totalPages", new IntegerSchema()));
        }
        if (json.getItems() != null) {
            String rel = path.contains("tipos-veiculo") ? "tiposVeiculo" : path.contains("especialidades") ? "especialidades" : path.contains("veiculos") ? "veiculos" : "horarios";
            return new ObjectSchema().addProperty("_embedded", new ObjectSchema().addProperty(rel, new ArraySchema().items(recursoHal(json.getItems()))))
                    .addProperty("_links", links());
        }
        return recursoHal(json);
    }
    private Schema<?> recursoHal(Schema<?> dados) {
        return new ComposedSchema().addAllOfItem(dados).addAllOfItem(new ObjectSchema().addProperty("_links", links()));
    }
    private Schema<?> links() { return new Schema<>().$ref("#/components/schemas/LinksHal"); }

    private String tag(String path) {
        if (path.contains("horarios")) return "Agenda";
        if (path.contains("tipos-veiculo") || path.contains("especialidades")) return "Catálogos";
        if (path.contains("usuarios")) return "Usuários";
        if (path.contains("veiculos")) return "Veículos";
        return path.contains("/me/perfil") ? "Perfil profissional" : "Busca de prestadores";
    }
    private String resumo(String path, PathItem.HttpMethod method) {
        return switch (method) {
            case POST -> path.contains("horarios") ? "Criar horário de atendimento" : path.contains("perfil") ? "Cadastrar perfil profissional" : path.contains("veiculos") ? "Cadastrar veículo do cliente" : "Cadastrar usuário";
            case PUT -> path.contains("horarios") ? "Alterar capacidade e bloqueio do horário" : path.contains("perfil") ? "Editar perfil profissional" : path.contains("veiculos") ? "Editar veículo do cliente" : "Editar dados pessoais";
            case DELETE -> path.contains("veiculos") ? "Desativar veículo sem excluir seu histórico" : "Desativar a própria conta";
            default -> path.equals("/api/v1/prestadores") ? "Buscar prestadores com filtros e paginação" : path.contains("horarios") ? "Consultar horários por período" : path.endsWith("/{id}") ? "Consultar recurso pelo identificador" : path.contains("perfil") ? "Consultar o próprio perfil profissional" : path.contains("usuarios") ? "Consultar a própria conta" : path.contains("veiculos") ? "Listar veículos ativos do cliente" : "Listar opções do catálogo";
        };
    }
    private String descricao(String path, PathItem.HttpMethod method) {
        String base = "JSON é o formato padrão. HAL é opcional por Accept: application/hal+json. ";
        if (path.contains("tipos-veiculo") || path.contains("especialidades")) return base + "Lista de opções previamente cadastradas pelo sistema. Utilize os IDs retornados nos cadastros de veículos e perfis profissionais. Não existem operações públicas de alteração dos catálogos nesta versão.";
        if (path.equals("/api/v1/prestadores")) return base + "Todos os filtros fornecidos são combinados com AND. Cidade é comparada sem diferenciar maiúsculas de minúsculas. Somente contas ativas do tipo PRESTADOR com perfil aparecem. A ordenação usa nome fantasia e ID. Catálogo inexistente retorna lista vazia. Em HAL, os links preservam os filtros.";
        if (path.contains("horarios")) return base + "Datas inclusivas em ISO-8601; período máximo de 366 dias. Sem datas, consulta de hoje até os próximos 30 dias. Fuso America/Sao_Paulo. A consulta pública mostra apenas horários futuros, abertos e com vagas. A criação manual permite fins de semana e horários fora do padrão mensal. PUT altera somente capacidade e bloqueio. Ainda não há reservas: vagas disponíveis correspondem à capacidade. A geração mensal acontece no dia 1 às 00:05, na inicialização e após cadastro confirmado do prestador, sem sobrescrever ajustes manuais.";
        if (path.contains("usuarios")) return base + "Usa a identidade configurada no mock. PUT altera apenas nome, sobrenome, telefone e UF; preserva IDs, e-mail e tipo. DELETE desativa sem excluir vínculos e pode ser repetido. GET /me permanece disponível para contas desativadas. Não há reativação nesta versão.";
        if (path.contains("veiculos")) return base + "Exige cliente ativo. O proprietário vem do mock e não pode ser escolhido pelo corpo. Veículo inexistente, desativado ou de outra conta retorna 404. DELETE é lógico. Placa brasileira é opcional; formatos antigo e Mercosul são aceitos. Ano permitido de 1886 até o ano seguinte ao atual.";
        if (path.contains("/me/perfil")) return base + "Exige conta ativa do tipo PRESTADOR. Seleções de veículos e especialidades são obrigatórias e devem existir. PUT substitui as seleções, preservando os IDs. O cadastro confirmado gera imediatamente a agenda do próximo mês.";
        return base + "Consulta pública. O identificador é o ID do perfil profissional. Não expõe e-mail, telefone, identificador Firebase ou endereço completo. Prestador inexistente ou inativo retorna 404.";
    }
    private List<String> erros(String path, PathItem.HttpMethod method) {
        if (path.contains("tipos-veiculo") || path.contains("especialidades")) return List.of();
        if (path.equals("/api/v1/prestadores")) return List.of("400");
        if (path.contains("prestadores") && !path.contains("/me/")) return List.of("400", "404");
        if (path.contains("usuarios")) {
            if (method == PathItem.HttpMethod.POST) return List.of("400", "409");
            if (method == PathItem.HttpMethod.GET || method == PathItem.HttpMethod.DELETE) return List.of("404");
            return List.of("400", "404", "422");
        }
        if (method == PathItem.HttpMethod.POST || method == PathItem.HttpMethod.PUT) return List.of("400", "404", "409", "422");
        return List.of("400", "404", "422");
    }
    private String descricaoErro(String status) {
        return switch(status) {
            case "400" -> "Campos, identificadores ou parâmetros inválidos.";
            case "404" -> "Recurso não encontrado ou indisponível para a conta atual.";
            case "409" -> "Cadastro duplicado, horário já existente ou conflito de integridade.";
            default -> "Regra de negócio não atendida: conta inativa, tipo de conta inadequado, horário passado ou referência inexistente.";
        };
    }
    private String descricaoParametro(String nome) {
        return switch(nome) {
            case "id", "prestadorId" -> "UUID do recurso; para prestador, use o ID do perfil profissional, não o da conta.";
            case "tipoVeiculoId" -> "ID positivo obtido no catálogo de tipos de veículos.";
            case "especialidadeId" -> "ID positivo obtido no catálogo de especialidades.";
            case "page" -> "Página iniciando em zero.";
            case "size" -> "Quantidade por página: de 1 a 100, padrão 20.";
            case "inicio", "fim" -> "Data inclusiva em formato yyyy-MM-dd.";
            case "cidade" -> "Nome completo da cidade; comparação sem diferenciar maiúsculas de minúsculas.";
            default -> "Sigla de uma UF brasileira.";
        };
    }
    private String descricaoCampo(String campo) {
        return switch(campo) {
            case "id" -> "Identificador gerado pelo sistema.";
            case "tipoVeiculoId", "tiposVeiculoIds" -> "Identificador ou seleção de identificadores do catálogo de tipos de veículos.";
            case "especialidadeIds" -> "Selecione pelo menos uma especialidade existente no catálogo.";
            case "capacidadeTotal" -> "Número de vagas configuradas para o horário; zero é permitido.";
            case "vagasDisponiveis" -> "Vagas disponíveis. Nesta versão sem reservas, corresponde à capacidade total.";
            case "bloqueado" -> "Quando verdadeiro, o horário não aparece na disponibilidade pública.";
            case "ativo" -> "Estado da conta; não pode ser alterado pelo PUT de dados pessoais.";
            case "nomeFantasia" -> "Nome profissional opcional; no perfil público, sua ausência usa nome e sobrenome.";
            case "telefone" -> "DDD e telefone, com 10 ou 11 dígitos, sem formatação.";
            case "placa" -> "Placa brasileira opcional, antiga ou Mercosul. Retorno normalizado sem hífen e em maiúsculas.";
            case "cep" -> "CEP com oito dígitos, preservando zeros à esquerda.";
            case "email" -> "E-mail da conta; alteração não disponível nesta etapa.";
            case "nome", "sobrenome" -> "Nome ou sobrenome da pessoa; obrigatório, com até 100 caracteres. No perfil público, nome é a identificação profissional exibida.";
            case "tipo" -> "Tipo exclusivo da conta: CLIENTE ou PRESTADOR. Não pode ser alterado após o cadastro.";
            case "usuarioId", "clienteId", "prestadorId" -> "Identificador interno do vínculo. O backend determina o responsável pela identidade atual.";
            case "descricao" -> "Apresentação dos serviços profissionais, com até 2000 caracteres.";
            case "endereco" -> "Endereço de atendimento do prestador. A consulta pública apresenta somente cidade e UF.";
            case "logradouro" -> "Rua, avenida ou outro logradouro de atendimento, com até 200 caracteres.";
            case "numero" -> "Número textual do endereço, permitindo valores como 120A ou S/N.";
            case "complemento" -> "Complemento opcional do endereço, com até 100 caracteres.";
            case "bairro", "cidade" -> "Bairro ou cidade de atendimento, com até 100 caracteres.";
            case "uf" -> "Sigla de uma UF brasileira, em letras maiúsculas.";
            case "marca", "modelo" -> "Marca ou modelo do veículo, obrigatório, com até 100 caracteres.";
            case "ano" -> "Ano do veículo, de 1886 até o ano seguinte ao atual.";
            case "data" -> "Data do atendimento em formato yyyy-MM-dd.";
            case "horaInicio" -> "Hora local do atendimento, com precisão de minutos, no fuso America/Sao_Paulo.";
            case "tiposVeiculo", "especialidades" -> "Opções atendidas pelo prestador, com identificador e nome do catálogo.";
            case "content" -> "Recursos da página no contrato JSON. Em HAL, os recursos ficam em _embedded.";
            case "page", "number" -> "Número da página, iniciando em zero. No JSON, page é numérico; no HAL, page contém os metadados.";
            case "size" -> "Quantidade solicitada por página, entre 1 e 100.";
            case "totalElements" -> "Total de recursos compatíveis com os filtros.";
            case "totalPages" -> "Quantidade total de páginas para o tamanho solicitado.";
            case "href" -> "Endereço do recurso ou da ação relacionada. O método HTTP da ação é descrito na operação.";
            case "templated" -> "Indica que o endereço contém um template de URI.";
            case "type", "title", "status", "detail", "instance" -> "Informação do erro no formato Problem Details.";
            case "errors" -> "Lista opcional de campos inválidos e respectivas mensagens.";
            case "field", "message" -> "Campo inválido ou mensagem explicando a validação.";
            default -> "Propriedade da representação da API.";
        };
    }
    private Object exemploCampo(String campo) {
        return switch(campo) {
            case "nome" -> "Ana"; case "sobrenome" -> "Silva"; case "email" -> "ana@example.com";
            case "telefone" -> "81999999999"; case "uf" -> "PE"; case "cidade" -> "Recife";
            case "marca" -> "Fiat"; case "modelo" -> "Uno"; case "ano" -> 2020; case "placa" -> "ABC1D23";
            case "cep" -> "50000000"; case "horaInicio" -> "08:30:00"; case "data" -> "2030-01-02";
            case "capacidadeTotal", "vagasDisponiveis" -> 3; case "bloqueado" -> false;
            default -> null;
        };
    }
    private Object exemplo(String path, PathItem.HttpMethod method) {
        if (path.contains("horarios")) return method == PathItem.HttpMethod.POST
                ? Map.of("data", "2030-01-02", "horaInicio", "08:30", "capacidadeTotal", 3)
                : Map.of("capacidadeTotal", 5, "bloqueado", false);
        if (path.contains("veiculos")) return Map.of("tipoVeiculoId", 1, "marca", "Fiat", "modelo", "Uno", "ano", 2020, "placa", "ABC1D23");
        if (path.contains("usuarios")) return method == PathItem.HttpMethod.POST
                ? Map.of("nome", "Ana", "sobrenome", "Silva", "email", "ana@example.com", "telefone", "81999999999", "uf", "PE", "tipo", "CLIENTE")
                : Map.of("nome", "Maria", "sobrenome", "Souza", "telefone", "11988888888", "uf", "SP");
        if (path.contains("perfil")) return Map.of("nomeFantasia", "Oficina Souza", "descricao", "Manutenção automotiva.",
                "endereco", Map.of("logradouro", "Rua das Flores", "numero", "120", "bairro", "Centro", "cidade", "Recife", "uf", "PE", "cep", "50000000"),
                "tiposVeiculoIds", List.of(1, 2), "especialidadeIds", List.of(1, 3));
        return null;
    }
}
