# MobiFix Mobile

Aplicativo Expo/React Native integrado à API Spring Boot do monorepo. Firebase Authentication cuida de login, confirmação de e-mail, persistência da sessão e recuperação de senha. Contas, perfis profissionais, catálogos e busca de prestadores são obtidos da API/PostgreSQL.

## Preparar e executar

1. Instale Node.js **24.12 ou superior** (linha 24 LTS), exigido pelas dependências Firebase atuais, e inicie a API seguindo o [README da API](../api/README.md).
2. Na pasta `mobile`, instale as dependências conforme o arquivo de lock:

```powershell
npm ci
Copy-Item .env.example .env
```

3. Edite `.env` com o endereço completo até `/api/v1`:

```dotenv
EXPO_PUBLIC_API_URL=http://192.168.1.100:8080/api/v1
```

Substitua o IP pelo endereço do computador na rede local. Em celular físico, `localhost` aponta para o próprio celular. O aparelho precisa alcançar o computador, a porta da API precisa estar acessível e os dispositivos devem estar na mesma rede. Em emuladores, utilize o endereço do host acessível ao emulador. Para execução no navegador do próprio computador, pode ser usado `http://localhost:8080/api/v1`.

4. Inicie o aplicativo:

```powershell
npm start
```

Após alterar o `.env`, recarregue completamente o app. Endereços HTTP são destinados ao desenvolvimento local; para distribuição utilize uma API HTTPS e valide o build nativo utilizado. O túnel do Expo para o Metro não publica automaticamente a API.

O app usa o projeto Firebase `mobifix-59380`, definido em `src/config/firebase.ts`. Configure **o mesmo projeto** no backend por `FIREBASE_PROJECT_ID`. A chave de conta de serviço (`GOOGLE_APPLICATION_CREDENTIALS`) fica exclusivamente no servidor, fora do repositório. Variáveis `EXPO_PUBLIC_*` são públicas e nunca devem conter chaves privadas, senhas de banco ou tokens.

No navegador, configure `CORS_ALLOWED_ORIGINS` na API com a origem em que o Expo está sendo executado (por exemplo, `http://localhost:8081`). O Firebase precisa ter o provedor e-mail/senha habilitado e as configurações de envio de e-mail adequadas.

## Fluxo de autenticação e cadastro

1. O cadastro cria a identidade no Firebase e envia o e-mail de confirmação.
2. O app obtém o ID token pelo SDK e cadastra a conta em `POST /api/v1/usuarios`. O telefone é enviado apenas com dígitos; senha e UID não são enviados no corpo.
3. Para prestadores, envia o perfil completo em `POST /api/v1/prestadores/me/perfil`, utilizando os IDs dos catálogos da API.
4. Após confirmar o e-mail, o app consulta `/usuarios/me` e, quando necessário, `/prestadores/me/perfil` antes de abrir a área principal.
5. No login seguinte, a identidade é restaurada pelo Firebase e os dados atuais são recarregados da API.

As requisições protegidas usam `Authorization: Bearer <ID token>`. O SDK fornece o token atual; após um `401`, o cliente tenta renová-lo e repete a requisição **uma única vez**. As consultas públicas não enviam token. Não existe login por senha na API nem armazenamento manual de token pelo cliente HTTP.

O app mantém a confirmação de e-mail como condição de navegação. **A API atualmente não impõe `email_verified`**; `ativo` no PostgreSQL e confirmação de e-mail são estados diferentes. Publicação de perfil pela API segue suas regras atuais e não depende de o profissional abrir o aplicativo.

### Cadastro interrompido e contas antigas

Se a API falhar depois da criação da identidade Firebase, o aplicativo **não apaga a conta**. Entre com essa conta, confirme o e-mail e utilize a tela **Concluir cadastro**. Se a conta local já existe e falta apenas o perfil profissional, ele pode ser concluído sem cadastrar novamente o usuário. Os dados ainda não salvos precisam ser preenchidos novamente; não persistimos senha nem rascunhos pessoais do cadastro.

- Conta sem cadastro na API: apresenta o formulário de conclusão.
- Prestador sem perfil: apresenta os campos profissionais e preserva o tipo da conta.
- Conta local desativada: bloqueia a área principal e permite sair.
- API indisponível: apresenta erro e opção de tentar novamente, sem confundir a falha com cadastro ausente.
- Conta criada anteriormente apenas no Firestore: precisa concluir o cadastro na API. Os documentos antigos não são migrados automaticamente.
- Contas antigas da API criadas com mocks não são vinculadas automaticamente aos UIDs reais. E-mail já cadastrado pode gerar conflito, que precisa ser tratado nos dados de teste.

Login, logout, recuperação e confirmação de e-mail continuam no Firebase. O botão Google permanece como funcionalidade futura.

## Dados e funcionalidades

- Prestadores informam nome e sobrenome da pessoa responsável, nome fantasia opcional, endereço separado e seleções dos catálogos reais.
- Busca utiliza a paginação e os filtros por ID da API, com botão **Carregar mais**. O campo textual filtra somente os resultados carregados; a API ainda não possui pesquisa textual geral.
- O ID público de um prestador é o ID do perfil profissional retornado pela API, não o UID Firebase.
- Avaliações não são inventadas: os cards não exibem notas enquanto não houver contrato correspondente na API.
- Os indicadores e cards do dashboard continuam sendo exemplos do protótipo; agendamentos, avaliações e agenda mobile não foram implementados nesta integração.
- As rotinas ativas não utilizam Firestore. `firestore.rules` permanece no repositório como arquivo anterior, sem ser necessário para este fluxo.
- O ponto de entrada atual é `index.ts` → `App.tsx`. A validação de tipos e o lint abrangem esse app e seus módulos, preservando sem alterações os arquivos não utilizados do template em `src/app` e componentes relacionados. Não foi feita migração de navegação nesta etapa.

## Verificações automatizadas

```powershell
npm run typecheck
npm run lint
npm test
```

Os testes executam os serviços TypeScript com rede e Firebase controlados, sem criar contas reais. Cobrem headers, renovação limitada, troca de identidade, cadastro parcial, separação de erro de conexão e conta ausente, desativação e contratos da API. Eles não substituem a execução em aparelho/emulador com o Firebase e a API reais.

## Roteiro de teste manual

1. Com API e PostgreSQL disponíveis, configure `.env` e inicie o app.
2. Cadastre um cliente, confirme o e-mail e confira `/usuarios/me` e a conta no aplicativo.
3. Saia, faça login novamente e reinicie o app; a conta correta deve ser carregada.
4. Cadastre outro usuário como prestador, selecione catálogos reais e preencha endereço completo. Confira o perfil e sua presença na busca da API.
5. Desligue a API após criar uma identidade Firebase ou interrompa o cadastro profissional. Ao restabelecer a API e entrar novamente, conclua o cadastro pendente sem gerar outra identidade.
6. Teste recuperação de senha, reenvio de confirmação e login com senha inválida.
7. Desative uma conta pela API e confirme que o app impede o acesso à área principal.
8. Teste API indisponível e retorno ao serviço usando **Tentar novamente**. Confira que dados de uma conta não permanecem após sair e entrar com outra.
9. Na busca, confira filtros, resultados vazios e paginação com mais de 20 perfis no banco de teste.

Referências: [variáveis de ambiente Expo](https://docs.expo.dev/guides/environment-variables/), [Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/) e [verificação de ID tokens Firebase](https://firebase.google.com/docs/auth/admin/verify-id-tokens).
