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
5. **Authentication → Modelos de e-mail**: personalize o e-mail de *Verificação de endereço de e-mail* e o de *Redefinição de senha* (remetente, idioma pt-BR).
6. **Firestore Database**: crie o banco (modo produção) e publique as regras de `firebase/firestore.rules`.
7. **Storage**: ative o Cloud Storage (exige plano Blaze em projetos novos) e publique `firebase/storage.rules`.
8. Publicar regras: cole o conteúdo no console, ou use `npm i -g firebase-tools && firebase login && firebase use <projectId> && firebase deploy --only firestore:rules,storage`.

### Verificação de e-mail

A verificação de e-mail foi removida do frontend: após o cadastro ou o login o usuário vai direto ao painel do seu papel. Login, cadastro, sessão e recuperação de senha seguem iguais.

## Integração com a API Spring Boot

O navegador chama `/api/v1/...` na própria origem e o `rewrite` de `next.config.ts` repassa para `API_URL` (padrão `http://localhost:8080`), evitando CORS. Cliente HTTP único: `src/shared/lib/api/http.ts`.

Endpoints usados: `GET /prestadores`, `GET /prestadores/{id}`, `GET /prestadores/{id}/horarios`, `GET /tipos-veiculo`, `GET /especialidades`, `GET|POST /usuarios(/me)`, `GET|POST|DELETE /veiculos`.

Limitações atuais da API (não simuladas): sem agendamentos, avaliações, serviços com preço/duração, nota média, imagens ou busca textual; autenticação ainda é uma identidade simulada no servidor (todos os logins compartilham o mesmo usuário/veículos da API). Agendamentos e avaliações ficam no Firestore (`appointments`, `reviews`; regras em `firebase/firestore.rules`, que precisam ser publicadas) e são acessados só por `features/cliente/services/appointmentService.ts` e `reviewService.ts`.

## Modelo de dados (Firestore)

| Coleção | Documento | Conteúdo |
|---|---|---|
| `users` | `{uid}` | e-mail, `role` (`client`/`provider`/`admin`), `status`, datas (USER, sem hash de senha) |
| `clientProfiles` | `{uid}` | nome, sobrenome, telefone, estado (CLIENT_PROFILE) |
| `providerProfiles` | `{uid}` | dados da oficina, CPF/CNPJ, especialidades e tipos de veículo (arrays de IDs), documentos, `approvalStatus` |

Decisões: o UID do Authentication é a chave de identidade; senhas ficam só no Authentication. As relações N:N `PROVIDER_SPECIALTY` e `PROVIDER_VEHICLE_TYPE` viraram arrays no perfil. `SPECIALTY` e `VEHICLE_TYPE` são catálogos em `src/shared/constants/catalog.ts`. `VEHICLE`, `AVAILABILITY_SLOT`, `APPOINTMENT` e `REVIEW` estão tipados em `src/shared/types/domain.ts`, mas ainda sem telas, serviços ou regras.

Estados do prestador: cadastro (conta criada) → análise documental → aprovação (`approvalStatus: approved`). O cadastro cria `status: pending` / `under_review`; **aprovar é manual** e exige alterar o documento no Console (ou Admin SDK). Para criar um administrador, defina manualmente `users/{uid}.role = "admin"` no Console.

## Segurança

- A autorização efetiva está nas **regras** (`firebase/*.rules`): o usuário não consegue definir papel diferente de cliente/prestador, nem alterar papel, status ou aprovação, nem ler dados de outros.
- Os guardas de rota (`RequireAuth`, `GuestOnly`) são só experiência de navegação; não substituem as regras.
- Limitação atual: não há sessão no servidor (cookie + Firebase Admin SDK), então as páginas privadas são protegidas no cliente; os dados continuam protegidos pelas regras. Aprovação automatizada de prestadores exigiria uma API com Admin SDK.

## Comandos

```bash
npm run dev        # desenvolvimento
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm run build      # build de produção
```

## Estrutura

```
src/app/                 rotas (uma pasta por URL) e layout
src/features/auth/       login, cadastro de cliente, recuperação, contexto e guardas
src/features/cliente/    painel do cliente
src/features/prestador/  cadastro em 5 etapas, validação, serviço de registro, painel
src/features/home/       landing page
src/shared/              componentes, tipos, validadores, utilitários, catálogos
src/shared/lib/firebase/ configuração validada e inicialização única (preguiçosa)
src/routes/              constantes de rotas
firebase/                regras do Firestore e do Storage
```

## Rotas

`/` · `/login` · `/cadastro` · `/cadastro/prestador` · `/recuperar-senha` · `/cliente` e `/cliente/{prestadores, prestadores/resultados, prestadores/perfil, agendar, agendamentos, agendamentos/avaliar, veiculos}` (cliente) · `/prestador` (prestador) · `/termos` · `/privacidade`

A rota dinâmica genérica `/[pagina]` foi removida; `/login` continua igual.

## Pendências

- Textos jurídicos reais de `/termos` e `/privacidade`.
- Botões da landing page "Buscar" e "Ver perfil e agendar" ainda não têm destino.
- Login social (Google/Apple) foi removido por não estar implementado.
- Painel administrativo e aprovação de prestadores.