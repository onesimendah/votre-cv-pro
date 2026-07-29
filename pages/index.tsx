import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-3xl rounded-[32px] border border-slate-200 bg-white px-10 py-12 shadow-xl">
        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
          Créateur de CV professionnel
        </span>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-900">Votre CV pro</h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">Créez un CV clair, moderne et adapté aux usages de votre pays sans connexion ni base de données.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/create" className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
            Commencer maintenant
          </Link>
          <p className="mt-3 text-sm text-slate-500 sm:mt-0">Modèles France, Bénin, Canada, Belgique, Suisse inclus.</p>
        </div>
      </div>
    </main>
  )
}
