import { useEffect, useRef, useState } from 'react'
import { countryRules, CountryKey } from '../lib/countryRules'
import { CVPreview } from '../components/CVPreview'
import { CVDraft, CVEducation, CVExperience, CVLanguage, emptyDraft } from '../lib/cvTypes'
import { cvModels, cvPalettes, PaletteKey, TemplateKey } from '../lib/cvTemplates'
import { exportPdfDocument } from '../lib/pdfExport'

const steps = ['Modèle de CV', 'Métier', 'Informations', 'Modèle & Prévisualisation']

const normalizePalette = (rawPalette: string | undefined): PaletteKey => {
  if (rawPalette === 'vert') return 'emeraude'
  if (rawPalette === 'contrast') return 'bordeaux'
  if (rawPalette === 'emeraude' || rawPalette === 'bordeaux' || rawPalette === 'bleu' || rawPalette === 'indigo' || rawPalette === 'sable') return rawPalette
  return 'bleu'
}

const buildDraft = (raw: any): CVDraft => {
  if (!raw || typeof raw !== 'object') return emptyDraft
  return {
    ...emptyDraft,
    ...raw,
    palette: normalizePalette(raw.palette),
    identity: {
      ...emptyDraft.identity,
      ...(raw.identity || {}),
    },
    contact: {
      ...emptyDraft.contact,
      ...(raw.contact || {}),
    },
    experiences: Array.isArray(raw.experiences) ? raw.experiences : emptyDraft.experiences,
    education: Array.isArray(raw.education) ? raw.education : emptyDraft.education,
    skills: Array.isArray(raw.skills) ? raw.skills : emptyDraft.skills,
    languages: Array.isArray(raw.languages) ? raw.languages : emptyDraft.languages,
  }
}

const createId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`

export default function Create() {
  const [step, setStep] = useState(1)
  const [draft, setDraft] = useState<CVDraft>(emptyDraft)
  const [jobOfferText, setJobOfferText] = useState('')
  const [optimizeError, setOptimizeError] = useState('')
  const [optimizePreview, setOptimizePreview] = useState<{ accrocheOptimisee: string; experiencesOptimisees: Array<Partial<CVExperience>> } | null>(null)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const isDrawingRef = useRef(false)
  const latestPointRef = useRef<{ x: number; y: number } | null>(null)
  const countryRule = countryRules[draft.country as CountryKey] ?? countryRules.France

  useEffect(() => {
    const raw = localStorage.getItem('vcp_draft')
    if (raw) {
      try {
        const saved = JSON.parse(raw)
        if (saved && saved.country && countryRules[saved.country as CountryKey]) {
          setDraft(buildDraft(saved))
          return
        }
      } catch {
        // ignore invalid draft
      }
    }
    setDraft(emptyDraft)
  }, [])

  useEffect(() => {
    localStorage.setItem('vcp_draft', JSON.stringify(draft))
  }, [draft])

  useEffect(() => {
    if (!countryRule?.signatureRequise) return
    if (!draft.signatureLocation && draft.contact.location) {
      setDraft(prev => ({ ...prev, signatureLocation: prev.signatureLocation || prev.contact.location }))
    }
    if (!draft.signatureDate) {
      const today = new Date().toISOString().split('T')[0]
      setDraft(prev => ({ ...prev, signatureDate: prev.signatureDate || today }))
    }
  }, [countryRule.signatureRequise, draft.contact.location, draft.signatureLocation, draft.signatureDate])

  useEffect(() => {
    if (!canvasRef.current || !draft.signatureDataUrl) return
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    if (!context) return
    const image = new Image()
    image.onload = () => {
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
    }
    image.src = draft.signatureDataUrl
  }, [draft.signatureDataUrl])

  const modelOptions = cvModels
  const paletteOptions = Object.keys(cvPalettes) as PaletteKey[]
  const activePalette: PaletteKey = cvPalettes[draft.palette] ? draft.palette : 'bleu'

  const handleOptimizeCv = async () => {
    if (!jobOfferText.trim()) {
      setOptimizeError('Veuillez saisir une offre d’emploi pour optimiser votre CV.')
      return
    }

    setIsOptimizing(true)
    setOptimizeError('')
    setOptimizePreview(null)

    try {
      const response = await fetch('/api/optimize-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accroche: draft.personalProfile || draft.targetJob || '',
          experiences: draft.experiences.map(exp => ({
            title: exp.title,
            company: exp.company,
            location: exp.location,
            startDate: exp.startDate,
            endDate: exp.endDate,
            description: exp.description,
          })),
          jobOffer: jobOfferText.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setOptimizeError(data?.error || 'Une erreur inconnue est survenue pendant l’optimisation.')
        return
      }

      if (!data?.accrocheOptimisee || !Array.isArray(data?.experiencesOptimisees)) {
        setOptimizeError('La réponse de l’agent est invalide.')
        return
      }

      setOptimizePreview({
        accrocheOptimisee: data.accrocheOptimisee,
        experiencesOptimisees: data.experiencesOptimisees,
      })
    } catch (error) {
      setOptimizeError(error instanceof Error ? error.message : 'Impossible de contacter l’agent d’optimisation.')
    } finally {
      setIsOptimizing(false)
    }
  }

  const acceptOptimization = () => {
    if (!optimizePreview) return

    const optimizedExperiences = optimizePreview.experiencesOptimisees.map((exp, index) => ({
      id: draft.experiences[index]?.id ?? createId('exp'),
      title: exp.title || '',
      company: exp.company || '',
      location: exp.location || '',
      startDate: exp.startDate || '',
      endDate: exp.endDate || '',
      description: exp.description || '',
    }))

    setDraft(prev => ({
      ...prev,
      personalProfile: optimizePreview.accrocheOptimisee,
      experiences: optimizedExperiences,
    }))
    setOptimizePreview(null)
    setJobOfferText('')
    setOptimizeError('')
  }

  const refuseOptimization = () => {
    setOptimizePreview(null)
    setOptimizeError('')
  }

  const changeDraft = (patch: Partial<CVDraft>) => setDraft(prev => ({ ...prev, ...patch }))

  const updateExperience = (id: string, patch: Partial<CVExperience>) => {
    setDraft(prev => ({
      ...prev,
      experiences: prev.experiences.map(exp => exp.id === id ? { ...exp, ...patch } : exp),
    }))
  }

  const removeExperience = (id: string) => {
    setDraft(prev => ({
      ...prev,
      experiences: prev.experiences.filter(exp => exp.id !== id),
    }))
  }

  const addExperience = () => {
    setDraft(prev => ({
      ...prev,
      experiences: [...prev.experiences, {
        id: createId('exp'),
        title: '',
        company: '',
        location: '',
        startDate: '',
        endDate: '',
        description: '',
      }],
    }))
  }

  const updateEducation = (id: string, patch: Partial<CVEducation>) => {
    setDraft(prev => ({
      ...prev,
      education: prev.education.map(ed => ed.id === id ? { ...ed, ...patch } : ed),
    }))
  }

  const removeEducation = (id: string) => {
    setDraft(prev => ({
      ...prev,
      education: prev.education.filter(ed => ed.id !== id),
    }))
  }

  const addEducation = () => {
    setDraft(prev => ({
      ...prev,
      education: [...prev.education, {
        id: createId('edu'),
        degree: '',
        institution: '',
        location: '',
        startDate: '',
        endDate: '',
      }],
    }))
  }

  const updateLanguage = (id: string, patch: Partial<CVLanguage>) => {
    setDraft(prev => ({
      ...prev,
      languages: prev.languages.map(lang => lang.id === id ? { ...lang, ...patch } : lang),
    }))
  }

  const removeLanguage = (id: string) => {
    setDraft(prev => ({
      ...prev,
      languages: prev.languages.filter(lang => lang.id !== id),
    }))
  }

  const addLanguage = () => {
    setDraft(prev => ({
      ...prev,
      languages: [...prev.languages, { id: createId('lang'), language: '', level: '' }],
    }))
  }

  const currentStep = steps[step - 1]

  const getPointFromEvent = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    }
  }

  const startDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const point = getPointFromEvent(event)
    if (!point) return
    const context = canvasRef.current?.getContext('2d')
    if (!context) return
    context.beginPath()
    context.moveTo(point.x, point.y)
    latestPointRef.current = point
    isDrawingRef.current = true
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return
    const point = getPointFromEvent(event)
    const context = canvasRef.current?.getContext('2d')
    if (!point || !context) return
    context.lineWidth = 2.2
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.strokeStyle = '#111827'
    context.beginPath()
    context.moveTo(latestPointRef.current?.x ?? point.x, latestPointRef.current?.y ?? point.y)
    context.lineTo(point.x, point.y)
    context.stroke()
    latestPointRef.current = point
  }

  const stopDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return
    isDrawingRef.current = false
    latestPointRef.current = null
    const canvas = canvasRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL('image/png')
    setDraft(prev => ({ ...prev, signatureDataUrl: dataUrl }))
    event.currentTarget.releasePointerCapture(event.pointerId)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return
    context.clearRect(0, 0, canvas.width, canvas.height)
    setDraft(prev => ({ ...prev, signatureDataUrl: undefined }))
  }

  const sanitizeFileName = (value: string) =>
    value
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')

  const handleDownloadPdf = async () => {
    const firstName = draft.identity.firstName || 'Prenom'
    const lastName = draft.identity.lastName || 'Nom'
    const fileName = `CV_${sanitizeFileName(firstName)}_${sanitizeFileName(lastName)}_${sanitizeFileName(draft.country)}.pdf`
    const { createPdfDocument } = await import('../lib/pdfDocument')
    const document = createPdfDocument(draft, countryRule, activePalette)
    await exportPdfDocument(document, fileName)
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Créer mon CV</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">Votre CV pro</h1>
          <p className="mt-2 text-slate-600">Complétez vos informations, choisissez un style et visualisez votre CV en temps réel.</p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Étape {step}</h2>
                  <p className="text-sm text-slate-500">{currentStep}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-sm text-slate-600">
                  {steps.map((label, index) => (
                    <span
                      key={label}
                      className={`rounded-full px-3 py-1 ${index + 1 === step ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
                    >
                      {index + 1}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 space-y-6">
                {step === 1 && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Modèle de CV</label>
                      <select
                        value={draft.country}
                        onChange={e => changeDraft({ country: e.target.value as CountryKey })}
                        className="mt-2 block w-full rounded border border-slate-300 bg-white px-3 py-2"
                      >
                        {Object.values(countryRules).map(rule => (
                          <option key={rule.countryKey} value={rule.countryKey}>{rule.name}</option>
                        ))}
                      </select>
                      <p className="mt-3 text-sm text-slate-500">Choisissez le modèle qui correspond aux usages de votre pays (ex. si votre pays suit les codes français, choisissez le modèle France).</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                      <p className="font-semibold text-slate-900">Résumé du modèle</p>
                      <p className="mt-2 text-slate-500">{countryRule.recommendedPages}.</p>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Prénom</label>
                        <input
                          value={draft.identity.firstName}
                          onChange={e => setDraft(prev => ({ ...prev, identity: { ...prev.identity, firstName: e.target.value } }))}
                          className="mt-2 block w-full rounded border border-slate-300 bg-white px-3 py-2"
                          placeholder="Prénom"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Nom</label>
                        <input
                          value={draft.identity.lastName}
                          onChange={e => setDraft(prev => ({ ...prev, identity: { ...prev.identity, lastName: e.target.value } }))}
                          className="mt-2 block w-full rounded border border-slate-300 bg-white px-3 py-2"
                          placeholder="Nom"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700">Poste / métier visé</label>
                      <input
                        value={draft.targetJob}
                        onChange={e => changeDraft({ targetJob: e.target.value })}
                        className="mt-2 block w-full rounded border border-slate-300 bg-white px-3 py-2"
                        placeholder="Ex. Chef de projet digital"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700">Profil professionnel</label>
                      <textarea
                        value={draft.personalProfile}
                        onChange={e => changeDraft({ personalProfile: e.target.value })}
                        rows={5}
                        className="mt-2 block w-full rounded border border-slate-300 bg-white px-3 py-2"
                        placeholder="Je suis un professionnel spécialisé en..."
                      />
                    </div>

                    {countryRule.showPhoto && !countryRule.hiddenFields?.photo && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Photo</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={e => {
                            const file = e.target.files?.[0]
                            if (file) {
                              const reader = new FileReader()
                              reader.onload = () => {
                                const result = reader.result
                                if (typeof result === 'string') {
                                  setDraft(prev => ({ ...prev, identity: { ...prev.identity, photoDataUrl: result || undefined } }))
                                }
                              }
                              reader.readAsDataURL(file)
                            }
                          }}
                          className="mt-2 block w-full text-sm text-slate-700"
                        />
                        {draft.identity.photoDataUrl ? (
                          <img src={draft.identity.photoDataUrl} alt="Aperçu" className="mt-3 h-24 w-24 rounded-full object-cover border border-slate-200" />
                        ) : null}
                      </div>
                    )}

                    {countryRule.hiddenFields?.photo && (
                      <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
                        Au {countryRule.name}, la photo n'est pas recommandée.
                      </div>
                    )}
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Email</label>
                        <input
                          type="email"
                          value={draft.contact.email}
                          onChange={e => setDraft(prev => ({ ...prev, contact: { ...prev.contact, email: e.target.value } }))}
                          className="mt-2 block w-full rounded border border-slate-300 bg-white px-3 py-2"
                          placeholder="email@exemple.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Téléphone</label>
                        <input
                          value={draft.contact.phone}
                          onChange={e => setDraft(prev => ({ ...prev, contact: { ...prev.contact, phone: e.target.value } }))}
                          className="mt-2 block w-full rounded border border-slate-300 bg-white px-3 py-2"
                          placeholder="06 00 00 00 00"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Ville / Pays</label>
                        <input
                          value={draft.contact.location}
                          onChange={e => setDraft(prev => ({ ...prev, contact: { ...prev.contact, location: e.target.value } }))}
                          className="mt-2 block w-full rounded border border-slate-300 bg-white px-3 py-2"
                          placeholder="Paris, France"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700">LinkedIn ou portfolio</label>
                        <input
                          value={draft.contact.linkedin}
                          onChange={e => setDraft(prev => ({ ...prev, contact: { ...prev.contact, linkedin: e.target.value } }))}
                          className="mt-2 block w-full rounded border border-slate-300 bg-white px-3 py-2"
                          placeholder="linkedin.com/in/nom"
                        />
                      </div>
                    </div>

                    {!countryRule.hiddenFields?.dateOfBirth && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Date de naissance</label>
                        <input
                          type="date"
                          value={draft.dateOfBirth}
                          onChange={e => changeDraft({ dateOfBirth: e.target.value })}
                          className="mt-2 block w-full rounded border border-slate-300 bg-white px-3 py-2"
                        />
                      </div>
                    )}

                    {!countryRule.hiddenFields?.nationality && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Nationalité</label>
                        <input
                          value={draft.nationality}
                          onChange={e => changeDraft({ nationality: e.target.value })}
                          className="mt-2 block w-full rounded border border-slate-300 bg-white px-3 py-2"
                          placeholder="Française"
                        />
                      </div>
                    )}

                    {!countryRule.hiddenFields?.familyStatus && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Situation familiale</label>
                        <input
                          value={draft.familyStatus}
                          onChange={e => changeDraft({ familyStatus: e.target.value })}
                          className="mt-2 block w-full rounded border border-slate-300 bg-white px-3 py-2"
                          placeholder="Célibataire"
                        />
                      </div>
                    )}

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                      <p className="font-semibold text-slate-900">Expériences</p>
                      <div className="space-y-4 mt-4">
                        {draft.experiences.map(exp => (
                          <div key={exp.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div>
                                <label className="block text-sm font-medium text-slate-700">Poste</label>
                                <input
                                  value={exp.title}
                                  onChange={e => updateExperience(exp.id, { title: e.target.value })}
                                  className="mt-2 block w-full rounded border border-slate-300 bg-white px-3 py-2"
                                  placeholder="Chef de projet"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700">Entreprise</label>
                                <input
                                  value={exp.company}
                                  onChange={e => updateExperience(exp.id, { company: e.target.value })}
                                  className="mt-2 block w-full rounded border border-slate-300 bg-white px-3 py-2"
                                  placeholder="Nom de l'entreprise"
                                />
                              </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2 mt-4">
                              <div>
                                <label className="block text-sm font-medium text-slate-700">Lieu</label>
                                <input
                                  value={exp.location}
                                  onChange={e => updateExperience(exp.id, { location: e.target.value })}
                                  className="mt-2 block w-full rounded border border-slate-300 bg-white px-3 py-2"
                                  placeholder="Paris"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4 mt-4 sm:mt-0">
                                <div>
                                  <label className="block text-sm font-medium text-slate-700">Début</label>
                                  <input
                                    type="month"
                                    value={exp.startDate}
                                    onChange={e => updateExperience(exp.id, { startDate: e.target.value })}
                                    className="mt-2 block w-full rounded border border-slate-300 bg-white px-3 py-2"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-slate-700">Fin</label>
                                  <input
                                    type="month"
                                    value={exp.endDate}
                                    onChange={e => updateExperience(exp.id, { endDate: e.target.value })}
                                    className="mt-2 block w-full rounded border border-slate-300 bg-white px-3 py-2"
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-slate-700">Description</label>
                              <textarea
                                value={exp.description}
                                onChange={e => updateExperience(exp.id, { description: e.target.value })}
                                rows={3}
                                className="mt-2 block w-full rounded border border-slate-300 bg-white px-3 py-2"
                              />
                            </div>
                            {draft.experiences.length > 1 && (
                              <button
                                type="button"
                                className="mt-3 text-sm font-semibold text-red-600 hover:text-red-800"
                                onClick={() => removeExperience(exp.id)}
                              >
                                Supprimer cette expérience
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addExperience}
                          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                        >
                          Ajouter une expérience
                        </button>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                      <p className="font-semibold text-slate-900">Formation</p>
                      <div className="space-y-4 mt-4">
                        {draft.education.map(ed => (
                          <div key={ed.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div>
                                <label className="block text-sm font-medium text-slate-700">Diplôme</label>
                                <input
                                  value={ed.degree}
                                  onChange={e => updateEducation(ed.id, { degree: e.target.value })}
                                  className="mt-2 block w-full rounded border border-slate-300 bg-white px-3 py-2"
                                  placeholder="Master Marketing"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700">Établissement</label>
                                <input
                                  value={ed.institution}
                                  onChange={e => updateEducation(ed.id, { institution: e.target.value })}
                                  className="mt-2 block w-full rounded border border-slate-300 bg-white px-3 py-2"
                                  placeholder="Université"
                                />
                              </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2 mt-4">
                              <div>
                                <label className="block text-sm font-medium text-slate-700">Lieu</label>
                                <input
                                  value={ed.location}
                                  onChange={e => updateEducation(ed.id, { location: e.target.value })}
                                  className="mt-2 block w-full rounded border border-slate-300 bg-white px-3 py-2"
                                  placeholder="Lyon"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4 mt-4 sm:mt-0">
                                <div>
                                  <label className="block text-sm font-medium text-slate-700">Début</label>
                                  <input
                                    type="month"
                                    value={ed.startDate}
                                    onChange={e => updateEducation(ed.id, { startDate: e.target.value })}
                                    className="mt-2 block w-full rounded border border-slate-300 bg-white px-3 py-2"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-slate-700">Fin</label>
                                  <input
                                    type="month"
                                    value={ed.endDate}
                                    onChange={e => updateEducation(ed.id, { endDate: e.target.value })}
                                    className="mt-2 block w-full rounded border border-slate-300 bg-white px-3 py-2"
                                  />
                                </div>
                              </div>
                            </div>
                            {draft.education.length > 1 && (
                              <button
                                type="button"
                                className="mt-3 text-sm font-semibold text-red-600 hover:text-red-800"
                                onClick={() => removeEducation(ed.id)}
                              >
                                Supprimer cette formation
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addEducation}
                          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                        >
                          Ajouter une formation
                        </button>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                      <p className="font-semibold text-slate-900">Compétences</p>
                      <div className="grid gap-4 mt-4 sm:grid-cols-2">
                        {draft.skills.map((skill, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <input
                              value={skill}
                              onChange={e => {
                                const newSkills = [...draft.skills]
                                newSkills[index] = e.target.value
                                setDraft(prev => ({ ...prev, skills: newSkills }))
                              }}
                              className="w-full rounded border border-slate-300 bg-white px-3 py-2"
                              placeholder="Compétence"
                            />
                            {draft.skills.length > 1 && (
                              <button
                                type="button"
                                className="text-sm font-semibold text-red-600 hover:text-red-800"
                                onClick={() => {
                                  const newSkills = draft.skills.filter((_, i) => i !== index)
                                  setDraft(prev => ({ ...prev, skills: newSkills }))
                                }}
                              >
                                Supprimer
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => setDraft(prev => ({ ...prev, skills: [...prev.skills, ''] }))}
                          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                        >
                          Ajouter une compétence
                        </button>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                      <p className="font-semibold text-slate-900">Langues</p>
                      <div className="space-y-4 mt-4">
                        {draft.languages.map(lang => (
                          <div key={lang.id} className="grid gap-4 sm:grid-cols-2">
                            <div>
                              <label className="block text-sm font-medium text-slate-700">Langue</label>
                              <input
                                value={lang.language}
                                onChange={e => updateLanguage(lang.id, { language: e.target.value })}
                                className="mt-2 block w-full rounded border border-slate-300 bg-white px-3 py-2"
                                placeholder="Français"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700">Niveau</label>
                              <input
                                value={lang.level}
                                onChange={e => updateLanguage(lang.id, { level: e.target.value })}
                                className="mt-2 block w-full rounded border border-slate-300 bg-white px-3 py-2"
                                placeholder="Bilingue / C1"
                              />
                            </div>
                            {draft.languages.length > 1 && (
                              <button
                                type="button"
                                className="text-sm font-semibold text-red-600 hover:text-red-800"
                                onClick={() => removeLanguage(lang.id)}
                              >
                                Supprimer
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addLanguage}
                          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                        >
                          Ajouter une langue
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700">Centres d'intérêt</label>
                      <textarea
                        value={draft.interests}
                        onChange={e => changeDraft({ interests: e.target.value })}
                        rows={3}
                        className="mt-2 block w-full rounded border border-slate-300 bg-white px-3 py-2"
                        placeholder="Sport, lecture, voyage..."
                      />
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Modèle</label>
                        <select
                          value={draft.model}
                          onChange={e => changeDraft({ model: e.target.value as TemplateKey })}
                          className="mt-2 block w-full rounded border border-slate-300 bg-white px-3 py-2"
                        >
                          {modelOptions.map(model => (
                            <option key={model.key} value={model.key}>{model.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Palette de couleurs</label>
                        <select
                          value={draft.palette}
                          onChange={e => changeDraft({ palette: e.target.value as PaletteKey })}
                          className="mt-2 block w-full rounded border border-slate-300 bg-white px-3 py-2"
                        >
                          {paletteOptions.map(palette => (
                            <option key={palette} value={palette}>{cvPalettes[palette].label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                      <p className="font-semibold text-slate-900">Prévisualisation</p>
                      <p className="mt-2 text-slate-600">Le rendu ci-contre reflète le modèle de CV choisi et les données saisies.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setStep(prev => Math.max(1, prev - 1))}
                  disabled={step === 1}
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Retour
                </button>
                <button
                  type="button"
                  onClick={() => setStep(prev => Math.min(4, prev + 1))}
                  className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                >
                  {step === 4 ? 'Terminer' : 'Suivant'}
                </button>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Aperçu en direct</p>
                  <p className="text-sm text-slate-500">Le rendu ci-contre reflète le modèle et la palette choisis.</p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  Télécharger mon CV en PDF
                </button>
              </div>
              <div className="overflow-hidden">
                <CVPreview draft={draft} countryRule={countryRule} template={draft.model} palette={activePalette} />
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Optimiser mon CV pour une offre</p>
                    <p className="mt-1 text-sm text-slate-500">Collez ici le texte d’une offre d’emploi pour reformuler votre accroche et vos expériences.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOptimizeCv}
                    disabled={isOptimizing}
                    className="rounded-full bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isOptimizing ? 'Optimisation…' : 'Optimiser'}
                  </button>
                </div>

                <textarea
                  value={jobOfferText}
                  onChange={e => setJobOfferText(e.target.value)}
                  rows={6}
                  className="mt-4 w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm"
                  placeholder="Collez ici l’offre d’emploi complète…"
                />

                {optimizeError ? (
                  <p className="mt-3 text-sm font-medium text-red-600">{optimizeError}</p>
                ) : null}

                {optimizePreview ? (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
                    <p className="text-sm font-semibold text-slate-900">Version optimisée proposée</p>
                    <div className="mt-3 space-y-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Accroche</p>
                        <p className="mt-1 text-sm text-slate-700">{optimizePreview.accrocheOptimisee}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Expériences</p>
                        <div className="mt-2 space-y-2">
                          {optimizePreview.experiencesOptimisees.map((exp, index) => (
                            <div key={`${exp.title || 'exp'}-${index}`} className="rounded border border-slate-200 p-2 text-sm text-slate-700">
                              <p className="font-semibold text-slate-900">{exp.title || 'Intitulé de poste'}</p>
                              <p className="mt-1">{exp.description || 'Description proposée'}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button type="button" onClick={acceptOptimization} className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                        Accepter
                      </button>
                      <button type="button" onClick={refuseOptimization} className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-900">
                        Refuser
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              {countryRule.signatureRequise && (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Signature manuscrite</p>
                      <p className="text-sm text-slate-500">Signez ici pour l’ajouter au CV.</p>
                    </div>
                    <button
                      type="button"
                      onClick={clearSignature}
                      className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700"
                    >
                      Effacer
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="text-sm text-slate-700">
                        <span className="mb-1 block font-medium">Fait à</span>
                        <input
                          value={draft.signatureLocation}
                          onChange={e => setDraft(prev => ({ ...prev, signatureLocation: e.target.value }))}
                          className="w-full rounded border border-slate-300 bg-white px-3 py-2"
                          placeholder="Paris"
                        />
                      </label>
                      <label className="text-sm text-slate-700">
                        <span className="mb-1 block font-medium">Date</span>
                        <input
                          type="date"
                          value={draft.signatureDate}
                          onChange={e => setDraft(prev => ({ ...prev, signatureDate: e.target.value }))}
                          className="w-full rounded border border-slate-300 bg-white px-3 py-2"
                        />
                      </label>
                    </div>

                    <canvas
                      ref={canvasRef}
                      width={560}
                      height={180}
                      onPointerDown={startDrawing}
                      onPointerMove={draw}
                      onPointerUp={stopDrawing}
                      onPointerLeave={stopDrawing}
                      className="w-full rounded border border-slate-300 bg-white touch-none"
                      style={{ height: 180 }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
