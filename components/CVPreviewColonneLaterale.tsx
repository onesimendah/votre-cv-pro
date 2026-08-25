import { CVDraft } from '../lib/cvTypes'
import { CountryRule } from '../lib/countryRules'
import { PaletteKey, cvPalettes } from '../lib/cvTemplates'

type CVPreviewColonneLateraleProps = {
  draft: CVDraft
  countryRule: CountryRule
  palette: PaletteKey
}

const SIDEBAR_SECTIONS = ['Compétences', 'Langues', 'Centres d\'intérêt']

export function CVPreviewColonneLaterale({ draft, countryRule, palette }: CVPreviewColonneLateraleProps) {
  const paletteStyle = cvPalettes[palette] ?? cvPalettes.bleu

  const formatDate = (value: string) => (value ? value : 'Actuel')

  const descriptionLines = (description: string) => {
    const lines = description.split('\n').map(line => line.trim()).filter(Boolean)
    return lines.length ? lines : ['Description de la mission, réalisations et résultats.']
  }

  const parseSkillList = (value: string) => value.split(',').map(item => item.trim()).filter(Boolean)

  const hasSkillCategories = draft.skillCategories.some(cat => cat.name || cat.skills)

  const renderMainHeading = (title: string) => (
    <div className="space-y-2">
      <h3 className={`text-sm font-semibold uppercase tracking-[0.2em] ${paletteStyle.heading}`}>{title}</h3>
      <div className={`h-0.5 w-14 rounded-full ${paletteStyle.accentBg}`} />
    </div>
  )

  const renderSidebarHeading = (title: string) => (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-white">{title}</h3>
      <div className="h-0.5 w-10 rounded-full bg-white/40" />
    </div>
  )

  const sidebarTextClass = 'min-w-0 break-all whitespace-normal leading-[1.45] text-[10px] sm:text-[10.5px]'

  const mainSectionRender = (section: string) => {
    switch (section) {
      case 'Profil':
        return (
          <section key={section} className="mt-8 space-y-3">
            {renderMainHeading('Profil')}
            <div className="prose prose-sm max-w-none text-slate-700">
              <p>{draft.personalProfile || 'Rédigez un profil clair et percutant sur votre expérience et vos objectifs.'}</p>
            </div>
          </section>
        )
      case 'Expériences':
        return (
          <section key={section} className="mt-8 space-y-4">
            {renderMainHeading('Expérience')}
            <div className="space-y-5">
              {draft.experiences.filter(exp => exp.title || exp.company).map(exp => (
                <div key={exp.id} className="space-y-1.5">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                    <p className="font-semibold text-slate-900">{exp.title || 'Intitulé de poste'}</p>
                    <span className="text-sm text-slate-500">{formatDate(exp.startDate)} – {exp.endDate || 'Présent'}</span>
                  </div>
                  <p className="text-sm text-slate-700">{exp.company || 'Entreprise'} • {exp.location || 'Lieu'}</p>
                  <div className="space-y-1">
                    {descriptionLines(exp.description).map((line, index) => (
                      <p key={index} className="flex gap-2 text-sm leading-6 text-slate-700">
                        <span className={`font-semibold ${paletteStyle.heading}`}>›</span>
                        <span>{line}</span>
                      </p>
                    ))}
                  </div>
                  {exp.technologies.trim() && (
                    <p className="text-xs italic text-slate-500">{exp.technologies}</p>
                  )}
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
            {renderMainHeading('Formation')}
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
      case 'Références':
        return (
          <section key={section} className="mt-8 space-y-3">
            {renderMainHeading('Références')}
            <p className="text-sm leading-6 text-slate-700">Références disponibles sur demande.</p>
          </section>
        )
      default:
        return null
    }
  }

  const mainSections = countryRule.sections.filter(section => !SIDEBAR_SECTIONS.includes(section) && section !== 'Coordonnées')

  const tagline = draft.personalProfile
    ? draft.personalProfile.split(/(?<=[.!?])\s+/)[0]
    : 'Ajoutez une ligne d\'accroche percutante pour résumer votre profil.'

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-[0.85fr_2fr]">
        <div className={`${paletteStyle.accentBg} flex min-w-0 flex-col gap-8 p-6 text-white`}>
          {countryRule.showPhoto && draft.identity.photoDataUrl ? (
            <img
              src={draft.identity.photoDataUrl}
              alt="Photo de profil"
              className="mx-auto h-28 w-28 rounded-full border-4 border-white object-cover shadow-xl"
            />
          ) : null}

          <div className="space-y-3">
            {renderSidebarHeading('Contact')}
            <div className="min-w-0 space-y-2 text-white/90">
              <p className={sidebarTextClass}>{draft.contact.email || 'email@exemple.com'}</p>
              <p className={sidebarTextClass}>{draft.contact.phone || '+33 6 00 00 00 00'}</p>
              <p className={sidebarTextClass}>{draft.contact.location || 'Ville, Pays'}</p>
              {draft.contact.linkedin && <p className={sidebarTextClass}>LinkedIn : {draft.contact.linkedin}</p>}
              {draft.contact.portfolio && <p className={sidebarTextClass}>Portfolio : {draft.contact.portfolio}</p>}
            </div>
          </div>

          {countryRule.sections.includes('Compétences') && (
            <div className="space-y-3">
              {renderSidebarHeading('Compétences')}
              {hasSkillCategories ? (
                <div className="space-y-3">
                  {draft.skillCategories.filter(cat => cat.name || cat.skills).map(cat => (
                    <div key={cat.id} className="space-y-1.5">
                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/95">{cat.name || 'Catégorie'}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {parseSkillList(cat.skills).map((skill, index) => (
                          <span key={`${skill}-${index}`} className="rounded bg-white/15 px-2 py-0.5 text-xs text-white">{skill}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {draft.skills.filter(Boolean).map((skill, index) => (
                    <span key={`${skill}-${index}`} className="rounded bg-white/15 px-2 py-0.5 text-xs text-white">{skill}</span>
                  ))}
                  {!draft.skills.some(Boolean) && <p className="text-sm text-white/70">Ajoutez vos compétences clés.</p>}
                </div>
              )}
            </div>
          )}

          {countryRule.sections.includes('Langues') && (
            <div className="space-y-3">
              {renderSidebarHeading('Langues')}
              <div className="space-y-2 text-sm text-white/90">
                {draft.languages.filter(lang => lang.language).map(lang => (
                  <div key={lang.id} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
                    <p>{lang.language} — {lang.level || 'Niveau'}</p>
                  </div>
                ))}
                {!draft.languages.some(lang => lang.language) && <p className="text-white/70">Listez vos langues parlées.</p>}
              </div>
            </div>
          )}

          {countryRule.sections.includes('Centres d\'intérêt') && (
            <div className="space-y-3">
              {renderSidebarHeading('Centres d\'intérêt')}
              <p className="text-sm leading-6 text-white/90">{draft.interests || 'Listez quelques centres d\'intérêt pour apporter une touche personnelle.'}</p>
            </div>
          )}
        </div>

        <div className="space-y-2 bg-white p-6 text-slate-900">
          <p className="font-bold text-3xl text-slate-900">{draft.identity.firstName || 'Prénom'} {draft.identity.lastName || 'Nom'}</p>
          <p className={`text-xl font-semibold ${paletteStyle.heading}`}>{draft.targetJob || 'Poste visé'}</p>
          <p className="text-sm italic text-slate-500">{tagline}</p>

          {mainSections.map(section => mainSectionRender(section))}

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
