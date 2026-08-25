import Link from 'next/link'
import { Reveal } from '../components/Reveal'
import { cvModels, cvPalettes } from '../lib/cvTemplates'

const countries = [
  { flag: '🇫🇷', name: 'France' },
  { flag: '🇧🇯', name: 'Bénin' },
  { flag: '🇨🇦', name: 'Canada' },
  { flag: '🇧🇪', name: 'Belgique' },
  { flag: '🇨🇭', name: 'Suisse' },
]

const stats = [
  { value: '5', label: 'Pays couverts' },
  { value: cvModels.length.toString(), label: 'Modèles de CV' },
  { value: '5', label: 'Palettes de couleurs' },
  { value: '100%', label: 'Gratuit' },
]

const features = [
  {
    title: 'Adapté à votre pays',
    description: 'Photo, signature, sections et mentions ajustées automatiquement selon les usages locaux.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6"><path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.6" /></svg>
    ),
  },
  {
    title: 'Plusieurs modèles',
    description: 'Classique, Moderne, Colonne latérale... choisissez la structure qui vous ressemble.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6"><rect x="3" y="3" width="7" height="18" rx="1.5" stroke="currentColor" strokeWidth="1.6" /><rect x="13" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.6" /><rect x="13" y="14" width="8" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" /></svg>
    ),
  },
  {
    title: 'Palettes soignées',
    description: '5 palettes de couleurs pensées pour rester élégantes à l’écran comme à l’impression.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" /><circle cx="12" cy="8" r="1.4" fill="currentColor" /><circle cx="15.5" cy="12.5" r="1.4" fill="currentColor" /><circle cx="8.5" cy="12.5" r="1.4" fill="currentColor" /><circle cx="12" cy="16" r="1.4" fill="currentColor" /></svg>
    ),
  },
  {
    title: 'Export PDF instantané',
    description: 'Téléchargez votre CV en un clic, prêt à être envoyé, sans watermark.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6"><path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><path d="M14 3v5h5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><path d="M9 16.5v-4l3 4 3-4v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
    ),
  },
  {
    title: 'Signature manuscrite',
    description: 'Dessinez votre signature directement à l’écran pour les pays qui l’exigent.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6"><path d="M3 17.5c2-3.5 3.5-5 5-5s1.5 3 3 3 2-5 4-5 2 4.5 4 4.5 1.5-2 2-2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /><path d="M4 21h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
    ),
  },
  {
    title: 'Optimisation IA',
    description: 'Collez une offre d’emploi et laissez l’agent reformuler votre accroche et vos expériences.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6"><path d="M12 3v3M12 18v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M3 12h3M18 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" /></svg>
    ),
  },
]

const steps = [
  { number: '1', title: 'Choisissez votre pays', description: 'Sélectionnez votre pays pour appliquer automatiquement les bons codes de CV.' },
  { number: '2', title: 'Renseignez vos infos', description: 'Ajoutez votre parcours, vos compétences et personnalisez modèle et couleurs.' },
  { number: '3', title: 'Téléchargez en PDF', description: 'Prévisualisez en direct puis exportez votre CV prêt à être envoyé.' },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight text-slate-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white">CV</span>
            Votre CV pro
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#fonctionnalites" className="transition hover:text-slate-900">Fonctionnalités</a>
            <a href="#modeles" className="transition hover:text-slate-900">Modèles</a>
            <a href="#comment-ca-marche" className="transition hover:text-slate-900">Comment ça marche</a>
          </nav>
          <Link
            href="/create"
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-700 hover:shadow-lg hover:shadow-slate-900/20"
          >
            Créer mon CV
          </Link>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 animate-blob rounded-full bg-amber-300/30 blur-3xl" />
          <div className="pointer-events-none absolute -right-16 top-32 h-80 w-80 animate-blob rounded-full bg-indigo-300/30 blur-3xl" style={{ animationDelay: '3s' }} />

          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
            <div className="animate-fade-in-up">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 shadow-sm">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                Créateur de CV professionnel
              </span>
              <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                Créez un CV qui{' '}
                <span className="bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 bg-clip-text text-transparent animate-shimmer">
                  décroche des entretiens
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
                Un CV clair, moderne et adapté aux usages de votre pays — sans connexion, sans base de données, entièrement dans votre navigateur.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/create"
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-7 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-700 hover:shadow-xl hover:shadow-slate-900/25"
                >
                  Commencer maintenant
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 transition-transform group-hover:translate-x-1"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </Link>
                <Link
                  href={{ pathname: '/create', query: { mode: 'chat' } }}
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-7 py-3.5 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-900 hover:shadow-md"
                >
                  Créer mon CV en discutant
                </Link>
                <a
                  href="#modeles"
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-7 py-3.5 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-900 hover:shadow-md"
                >
                  Voir les modèles
                </a>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <p className="text-sm text-slate-500">Modèles pensés pour :</p>
                {countries.map(country => (
                  <span key={country.name} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    <span>{country.flag}</span>{country.name}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative mx-auto hidden w-full max-w-sm lg:block">
              <div className="animate-float overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl" style={{ ['--float-rotate' as string]: '-3deg' }}>
                <div className="flex">
                  <div className="w-1/3 space-y-3 bg-slate-900 p-4">
                    <div className="mx-auto h-14 w-14 rounded-full bg-white/20" />
                    <div className="h-1.5 w-full rounded-full bg-white/25" />
                    <div className="h-1.5 w-2/3 rounded-full bg-white/20" />
                    <div className="mt-4 h-1 w-3/4 rounded-full bg-amber-400/70" />
                    <div className="h-1 w-1/2 rounded-full bg-white/20" />
                    <div className="h-1 w-2/3 rounded-full bg-white/20" />
                  </div>
                  <div className="w-2/3 space-y-3 p-5">
                    <div className="h-2.5 w-3/4 rounded-full bg-slate-800" />
                    <div className="h-1.5 w-1/2 rounded-full bg-amber-400" />
                    <div className="mt-4 space-y-1.5">
                      <div className="h-1.5 w-full rounded-full bg-slate-200" />
                      <div className="h-1.5 w-11/12 rounded-full bg-slate-200" />
                      <div className="h-1.5 w-4/5 rounded-full bg-slate-200" />
                    </div>
                    <div className="mt-4 space-y-1.5">
                      <div className="h-1.5 w-full rounded-full bg-slate-200" />
                      <div className="h-1.5 w-2/3 rounded-full bg-slate-200" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -left-6 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl animate-float" style={{ animationDelay: '1.5s', ['--float-rotate' as string]: '1deg' }}>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">⚡</span>
                <div>
                  <p className="text-xs font-semibold text-slate-900">PDF prêt en 2 min</p>
                  <p className="text-[11px] text-slate-500">Sans inscription</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <Reveal key={stat.label} delayMs={index * 80} className="text-center">
                <p className="text-3xl font-bold text-slate-900 sm:text-4xl">{stat.value}</p>
                <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="fonctionnalites" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600">Fonctionnalités</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Tout ce qu’il faut pour un CV impeccable</h2>
            <p className="mt-4 text-lg text-slate-600">Des outils pensés pour vous faire gagner du temps, sans jamais sacrifier le professionnalisme.</p>
          </Reveal>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Reveal key={feature.title} delayMs={(index % 3) * 100}>
                <div className="group h-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1.5 hover:border-slate-300 hover:shadow-xl">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white transition group-hover:scale-110 group-hover:bg-amber-500">
                    {feature.icon}
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-slate-900">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="comment-ca-marche" className="bg-white">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
            <Reveal className="mx-auto max-w-2xl text-center">
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600">Comment ça marche</span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Votre CV en 3 étapes simples</h2>
            </Reveal>
            <div className="relative mt-14 grid gap-10 sm:grid-cols-3">
              <div className="pointer-events-none absolute left-0 right-0 top-7 hidden h-px bg-slate-200 sm:block" />
              {steps.map((step, index) => (
                <Reveal key={step.number} delayMs={index * 120} className="relative text-center">
                  <div className="relative z-10 mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-lg font-bold text-white shadow-lg shadow-slate-900/20 transition hover:scale-110">
                    {step.number}
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-slate-900">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="modeles" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600">Modèles</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Un style pour chaque profil</h2>
            <p className="mt-4 text-lg text-slate-600">Changez de modèle et de palette à tout moment, en direct, avant de télécharger.</p>
          </Reveal>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cvModels.map((model, index) => (
              <Reveal key={model.key} delayMs={index * 100}>
                <Link
                  href="/create"
                  className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1.5 hover:border-slate-300 hover:shadow-xl"
                >
                  <div className="flex h-32 items-stretch gap-2 bg-slate-100 p-4">
                    <div className="w-1/3 rounded-xl bg-slate-900/90" />
                    <div className="flex-1 space-y-2 rounded-xl bg-white p-3">
                      <div className="h-1.5 w-3/4 rounded-full bg-slate-300" />
                      <div className="h-1.5 w-1/2 rounded-full bg-slate-200" />
                      <div className="h-1.5 w-full rounded-full bg-slate-200" />
                      <div className="h-1.5 w-2/3 rounded-full bg-slate-200" />
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="text-lg font-semibold text-slate-900">{model.name}</h3>
                    <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{model.description}</p>
                    <div className="mt-4 flex items-center gap-1.5">
                      {Object.values(cvPalettes).map(palette => (
                        <span key={palette.label} className={`h-3 w-3 rounded-full ${palette.accentBg}`} />
                      ))}
                    </div>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-slate-900">
                      Essayer ce modèle
                      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 transition-transform group-hover:translate-x-1"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="px-4 pb-20 sm:px-6">
          <Reveal className="mx-auto max-w-7xl">
            <div className="relative overflow-hidden rounded-[40px] bg-slate-900 px-8 py-16 text-center shadow-2xl sm:px-16">
              <div className="pointer-events-none absolute -left-10 -top-10 h-56 w-56 animate-blob rounded-full bg-amber-500/20 blur-3xl" />
              <div className="pointer-events-none absolute -right-10 bottom-0 h-56 w-56 animate-blob rounded-full bg-indigo-500/20 blur-3xl" style={{ animationDelay: '4s' }} />
              <div className="relative">
                <h2 className="text-3xl font-bold text-white sm:text-4xl">Prêt à créer votre CV ?</h2>
                <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">Rejoignez les candidats qui décrochent plus d’entretiens grâce à un CV clair et adapté à leur pays.</p>
                <Link
                  href="/create"
                  className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  Créer mon CV gratuitement
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </Link>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} Votre CV pro. Tous droits réservés.</p>
          <p>Aucune donnée n’est envoyée à un serveur — tout reste dans votre navigateur.</p>
        </div>
      </footer>
    </div>
  )
}
