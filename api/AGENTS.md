# Diretrizes de desenvolvimento da API

- Use catálogo e usuários como referência de organização e legibilidade.
- Use indentação de quatro espaços, linhas em branco entre membros e métodos e blocos de responsabilidade distintos.
- Declare uma variável por declaração e uma instrução por linha. Use nomes descritivos e imports explícitos.
- Separe as anotações das declarações e formate construtores, parâmetros e chamadas longas de forma legível.
- Preserve a arquitetura atual. Evite abstrações, dependências e camadas adicionais sem necessidade concreta.
- Teste principalmente regras sensíveis: autorização, integridade, transações, capacidade e concorrência. Prefira poucos testes representativos; evite duplicar a mesma regra em vários níveis ou testar detalhes internos da implementação.
- Antes de desenvolver uma etapa, apresente escopo, impactos e fluxo de testes e aguarde aprovação. Parta da develop atualizada, use uma branch apropriada e registre commits. Aguarde a validação do usuário antes de avançar; não realize push sem autorização.
