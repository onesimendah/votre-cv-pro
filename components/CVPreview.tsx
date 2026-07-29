import { CVDraft } from '../lib/cvTypes'
import { CountryRule } from '../lib/countryRules'
import { PaletteKey, TemplateKey, cvPalettes, cvModels } from '../lib/cvTemplates'

type CVPreviewProps = {
  draft: CVDraft
  countryRule: CountryRule
  template: TemplateKey
  palette: PaletteKey
}

const templateClasses: Record<TemplateKey, string> = {
  classique: 'shadow-sm border border-slate-200 bg-white',
  moderne: 'shadow-2xl border border-slate-200 bg-white',
}

export function CVPreview({ draft, countryRule, template, palette }: CVPreviewProps) {
  const defaultPaletteStyle = cvPalettes.bleu
  const paletteStyle = cvPalettes[palette] ?? defaultPaletteStyle

  const formatDate = (value: string) => (value ? value : 'Actuel')

  const renderSectionHeading = (title: string) => (
    <div className="space-y-2">
      <h3 className={`text-sm font-semibold uppercase tracking-[0.2em] ${paletteStyle.heading}`}>{title}</h3>
      <div className={`h-0.5 w-14 rounded-full ${paletteStyle.accentBg}`} />
    </div>
  )

  const sectionRender = (section: string) => {
    switch (section) {
      case 'Coordonnées':
        return null
      case 'Profil':
        return (
          <section key={section} className="mt-8 space-y-3">
            {renderSectionHeading(section)}
            <div className="prose prose-sm max-w-none text-slate-700">
              <p>{draft.personalProfile || 'Rédigez un profil clair et percutant sur votre expérience et vos objectifs.'}</p>
            </div>
          </section>
        )
      case 'Expériences':
        return (
          <section key={section} className="mt-8 space-y-4">
            {renderSectionHeading('Expériences')}
            <div className="space-y-4">
              {draft.experiences.filter(exp => exp.title || exp.company).map(exp => (
                <div key={exp.id} className="space-y-1">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                    <p className="font-semibold text-slate-900">{exp.title || 'Intitulé de poste'}</p>
                    <span className="text-sm text-slate-500">{formatDate(exp.startDate)} – {exp.endDate || 'Présent'}</span>
                  </div>
                  <p className="text-sm text-slate-700">{exp.company || 'Entreprise'} • {exp.location || 'Lieu'}</p>
                  <p className="text-sm leading-6 text-slate-700">{exp.description || 'Description de la mission, réalisations et résultats.'}</p>
                </div>
              ))}
              {!draft.experiences.some(exp => exp.title || exp.company) && (
                <p className="text-sm text-slate-500">Ajoutez vos expériences pour illustrer votre parcours.</p>
              )}
            </div>
          </section>
        )
      case 'Formation':
        return (
          <section key={section} className="mt-8 space-y-4">
            {renderSectionHeading('Formation')}
            <div className="space-y-4">
              {draft.education.filter(ed => ed.degree || ed.institution).map(ed => (
                <div key={ed.id} className="space-y-1">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                    <p className="font-semibold text-slate-900">{ed.degree || 'Diplôme'}</p>
                    <span className="text-sm text-slate-500">{formatDate(ed.startDate)} – {ed.endDate || 'Présent'}</span>
                  </div>
                  <p className="text-sm text-slate-700">{ed.institution || 'Établissement'} • {ed.location || 'Lieu'}</p>
                </div>
              ))}
              {!draft.education.some(ed => ed.degree || ed.institution) && (
                <p className="text-sm text-slate-500">Ajoutez vos diplômes importants.</p>
              )}
            </div>
          </section>
        )
      case 'Compétences':
        return (
          <section key={section} className="mt-8 space-y-3">
            {renderSectionHeading('Compétences')}
            <div className="flex flex-wrap gap-2">
              {draft.skills.filter(Boolean).map((skill, index) => (
                <span key={`${skill}-${index}`} className={`rounded-full border border-transparent px-3 py-1 text-sm ${paletteStyle.accent}`}>
                  {skill}
                </span>
              ))}
              {!draft.skills.some(Boolean) && <p className="text-sm text-slate-500">Ajoutez vos compétences clés.</p>}
            </div>
          </section>
        )
      case 'Langues':
        return (
          <section key={section} className="mt-8 space-y-3">
            {renderSectionHeading('Langues')}
            <div className="space-y-2 text-sm text-slate-700">
              {draft.languages.filter(lang => lang.language).map(lang => (
                <div key={lang.id} className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${paletteStyle.accentBg}`} />
                  <p>{lang.language} — {lang.level || 'Niveau'}</p>
                </div>
              ))}
              {!draft.languages.some(lang => lang.language) && <p className="text-slate-500">Listez vos langues parlées.</p>}
            </div>
          </section>
        )
      case 'Centres d\'intérêt':
        return (
          <section key={section} className="mt-8 space-y-3">
            {renderSectionHeading('Centres d\'intérêt')}
            <p className="text-sm leading-6 text-slate-700">{draft.interests || 'Listez quelques centres d\'intérêt pour apporter une touche personnelle.'}</p>
          </section>
        )
      case 'Références':
        return (
          <section key={section} className="mt-8 space-y-3">
            {renderSectionHeading('Références')}
            <p className="text-sm leading-6 text-slate-700">Références disponibles sur demande.</p>
          </section>
        )
      default:
        return null
    }
  }

  const currentModel = cvModels.find(model => model.key === template)

  return (
    <article className={`${templateClasses[template]} overflow-hidden rounded-3xl ${paletteStyle.panel}`}>
      <div className={`grid gap-6 lg:grid-cols-[1.3fr_0.7fr] ${paletteStyle.panel}`}>
        <div className={`rounded-t-3xl rounded-bl-3xl ${paletteStyle.accentBg} p-6 text-white`}>          
          <p className="text-xs uppercase tracking-[0.3em] text-white/75">{countryRule.name}</p>
          <h1 className="mt-3 text-3xl font-semibold">{draft.identity.firstName || 'Prénom'} {draft.identity.lastName || 'Nom'}</h1>
          <p className="mt-3 text-sm text-white/90">{draft.targetJob || 'Poste visé'}</p>
          <div className="mt-6 space-y-3 text-sm text-white/85">
            <p>{draft.contact.email || 'email@exemple.com'}</p>
            <p>{draft.contact.phone || '+33 6 00 00 00 00'}</p>
            <p>{draft.contact.location || 'Ville, Pays'}</p>
            {draft.contact.linkedin && <p>LinkedIn : {draft.contact.linkedin}</p>}
            {draft.contact.portfolio && <p>Portfolio : {draft.contact.portfolio}</p>}
          </div>
          {countryRule.showPhoto && draft.identity.photoDataUrl ? (
            <img src={draft.identity.photoDataUrl} alt="Photo de profil" className="mt-6 h-28 w-28 rounded-full border-4 border-white object-cover shadow-xl" />
          ) : null}
        </div>
        <div className="space-y-6 rounded-br-3xl rounded-tr-3xl bg-white p-6 text-slate-900">
          <div className="flex items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-slate-100 px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Modèle</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{currentModel?.name}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${paletteStyle.accent}`}>{paletteStyle.label}</span>
          </div>
          {countryRule.sections.map(section => sectionRender(section))}
          {countryRule.signatureRequise && (
            <div className="mt-10 border-t border-slate-200 pt-6">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div className="text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">Fait à {draft.signatureLocation || draft.contact.location || 'Ville'}, le {draft.signatureDate ? new Date(draft.signatureDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Date'}</p>
                </div>
                {draft.signatureDataUrl ? (
                  <div className="flex flex-col items-end">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Signature</p>
                    <img src={draft.signatureDataUrl} alt="Signature manuscrite" className="h-16 w-auto max-w-[220px] object-contain" />
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
