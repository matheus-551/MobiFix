import Link from "next/link";
import { routes } from "../../../routes";

const orange = "#F58235";

const vehicles = [
  { name: "Carro", icon: "🚘", description: "Profissionais qualificados para cuidar do seu carro." },
  { name: "Moto", icon: "🏍️", description: "Especialistas para sua moto e sua rotina." },
  { name: "Caminhão", icon: "🚚", description: "Manutenção para veículos de carga." },
  { name: "Van", icon: "🚐", description: "Cuidado para vans e utilitários." },
  { name: "Ônibus", icon: "🚌", description: "Soluções para veículos de transporte." },
];

const providers = [
  {
    name: "Oficina Mecânica Rodovia Sul",
    category: "MECÂNICA GERAL",
    description: "Especialistas em freios e manutenção preventiva.",
    rating: "4,9",
    reviews: "128 avaliações",
    location: "Recife, PE",
    image:
      "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Moto Express Serviços",
    category: "ESPECIALISTA EM MOTOS",
    description: "Serviços completos para sua moto, com cuidado e agilidade.",
    rating: "4,8",
    reviews: "96 avaliações",
    location: "Recife, PE",
    image:
      "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Truck Diesel Sul",
    category: "DIESEL E PESADOS",
    description: "Diagnóstico e manutenção para veículos pesados.",
    rating: "4,7",
    reviews: "74 avaliações",
    location: "Recife, PE",
    image:
      "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=800&q=80",
  },
];

const testimonials = [
  {
    name: "Carla Duarte",
    initials: "CD",
    text: "Encontrei uma oficina perto de casa com atendimento excelente. Foi rápido e sem complicação.",
  },
  {
    name: "Marcos Costa",
    initials: "MC",
    text: "Gostei da ideia de poder conhecer os profissionais e comparar as opções antes de escolher.",
  },
  {
    name: "Roberto Silva",
    initials: "RS",
    text: "Uma ótima ideia para encontrar profissionais automotivos em um só lugar.",
  },
];

function SectionTitle({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="mb-9 text-center">
      <span className="text-xs font-bold uppercase tracking-[0.2em] text-orange-500">
        {eyebrow}
      </span>
      <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-gray-800 sm:text-3xl">
        {title}
      </h2>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-white font-sans text-gray-800">
      {/* CABEÇALHO */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white">
        <div className="mx-auto flex min-h-[68px] max-w-7xl items-center justify-between gap-5 px-5 lg:px-10">
          <a href="#inicio" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500 text-lg text-white">
              🔧
            </span>
            <span className="text-xl font-extrabold text-orange-500">
              MobiFix
            </span>
          </a>

          <nav className="hidden items-center gap-7 text-sm font-medium text-gray-600 md:flex">
            <a href="#inicio" className="transition hover:text-orange-500">
              Início
            </a>
            <a
              href="#como-funciona"
              className="transition hover:text-orange-500"
            >
              Como funciona
            </a>
            <a
              href="#prestadores"
              className="transition hover:text-orange-500"
            >
              Mais prestadores
            </a>
            <a href="#contato" className="transition hover:text-orange-500">
              Contato
            </a>
          </nav>

          <div className="flex items-center gap-2">

            <Link
              href={routes.login}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
            >
              Login
            </Link>

            <button
              type="button"
              className="rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600"
            >
              Cadastre-se
            </button>
          </div>
        </div>
      </header>

      {/* BANNER PRINCIPAL */}
      <section
        id="inicio"
        className="relative flex min-h-[490px] items-center justify-center bg-cover bg-center px-5 py-20 text-white"
        style={{
          backgroundImage:
            "linear-gradient(rgba(22,25,29,0.83), rgba(22,25,29,0.88)), url('https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=2000&q=85')",
        }}
      >
        <div className="relative mx-auto w-full max-w-4xl text-center">
          <span className="text-xs font-bold uppercase tracking-[0.22em] text-orange-300">
            Cuidado automotivo sem complicação
          </span>

          <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Encontre os melhores profissionais automotivos perto de você
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-gray-300 sm:text-base">
            Seu próximo serviço de confiança está a poucos cliques. Conheça
            profissionais e encontre quem pode cuidar do seu veículo.
          </p>

          {/* BARRA DE BUSCA VISUAL */}
          <div className="mx-auto mt-9 flex max-w-3xl flex-col gap-2 rounded-xl bg-white p-2 shadow-2xl sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-3 px-3">
              <span className="text-lg text-orange-500">📍</span>
              <input
                type="text"
                placeholder="Digite sua região (ex.: Recife, PE)"
                className="w-full min-w-0 py-3 text-sm text-gray-700 outline-none placeholder:text-gray-400"
              />
            </div>

            <div className="flex flex-1 items-center gap-3 border-t border-gray-100 px-3 sm:border-l sm:border-t-0">
              <span className="text-lg text-orange-500">🔧</span>
              <select
                defaultValue=""
                className="w-full min-w-0 bg-white py-3 text-sm text-gray-500 outline-none"
              >
                <option value="" disabled>
                  Qual serviço você precisa?
                </option>
                <option>Revisão</option>
                <option>Troca de óleo</option>
                <option>Freios</option>
                <option>Elétrica</option>
                <option>Diagnóstico</option>
              </select>
            </div>

            <button
              type="button"
              className="flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-7 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
            >
              🔍 Buscar
            </button>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <span className="mr-1 text-xs text-gray-300">
              Buscas populares:
            </span>
            {vehicles.map((vehicle) => (
              <button
                type="button"
                key={vehicle.name}
                className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-orange-100"
              >
                {vehicle.icon} {vehicle.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="px-5 py-20 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            eyebrow="É simples"
            title="Como funciona a MobiFix?"
          />

          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                number: "01",
                title: "Busque o Serviço",
                description:
                  "Selecione o tipo de veículo e encontre profissionais na sua região.",
              },
              {
                number: "02",
                title: "Escolha o Profissional",
                description:
                  "Conheça as especialidades e compare as avaliações dos prestadores.",
              },
              {
                number: "03",
                title: "Agende e Conserte",
                description:
                  "Encontre a opção ideal para cuidar do seu veículo com tranquilidade.",
              },
            ].map((step) => (
              <article
                key={step.number}
                className="rounded-xl border border-gray-100 bg-gray-50 p-7 transition hover:-translate-y-1 hover:shadow-lg"
              >
                <span className="text-4xl font-extrabold text-orange-500">
                  {step.number}
                </span>
                <h3 className="mt-4 text-lg font-bold text-gray-800">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-gray-500">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* TIPOS DE VEÍCULOS */}
      <section className="bg-gray-50 px-5 py-20 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            eyebrow="Especialidades"
            title="Atendimento para todos os tipos de veículos"
          />

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {vehicles.map((vehicle) => (
              <button
                type="button"
                key={vehicle.name}
                className="flex flex-col items-center rounded-xl border border-gray-100 bg-white px-4 py-7 text-center transition hover:border-orange-200 hover:shadow-md"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-50 text-2xl">
                  {vehicle.icon}
                </span>
                <strong className="mt-3 text-sm text-gray-800">
                  {vehicle.name}
                </strong>
                <span className="mt-2 text-xs leading-5 text-gray-500">
                  {vehicle.description}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* PRESTADORES */}
      <section id="prestadores" className="px-5 py-20 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            eyebrow="Destaques"
            title="Prestadores melhor avaliados"
          />

          <div className="grid gap-6 md:grid-cols-3">
            {providers.map((provider) => (
              <article
                key={provider.name}
                className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <img
                  src={provider.image}
                  alt={`Foto ilustrativa de ${provider.name}`}
                  className="h-52 w-full object-cover"
                />

                <div className="p-5">
                  <span className="text-[10px] font-extrabold tracking-wider text-orange-500">
                    {provider.category}
                  </span>

                  <h3 className="mt-2 text-base font-bold text-gray-800">
                    {provider.name}
                  </h3>

                  <p className="mt-2 min-h-10 text-sm leading-5 text-gray-500">
                    {provider.description}
                  </p>

                  <div className="mt-4 flex items-center gap-2 text-sm">
                    <span className="text-orange-500">★</span>
                    <strong>{provider.rating}</strong>
                    <span className="text-gray-400">{provider.reviews}</span>
                  </div>

                  <p className="mt-2 text-xs text-gray-500">
                    📍 {provider.location}
                  </p>

                  <button
                    type="button"
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
                  >
                    Ver perfil e agendar <span>↗</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="bg-gray-50 px-5 py-20 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            eyebrow="Depoimentos"
            title="O que dizem os nossos clientes"
          />

          <div className="grid gap-5 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <article
                key={testimonial.name}
                className="rounded-xl border border-gray-100 bg-white p-6"
              >
                <div className="text-lg tracking-widest text-orange-500">
                  ★★★★★
                </div>

                <p className="mt-4 text-sm leading-6 text-gray-600">
                  “{testimonial.text}”
                </p>

                <div className="mt-6 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700">
                    {testimonial.initials}
                  </span>
                  <div>
                    <strong className="block text-sm text-gray-800">
                      {testimonial.name}
                    </strong>
                    <span className="text-xs text-gray-400">
                      Cliente MobiFix
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* RODAPÉ */}
      <footer id="contato" className="bg-[#202329] px-5 pt-14 text-gray-300 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-10 pb-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <a href="#inicio" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white">
                🔧
              </span>
              <span className="text-xl font-extrabold text-orange-500">
                MobiFix
              </span>
            </a>

            <p className="mt-4 max-w-xs text-sm leading-6 text-gray-400">
              Conectando você a profissionais automotivos de confiança, com
              mais praticidade para cuidar do seu veículo.
            </p>

            <div className="mt-5 flex gap-3">
              {["f", "◎", "in"].map((social) => (
                <a
                  href="#contato"
                  key={social}
                  aria-label={`Rede social ${social}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-600 text-xs font-bold transition hover:border-orange-500 hover:text-orange-500"
                >
                  {social}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold text-white">Para você</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><a href="#como-funciona" className="hover:text-orange-500">Como funciona</a></li>
              <li><a href="#prestadores" className="hover:text-orange-500">Encontrar prestadores</a></li>
              <li><a href="#contato" className="hover:text-orange-500">Perguntas frequentes</a></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold text-white">Para prestadores</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><a href="#contato" className="hover:text-orange-500">Cadastre sua oficina</a></li>
              <li><a href="#contato" className="hover:text-orange-500">Planos</a></li>
              <li><a href="#contato" className="hover:text-orange-500">Suporte</a></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold text-white">Segurança e ajuda</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><a href="#contato" className="hover:text-orange-500">Política de privacidade</a></li>
              <li><a href="#contato" className="hover:text-orange-500">Termos de uso</a></li>
              <li><a href="#contato" className="hover:text-orange-500">Fale conosco</a></li>
            </ul>
          </div>
        </div>

        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 border-t border-gray-700 py-5 text-xs text-gray-500 sm:flex-row">
          <span>© 2026 MobiFix. Todos os direitos reservados.</span>
          <span>Seu veículo em boas mãos.</span>
        </div>
      </footer>
    </main>
  );
}
