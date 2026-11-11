# MobiFix Web

Plataforma que conecta clientes a prestadores de serviços automotivos. Next.js (App Router) + React + TypeScript + Tailwind, com Firebase Authentication, Firestore e Cloud Storage.

> Este projeto usa uma versão do Next.js com mudanças em relação ao que é comum. Consulte `node_modules/next/dist/docs/` (veja `AGENTS.md`) antes de usar APIs novas.

## Requisitos

- Node.js 20+ e npm
- Um projeto Firebase (plano Spark/gratuito é suficiente)

## Instalação

```bash
npm install
cp .env.example .env.local   # preencha com os valores do seu projeto Firebase
npm run dev                  # http://localhost:3000
```

## Configuração do Firebase

1. **Projeto**: https://console.firebase.google.com → *Adicionar projeto*.
2. **App web**: *Configurações do projeto → Geral → Seus apps → Web (`</>`)*. Copie o objeto `firebaseConfig` para o `.env.local`:
   `apiKey`→`NEXT_PUBLIC_FIREBASE_API_KEY`, `authDomain`→`..._AUTH_DOMAIN`, `projectId`→`..._PROJECT_ID`, `storageBucket`→`..._STORAGE_BUCKET`, `messagingSenderId`→`..._MESSAGING_SENDER_ID`, `appId`→`..._APP_ID`.
3. **Authentication → Método de login**: habilite **E-mail/senha** (não é necessário o "link por e-mail").
4. **Authentication → Configurações → Domínios autorizados**: confirme `localhost` e adicione o domínio de produção. Sem isso, o envio de e-mails com link de retorno falha (`auth/unauthorized-continue-uri`).
5. **Authentication → Modelos (Templates)**: em *Verificação de endereço de e-mail* e *Redefinição de senha*, escolha o idioma **Português (Brasil)**, personalize nome do remetente/assunto/mensagem e, em **Personalizar URL de ação**, informe `https://SEU-DOMINIO/auth/acao` (em desenvolvimento: `http://localhost:3000/auth/acao`). Assim os links abrem a página do MobiFix (`/auth/acao`). Se deixar a URL padrão, o Firebase usa a página hospedada dele (`/__/auth/action`) e ambos os fluxos continuam funcionando.
6. **Firestore Database**: crie o banco (modo produção) e publique as regras de `firebase/firestore.rules`.
7. **Storage**: ative o Cloud Storage (exige plano Blaze em projetos novos) e publique `firebase/storage.rules`.
8. Publicar regras: cole o conteúdo no console, ou use `npm i -g firebase-tools && firebase login && firebase use <projectId> && firebase deploy --only firestore:rules,storage`.

### Verificação de e-mail: ligar/desligar em um só lugar

Variável no `.env.local` (modelo em `.env.example`):

```env
NEXT_PUBLIC_EMAIL_VERIFICATION_ENABLED=true    # exige confirmar o e-mail (padrão)
NEXT_PUBLIC_EMAIL_VERIFICATION_ENABLED=false   # dispensa a verificação: nenhum e-mail é enviado e a conta já entra
```

O prefixo `NEXT_PUBLIC_` é exigido pelo Next.js para a variável chegar ao navegador. O valor é lido em **um único arquivo**,
`src/shared/config/features.ts`, e é embutido na compilação: reinicie `npm run dev` (ou refaça o build) ao mudar.

As regras do Firestore também exigem `email_verified` (agendamentos, avaliações, edição de perfil). Para ficarem iguais ao front:

```bash
npm run rules:email                      # lê o valor do .env.local e ajusta firebase/firestore.rules
firebase deploy --only firestore:rules   # publica as regras
```

Obs.: a API (`api.zip`) **não** exige `email_verified` e não possui endpoints de verificação; a verificação é 100% Firebase.

### Autenticação (100% Firebase Authentication)

Não há provedor de e-mail externo, domínio de envio, códigos próprios nem segredos HMAC: os e-mails de verificação e de redefinição são enviados pelo próprio Firebase.

**Cadastro** (cliente em `/cadastro`, prestador em `/cadastro/prestador`):
1. `createUserWithEmailAndPassword` cria a conta (a senha só passa pelo SDK do Firebase).
2. `users` + perfil são gravados (o prestador não envia imagens nem documentos); se algo falhar, a conta é removida.
3. Com a verificação ativa, `sendEmailVerification` envia o link; com ela desativada, nada é enviado e a conta já entra. A tela de verificação (`VerifyEmailPanel`) informa o envio, tem "Reenviar e-mail" (intervalo de 60 s e no máximo 5 por hora, persistido no navegador; o Firebase ainda aplica o próprio limite), "Já confirmei meu e-mail" (`reload()` + renovação do ID Token) e checagem automática a cada 5 s e ao voltar para a aba.

**Verificação**: o link abre `/auth/acao?mode=verifyEmail&oobCode=…`, que chama `applyActionCode`. Em seguida o app faz `reload()` e `getIdToken(true)`, de modo que o claim `email_verified` chegue atualizado às regras do Firestore/Storage e ao backend.

**Login** (`signInWithEmailAndPassword`, com limite de 20 s): com a verificação ativa e sem e-mail verificado a sessão existe (necessária para reenviar o link), mas `RequireAuth`/`GuestOnly` levam a `/verificar-email`; nenhuma área protegida abre. Credenciais erradas, rede/tempo esgotado e conta sem perfil no Firestore exibem mensagem e encerram o carregamento. A persistência segue "Manter conectado".

**Redefinição de senha**: `/recuperar-senha` chama `sendPasswordResetEmail` (resposta sempre neutra, sem revelar se o e-mail existe; mesmo intervalo de reenvio). O link abre `/auth/acao?mode=resetPassword&oobCode=…`, que usa `verifyPasswordResetCode` + `confirmPasswordReset`.

**Autorização**: as regras (`firebase/*.rules`) exigem `email_verified` para agendamentos, avaliações e edição de perfil. A criação de `users`/perfis acontece logo após criar a conta (ainda sem verificação) para não perder dados do cadastro; só o dono consegue gravar, com validações de campos. **Republique `firebase/firestore.rules`**: o cadastro do prestador agora grava `documents: []` e a regra antiga exigia ao menos um documento.

Código: `src/features/auth/` (serviços, contexto, guardas, `VerifyEmailPanel`, páginas `VerifyEmail`/`AuthAction`) e `src/features/auth/utils/` (política de reenvio e leitura dos links, com testes: `npm run test:auth`).

**Configuração obrigatória no Firebase Console**: método *E-mail/senha* habilitado; domínios autorizados (`localhost` e produção); (opcional, recomendado) URL de ação personalizada e idioma pt-BR nos modelos; **republicar** `firebase/firestore.rules` e `firebase/storage.rules`.

## Proteção de rotas (guia rápido)

| Pergunta | Resposta |
|---|---|
| Arquivo que controla a proteção | `src/features/auth/components/RouteGuards.tsx` (`RequireAuth`) |
| Função que verifica se há usuário autenticado | `RequireAuth` → `ProtectedRoute`, com `useAuth()` (`context/AuthProvider.tsx`, Firebase `onIdTokenChanged`) |
| Onde as rotas privadas são declaradas | Caminhos em `src/routes/index.ts`; proteção aplicada por `src/app/cliente/layout.tsx` (`ClientArea`) e `src/app/prestador/layout.tsx` (`ProviderArea`) |
| Onde o token é validado | Navegador: SDK do Firebase. Servidor: API (`FirebaseAuthenticationFilter`) a cada requisição |
| Desativar temporariamente | `.env.local`: `NEXT_PUBLIC_ROUTE_PROTECTION_ENABLED=false` e reiniciar `npm run dev` (só em desenvolvimento; em produção é sempre ativada). Alternativa manual: remover `<RequireAuth>` em `ClientArea`/`ProviderArea` |
| Reativar | Remover a linha ou usar `true`, e reiniciar |

Chave central: `src/features/auth/config/routeProtection.ts`. Padrão: **ativada**. Desligar a proteção de navegação **não** libera endpoints protegidos da API nem as regras do Firestore.

## Integração com a API Spring Boot

O navegador chama `/api/v1/...` na própria origem e o `rewrite` de `next.config.ts` repassa para `API_URL` (padrão `http://localhost:8080`), evitando CORS. Cliente HTTP único: `src/shared/lib/api/http.ts`.

Toda requisição a rota protegida leva `Authorization: Bearer <Firebase ID Token>` (`src/shared/lib/api/http.ts`; em resposta 401 o token é renovado e a chamada repetida uma vez). As rotas públicas da API (catálogos, busca e agenda pública de prestadores) são chamadas sem token, e toda requisição tem limite de 20 s (`API_TIMEOUT_MS`). O usuário é criado na API logo após o cadastro (em segundo plano, como no mobile) e, se a API estava fora do ar, sob demanda (`GET /usuarios/me` → 404 → `POST /usuarios`; 409 só vale se `/usuarios/me` passar a existir; conta desativada ou de outro tipo gera erro). Lógica em `features/auth/utils/apiUserSync.ts`. O e-mail de verificação tenta primeiro com URL de retorno e, se o domínio não estiver autorizado no Firebase, reenvia sem ela (como o mobile).

Endpoints usados: `GET|POST /usuarios(/me)`, `GET /prestadores`, `GET /prestadores/{id}`, `GET /prestadores/{id}/horarios`, `GET /tipos-veiculo`, `GET /especialidades`, `GET|POST|DELETE /veiculos`.

Limitações atuais da API (não simuladas): sem agendamentos, avaliações, serviços com preço/duração, nota média, imagens ou busca textual; **a API valida o ID Token com o Firebase Admin SDK** (precisa de `FIREBASE_PROJECT_ID` e `GOOGLE_APPLICATION_CREDENTIALS`; sem isso responde 503 a toda requisição com token) e **não** bloqueia `email_verified=false`. Agendamentos e avaliações ficam no Firestore (`appointments`, `reviews`; regras em `firebase/firestore.rules`, que precisam ser publicadas) e são acessados só por `features/cliente/services/appointmentService.ts` e `reviewService.ts`.

## Modelo de dados (Firestore)

| Coleção | Documento | Conteúdo |
|---|---|---|
| `users` | `{uid}` | e-mail, `role` (`client`/`provider`/`admin`), `status`, datas (USER, sem hash de senha) |
| `clientProfiles` | `{uid}` | nome, sobrenome, telefone, estado (CLIENT_PROFILE) |
| `providerProfiles` | `{uid}` | dados da oficina, CPF/CNPJ, especialidades e tipos de veículo (arrays de IDs), `documents` (vazio no cadastro web, que não envia arquivos), `approvalStatus` |

Decisões: o UID do Authentication é a chave de identidade; senhas ficam só no Authentication. As relações N:N `PROVIDER_SPECIALTY` e `PROVIDER_VEHICLE_TYPE` viraram arrays no perfil. `SPECIALTY` e `VEHICLE_TYPE` são catálogos em `src/shared/constants/catalog.ts`. `VEHICLE`, `AVAILABILITY_SLOT`, `APPOINTMENT` e `REVIEW` estão tipados em `src/shared/types/domain.ts`, mas ainda sem telas, serviços ou regras.

Estados do prestador: cadastro (conta criada) → análise documental → aprovação (`approvalStatus: approved`). O cadastro cria `status: pending` / `under_review`; **aprovar é manual** e exige alterar o documento no Console (ou Admin SDK). Para criar um administrador, defina manualmente `users/{uid}.role = "admin"` no Console.

## Segurança

- A autorização efetiva está nas **regras** (`firebase/*.rules`): o usuário não consegue definir papel diferente de cliente/prestador, nem alterar papel, status ou aprovação, nem ler dados de outros.
- Os guardas de rota (`RequireAuth`, `GuestOnly`) são só experiência de navegação; não substituem as regras nem a validação do token no backend.
- Limitação atual: não há sessão no servidor (cookie + Firebase Admin SDK), então as páginas privadas são protegidas no cliente; os dados continuam protegidos pelas regras. Aprovação automatizada de prestadores exigiria uma API com Admin SDK.

## Comandos

```bash
npm run dev        # desenvolvimento
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm run test:auth  # testes unitários (política de reenvio, links de ação)
npm run build      # build de produção
```

## Estrutura

```
src/app/                 rotas (uma pasta por URL) e layout
src/features/auth/       login, cadastro de cliente, verificação de e-mail, recuperação/redefinição, contexto e guardas
src/features/cliente/    painel do cliente
src/features/prestador/  cadastro em 4 etapas + verificação do e-mail pelo link do Firebase (esta só com a verificação ativa), validação, serviço de registro, painel
src/features/home/       landing page
src/shared/              componentes, tipos, validadores, utilitários, catálogos
src/shared/lib/firebase/ configuração validada e inicialização única (preguiçosa)
src/routes/              constantes de rotas
firebase/                regras do Firestore e do Storage
```

## Rotas

`/` · `/login` · `/cadastro` · `/cadastro/prestador` · `/recuperar-senha` · `/verificar-email` · `/auth/acao` · `/cliente` e `/cliente/{prestadores, prestadores/resultados, prestadores/perfil, agendar, agendamentos, agendamentos/avaliar, veiculos}` (cliente) · `/prestador` (prestador) · `/termos` · `/privacidade`

A rota dinâmica genérica `/[pagina]` foi removida; `/login` continua igual.

## Pendências

- Textos jurídicos reais de `/termos` e `/privacidade`.
- Botões da landing page "Buscar" e "Ver perfil e agendar" ainda não têm destino.
- Login social (Google/Apple) foi removido por não estar implementado.
- Painel administrativo e aprovação de prestadores.