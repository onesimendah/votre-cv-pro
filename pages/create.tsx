import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/router'
import { countryRules, CountryKey } from '../lib/countryRules'
import { CVPreview } from '../components/CVPreview'
import { CVDraft, CVEducation, CVExperience, CVLanguage, CVSkillCategory, emptyDraft } from '../lib/cvTypes'
import { cvModels, cvPalettes, PaletteKey, TemplateKey } from '../lib/cvTemplates'
import { exportPdfDocument } from '../lib/pdfExport'

const steps = ['Pays', 'Métier', 'Informations', 'Mise en page & Prévisualisation']

type ChatMode = 'form' | 'chat'
type ChatMessage = { role: 'assistant' | 'user'; text: string }

type ChatProposal = {
  kind: 'profile' | 'experience'
  text: string
  rawText?: string
  warning?: string
  index?: number
  title?: string
  experienceData?: Omit<CVExperience, 'id'>
  finishRequested?: boolean
}

type ChatExtractedData = {
  identity?: Partial<CVDraft['identity']>
  targetJob?: string
  contact?: Partial<CVDraft['contact']>
  dateOfBirth?: string
  familyStatus?: string
  nationality?: string
  country?: CountryKey
  model?: CVDraft['model']
  palette?: CVDraft['palette']
  experience?: Partial<Omit<CVExperience, 'id'>>
  education?: Partial<Omit<CVEducation, 'id'>>
  skills?: string[]
  languages?: Array<Partial<Pick<CVLanguage, 'language' | 'level'>>>
  interests?: string
  signatureLocation?: string
  signatureDate?: string
}

type ChatExtractionResult = {
  data: ChatExtractedData
  warning?: string
  fallbackText?: string
}

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
    experiences: Array.isArray(raw.experiences)
      ? raw.experiences.map((exp: Partial<CVExperience>) => ({ technologies: '', ...exp }))
      : emptyDraft.experiences,
    education: Array.isArray(raw.education) ? raw.education : emptyDraft.education,
    skills: Array.isArray(raw.skills) ? raw.skills : emptyDraft.skills,
    skillCategories: Array.isArray(raw.skillCategories) ? raw.skillCategories : emptyDraft.skillCategories,
    languages: Array.isArray(raw.languages) ? raw.languages : emptyDraft.languages,
  }
}

const createId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`

const mergeExtractedText = (current: string, extracted: unknown) =>
  typeof extracted === 'string' && extracted.trim() ? extracted.trim() : current

const appendFallbackText = (current: string, rawText: string) =>
  [current.trim(), rawText.trim()].filter(Boolean).join('\n')

const isEmptyExperience = (experience: CVExperience) =>
  !experience.title && !experience.company && !experience.location && !experience.startDate &&
  !experience.endDate && !experience.description && !experience.technologies

const isEmptyEducation = (education: CVEducation) =>
  !education.degree && !education.institution && !education.location &&
  !education.startDate && !education.endDate

const mergeChatExtraction = (
  draft: CVDraft,
  step: number,
  data: ChatExtractedData,
  fallbackText?: string,
): CVDraft => {
  if (step === 0) {
    const identity = data.identity || {}
    const contact = data.contact || {}
    return {
      ...draft,
      identity: {
        ...draft.identity,
        firstName: mergeExtractedText(draft.identity.firstName, identity.firstName),
        lastName: mergeExtractedText(draft.identity.lastName, identity.lastName),
      },
      targetJob: fallbackText
        ? appendFallbackText(draft.targetJob, fallbackText)
        : mergeExtractedText(draft.targetJob, data.targetJob),
      contact: {
        ...draft.contact,
        email: mergeExtractedText(draft.contact.email, contact.email),
        phone: mergeExtractedText(draft.contact.phone, contact.phone),
        location: mergeExtractedText(draft.contact.location, contact.location),
        linkedin: mergeExtractedText(draft.contact.linkedin, contact.linkedin),
      },
      dateOfBirth: mergeExtractedText(draft.dateOfBirth, data.dateOfBirth),
      familyStatus: mergeExtractedText(draft.familyStatus, data.familyStatus),
      nationality: mergeExtractedText(draft.nationality, data.nationality),
    }
  }

  if (step === 1) {
    return {
      ...draft,
      country: data.country && countryRules[data.country] ? data.country : draft.country,
      model: data.model || draft.model,
      palette: data.palette || draft.palette,
      personalProfile: fallbackText
        ? appendFallbackText(draft.personalProfile, fallbackText)
        : draft.personalProfile,
    }
  }

  if (step === 3) {
    const extracted = data.experience || {}
    const index = draft.experiences.findIndex(isEmptyExperience)
    const experience: CVExperience = {
      id: index >= 0 ? draft.experiences[index].id : createId('exp'),
      title: extracted.title || '',
      company: extracted.company || '',
      location: extracted.location || '',
      startDate: extracted.startDate || '',
      endDate: extracted.endDate || '',
      description: fallbackText || extracted.description || '',
      technologies: extracted.technologies || '',
    }
    const experiences = [...draft.experiences]
    if (index >= 0) experiences[index] = { ...experiences[index], ...experience }
    else experiences.push(experience)
    return { ...draft, experiences }
  }

  if (step === 4) {
    const extracted = data.education || {}
    const index = draft.education.findIndex(isEmptyEducation)
    const education: CVEducation = {
      id: index >= 0 ? draft.education[index].id : createId('edu'),
      degree: fallbackText || extracted.degree || '',
      institution: extracted.institution || '',
      location: extracted.location || '',
      startDate: extracted.startDate || '',
      endDate: extracted.endDate || '',
    }
    const list = [...draft.education]
    if (index >= 0) list[index] = { ...list[index], ...education }
    else list.push(education)
    return { ...draft, education: list }
  }

  if (step === 5) {
    const skills = [...draft.skills]
    const extractedSkills = fallbackText ? [fallbackText] : (data.skills || [])
    extractedSkills.forEach(skill => {
      const value = skill.trim()
      if (!value) return
      const emptyIndex = skills.findIndex(existing => !existing.trim())
      if (emptyIndex >= 0) skills[emptyIndex] = value
      else if (!skills.some(existing => existing.trim().toLowerCase() === value.toLowerCase())) skills.push(value)
    })

    const languages = [...draft.languages]
    if (!fallbackText) {
      (data.languages || []).forEach(extracted => {
        const language = extracted.language?.trim() || ''
        const level = extracted.level?.trim() || ''
        if (!language && !level) return
        const emptyIndex = languages.findIndex(existing => !existing.language || !existing.level)
        if (emptyIndex >= 0) {
          languages[emptyIndex] = {
            ...languages[emptyIndex],
            language: languages[emptyIndex].language || language,
            level: languages[emptyIndex].level || level,
          }
        } else {
          languages.push({ id: createId('lang'), language, level })
        }
      })
    }

    return {
      ...draft,
      skills,
      languages,
      interests: fallbackText
        ? mergeExtractedText(draft.interests, fallbackText)
        : mergeExtractedText(draft.interests, data.interests),
    }
  }

  if (step === 6) {
    return {
      ...draft,
      signatureLocation: fallbackText
        ? appendFallbackText(draft.signatureLocation, fallbackText)
        : mergeExtractedText(draft.signatureLocation, data.signatureLocation),
      signatureDate: mergeExtractedText(draft.signatureDate, data.signatureDate),
    }
  }

  return draft
}

const hasChatFinishRequest = (text: string) => /\b(fin|terminer|ok|suivant|suite)\b/i.test(text)
const isChatFinishOnly = (text: string) => /^(fin|terminer|ok|suivant|suite)[.!? ]*$/i.test(text.trim())

export default function Create() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [creationMode, setCreationMode] = useState<ChatMode>('form')
  const [draft, setDraft] = useState<CVDraft>(emptyDraft)
  const [jobOfferText, setJobOfferText] = useState('')
  const [optimizeError, setOptimizeError] = useState('')
  const [optimizePreview, setOptimizePreview] = useState<{ accrocheOptimisee: string; experiencesOptimisees: Array<Partial<CVExperience>> } | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'assistant', text: 'Bonjour ! Je peux créer votre CV avec vous en discutant. Dites-moi simplement vos informations, par petits groupes logiques, et je les place au bon endroit.' },
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatStep, setChatStep] = useState(0)
  const [chatProposal, setChatProposal] = useState<ChatProposal | null>(null)
  const [isChatAiWorking, setIsChatAiWorking] = useState(false)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const chatScrollRef = useRef<HTMLDivElement | null>(null)
  const chatInputRef = useRef<HTMLTextAreaElement | null>(null)
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
    const chat = chatScrollRef.current
    if (chat) chat.scrollTo({ top: chat.scrollHeight, behavior: 'smooth' })
  }, [chatMessages, isChatAiWorking, chatProposal])

  useEffect(() => {
    const input = chatInputRef.current
    if (!input) return
    input.style.height = 'auto'
    input.style.height = `${input.scrollHeight}px`
  }, [chatInput])

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

  useEffect(() => {
    const requestedMode = router.query.mode === 'chat' ? 'chat' : 'form'
    setCreationMode(requestedMode)
  }, [router.query.mode])

  const chatFlow = [
    'Identité et contact : nom complet, poste visé, email, téléphone, ville, LinkedIn.',
    'Modèle de CV : pays, mise en page (Classique / Moderne / Colonne latérale), couleur.',
    'Profil / accroche : quelques mots sur votre parcours et objectif.',
    'Expériences : poste, employeur, lieu, dates, missions. Répondez une expérience à la fois ou écrivez “fin” pour passer à la suite.',
    'Formation : diplôme, école, lieu, dates.',
    'Compétences, langues et centres d’intérêt.',
    'Signature et date si votre pays le demande.',
  ]

  const extractChatData = async (step: number, rawText: string): Promise<ChatExtractionResult> => {
    const emptyData: ChatExtractedData = step === 0
      ? { identity: { firstName: '', lastName: '' }, targetJob: '', contact: { email: '', phone: '', location: '', linkedin: '' }, dateOfBirth: '', familyStatus: '', nationality: '' }
      : step === 1
        ? { country: draft.country, model: draft.model, palette: draft.palette }
        : step === 3
          ? { experience: { title: '', company: '', location: '', startDate: '', endDate: '', description: '', technologies: '' } }
          : step === 4
            ? { education: { degree: '', institution: '', location: '', startDate: '', endDate: '' } }
            : step === 5
              ? { skills: [], languages: [], interests: '' }
              : { signatureLocation: '', signatureDate: '' }
    const fallback = (message: string): ChatExtractionResult => ({
      data: emptyData,
      warning: `${message} Votre texte brut a été conservé dans le brouillon pour vérification.`,
      fallbackText: rawText,
    })

    try {
      setIsChatAiWorking(true)
      const response = await fetch('/api/optimize-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'extract',
          step,
          text: rawText,
          country: draft.country,
          defaults: { country: draft.country, model: draft.model, palette: draft.palette },
        }),
      })
      const responseData = await response.json()
      if (!response.ok) {
        return fallback(responseData?.error || 'L’extraction automatique a échoué.')
      }
      if (!responseData?.data || typeof responseData.data !== 'object' || Array.isArray(responseData.data)) {
        return fallback('La réponse d’extraction est invalide.')
      }
      return { data: responseData.data as ChatExtractedData }
    } catch {
      return fallback('Je n’ai pas pu extraire automatiquement vos informations.')
    } finally {
      setIsChatAiWorking(false)
    }
  }

  const rewriteChatText = async (kind: 'profile' | 'experience', rawText: string) => {
    try {
      setIsChatAiWorking(true)
      const response = await fetch('/api/optimize-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'rewrite',
          kind,
          text: rawText,
          jobOffer: draft.targetJob || 'Poste visé',
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        return { text: rawText.trim(), warning: data?.error || 'La reformulation automatique a échoué. J’ai conservé votre texte brut.' }
      }

      const rewritten = typeof data?.rewrittenText === 'string' ? data.rewrittenText.trim() : rawText.trim()
      return { text: rewritten || rawText.trim(), warning: undefined }
    } catch {
      return { text: rawText.trim(), warning: 'Je n’ai pas pu reformuler automatiquement. J’ai conservé votre texte brut.' }
    } finally {
      setIsChatAiWorking(false)
    }
  }

  const applyChatDraftUpdate = async (rawText: string): Promise<{
    shouldContinue: boolean
    warning?: string
    updatedDraft?: CVDraft
  }> => {
    const input = rawText.trim()
    if (!input) return { shouldContinue: true }

    if (chatStep === 2) {
      setDraft(prev => ({ ...prev, personalProfile: input }))
      if (input.length > 10) {
        const result = await rewriteChatText('profile', input)
        setChatProposal({
          kind: 'profile',
          text: result.text,
          rawText: input,
          warning: result.warning,
        })
        return { shouldContinue: false }
      }
      return { shouldContinue: true }
    }

    if ((chatStep === 3 || chatStep === 4) && isChatFinishOnly(input)) {
      return { shouldContinue: true }
    }

    if (chatStep === 3) {
      const extraction = await extractChatData(chatStep, input)
      const extracted = extraction.data.experience || {}
      const result = await rewriteChatText('experience', input)
      const emptyExperience = {
        title: '',
        company: '',
        location: '',
        startDate: '',
        endDate: '',
        description: extraction.fallbackText || extracted.description || '',
        technologies: '',
      }
      setChatProposal({
        kind: 'experience',
        text: result.text,
        rawText: input,
        warning: [extraction.warning, result.warning].filter(Boolean).join(' ') || undefined,
        experienceData: {
          ...emptyExperience,
          title: extracted.title || '',
          company: extracted.company || '',
          location: extracted.location || '',
          startDate: extracted.startDate || '',
          endDate: extracted.endDate || '',
          technologies: extracted.technologies || '',
        },
        index: draft.experiences.findIndex(isEmptyExperience) >= 0
          ? draft.experiences.findIndex(isEmptyExperience)
          : draft.experiences.length,
        finishRequested: hasChatFinishRequest(input),
      })
      return { shouldContinue: false }
    }

    const extraction = await extractChatData(chatStep, input)
    const updatedDraft = mergeChatExtraction(draft, chatStep, extraction.data, extraction.fallbackText)
    setDraft(prev => mergeChatExtraction(prev, chatStep, extraction.data, extraction.fallbackText))
    return { shouldContinue: true, warning: extraction.warning, updatedDraft }
  }

  const handleChatSubmit = async () => {
    if (!chatInput.trim()) return

    const typed = chatInput.trim()
    setChatMessages(prev => [...prev, { role: 'user', text: typed }])
    setChatInput('')

    const update = await applyChatDraftUpdate(typed)
    if (!update.shouldContinue) return

    const currentStepIndex = chatStep
    if (currentStepIndex === 6) {
      const summaryDraft = update.updatedDraft || draft
      const summaryLines = [
        'Récapitulatif de votre CV :',
        `Identité : ${[summaryDraft.identity.firstName, summaryDraft.identity.lastName].filter(Boolean).join(' ') || 'Non renseignée'}`,
        `Coordonnées : ${[
          summaryDraft.contact.email,
          summaryDraft.contact.phone,
          summaryDraft.contact.location,
          summaryDraft.contact.linkedin,
        ].filter(Boolean).join(' — ') || 'Non renseignées'}`,
        `Date de naissance : ${summaryDraft.dateOfBirth || 'Non renseignée'}`,
        `Nationalité : ${summaryDraft.nationality || 'Non renseignée'}`,
        `Situation familiale : ${summaryDraft.familyStatus || 'Non renseignée'}`,
        `Poste visé : ${summaryDraft.targetJob || 'Non renseigné'}`,
        `Pays : ${summaryDraft.country}`,
        `Modèle : ${summaryDraft.model}`,
        `Couleur : ${summaryDraft.palette}`,
        `Profil : ${summaryDraft.personalProfile || 'Non renseigné'}`,
        'Expériences :',
        ...(summaryDraft.experiences.filter(experience => !isEmptyExperience(experience)).length
          ? summaryDraft.experiences.filter(experience => !isEmptyExperience(experience)).map((experience, index) =>
            `${index + 1}. ${[experience.title, experience.company, experience.location, experience.startDate, experience.endDate].filter(Boolean).join(' — ')}${experience.description ? `\n   ${experience.description}` : ''}${experience.technologies ? `\n   Technologies : ${experience.technologies}` : ''}`)
          : ['Aucune renseignée']),
        'Formations :',
        ...(summaryDraft.education.filter(education => !isEmptyEducation(education)).length
          ? summaryDraft.education.filter(education => !isEmptyEducation(education)).map((education, index) =>
            `${index + 1}. ${[education.degree, education.institution, education.location, education.startDate, education.endDate].filter(Boolean).join(' — ')}`)
          : ['Aucune renseignée']),
        `Compétences : ${summaryDraft.skills.filter(Boolean).join(', ') || 'Aucune renseignée'}`,
        `Langues : ${summaryDraft.languages.filter(language => language.language || language.level).map(language => [language.language, language.level].filter(Boolean).join(' — ')).join(', ') || 'Aucune renseignée'}`,
        `Centres d’intérêt : ${summaryDraft.interests || 'Non renseignés'}`,
        ...(countryRules[summaryDraft.country]?.signatureRequise
          ? [`Signature : ${[summaryDraft.signatureLocation, summaryDraft.signatureDate].filter(Boolean).join(' — ') || 'Non renseignée'}`]
          : []),
        'Vérifiez ces informations dans le formulaire avant de générer votre CV.',
      ]
      const warning = update.warning ? `\n\n⚠️ ${update.warning}` : ''
      setChatMessages(prev => [...prev, { role: 'assistant', text: `${summaryLines.join('\n')}${warning}` }])
      setChatStep(7)
      return
    }
    if (currentStepIndex === 3 && hasChatFinishRequest(typed)) {
      setChatMessages(prev => [...prev, { role: 'assistant', text: 'Très bien. Passons à la formation.' }])
      setChatStep(4)
      return
    }
    if (currentStepIndex === 4) {
      if (hasChatFinishRequest(typed)) {
        setChatMessages(prev => [...prev, { role: 'assistant', text: 'Très bien. Passons aux compétences, langues et centres d’intérêt.' }])
        setChatStep(5)
      } else {
        const warning = update.warning ? `\n\n⚠️ ${update.warning}` : ''
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          text: `Formation enregistrée. Ajoutez-en une autre, ou écrivez « fin » pour passer aux compétences.${warning}`,
        }])
      }
      return
    }

    const nextStep = currentStepIndex + 1
    const nextAssistantText = nextStep <= chatFlow.length - 1
      ? `Merci. Passons à l’étape suivante : ${chatFlow[nextStep]}`
      : 'Excellent. Je peux maintenant vérifier le résumé et générer votre CV.'

    const warning = update.warning ? `\n\n⚠️ ${update.warning}` : ''
    setChatMessages(prev => [...prev, { role: 'assistant', text: `${nextAssistantText}${warning}` }])
    setChatStep(nextStep)
  }

  const applyChatProposal = async (accept: boolean) => {
    if (!chatProposal) return

    if (chatProposal.kind === 'profile') {
      if (accept) {
        setDraft(prev => ({ ...prev, personalProfile: chatProposal.text }))
        setChatMessages(prev => [...prev, { role: 'assistant', text: 'Parfait, j’ai validé la formulation de votre profil.' }])
        const nextStep = Math.min(chatStep + 1, chatFlow.length - 1)
        setChatStep(nextStep)
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          text: `Merci. Passons à l’étape suivante : ${chatFlow[nextStep]}`,
        }])
      } else {
        const sourceText = chatProposal.rawText || chatProposal.text
        const result = await rewriteChatText('profile', sourceText)
        setChatProposal({ ...chatProposal, text: result.text, warning: result.warning })
        setChatMessages(prev => [...prev, { role: 'assistant', text: 'Je te propose une autre version.' }])
      }
    }

    if (chatProposal.kind === 'experience') {
      if (accept) {
        setDraft(prev => {
          const list = [...prev.experiences]
          const index = Math.min(chatProposal.index ?? list.length, list.length)
          const base = list[index] || {
            id: createId('exp'),
            title: '',
            company: '',
            location: '',
            startDate: '',
            endDate: '',
            description: '',
            technologies: '',
          }
          const experience = {
            ...base,
            ...chatProposal.experienceData,
            description: chatProposal.text,
          }
          if (index < list.length) list[index] = experience
          else list.push(experience)
          return { ...prev, experiences: list }
        })
        if (chatProposal.finishRequested) {
          setChatMessages(prev => [...prev, { role: 'assistant', text: 'Expérience enregistrée. Très bien, passons à la formation.' }])
          setChatStep(4)
        } else {
          setChatMessages(prev => [...prev, {
            role: 'assistant',
            text: 'Expérience enregistrée. Ajoutez-en une autre, ou écrivez « fin » pour passer à la formation.',
          }])
          setChatStep(3)
        }
      } else {
        const sourceText = chatProposal.rawText || chatProposal.text
        const result = await rewriteChatText('experience', sourceText)
        setChatProposal({
          ...chatProposal,
          text: result.text,
          warning: [chatProposal.warning, result.warning].filter(Boolean).join(' ') || undefined,
        })
        setChatMessages(prev => [...prev, { role: 'assistant', text: 'Je peux la reformuler différemment. Donnez-moi un autre angle.' }])
      }
    }

    if (accept) {
      setChatProposal(null)
    }
  }

  const handleModeSwitch = (nextMode: ChatMode) => {
    setCreationMode(nextMode)
    const query = nextMode === 'chat' ? { mode: 'chat' } : {}
    void router.push({ pathname: '/create', query }, undefined, { shallow: true })
  }

  const handleDownloadPdf = async () => {
    const firstName = draft.identity.firstName || 'Prenom'
    const lastName = draft.identity.lastName || 'Nom'
    const fileName = `CV_${sanitizeFileName(firstName)}_${sanitizeFileName(lastName)}_${sanitizeFileName(draft.country)}.pdf`
    if (draft.model === 'colonne-laterale') {
      const { createColonneLateralePdfDocument } = await import('../lib/pdfDocumentColonneLaterale')
      const document = createColonneLateralePdfDocument(draft, countryRule, activePalette)
      await exportPdfDocument(document, fileName)
      return
    }
    const { createPdfDocument } = await import('../lib/pdfDocument')
    const document = createPdfDocument(draft, countryRule, activePalette)
    await exportPdfDocument(document, fileName)
  }

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
      technologies: draft.experiences[index]?.technologies || '',
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
        technologies: '',
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

  const updateSkillCategory = (id: string, patch: Partial<CVSkillCategory>) => {
    setDraft(prev => ({
      ...prev,
      skillCategories: prev.skillCategories.map(cat => cat.id === id ? { ...cat, ...patch } : cat),
    }))
  }

  const removeSkillCategory = (id: string) => {
    setDraft(prev => ({
      ...prev,
      skillCategories: prev.skillCategories.filter(cat => cat.id !== id),
    }))
  }

  const addSkillCategory = () => {
    setDraft(prev => ({
      ...prev,
      skillCategories: [...prev.skillCategories, { id: createId('cat'), name: '', skills: '' }],
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

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Créer mon CV</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-900">Votre CV pro</h1>
              <p className="mt-2 text-slate-600">Complétez vos informations, choisissez un style et visualisez votre CV en temps réel.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => handleModeSwitch('form')}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${creationMode === 'form' ? 'bg-slate-900 text-white' : 'border border-slate-300 bg-white text-slate-700 hover:border-slate-900'}`}
              >
                Formulaire
              </button>
              <button
                type="button"
                onClick={() => handleModeSwitch('chat')}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${creationMode === 'chat' ? 'bg-slate-900 text-white' : 'border border-slate-300 bg-white text-slate-700 hover:border-slate-900'}`}
              >
                Créer mon CV en discutant
              </button>
            </div>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            {creationMode === 'chat' ? (
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1E3A5F] text-sm font-bold text-white" aria-hidden="true">
                      AW
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-slate-900">Awa — Assistante CV</h2>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                        <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
                        en ligne
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDraft(emptyDraft)}
                    className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700"
                  >
                    Réinitialiser
                  </button>
                </div>

                <div className="mb-4">
                  <div className="mb-1.5 flex items-center justify-between text-xs text-slate-500">
                    <span>Progression</span>
                    <span>Étape {Math.min(chatStep + 1, chatFlow.length)} sur {chatFlow.length}</span>
                  </div>
                  <div
                    className="h-1.5 overflow-hidden rounded-full bg-slate-100"
                    role="progressbar"
                    aria-label="Progression de la conversation"
                    aria-valuemin={1}
                    aria-valuemax={chatFlow.length}
                    aria-valuenow={Math.min(chatStep + 1, chatFlow.length)}
                  >
                    <div
                      className="h-full rounded-full bg-[#E8963A] transition-[width] duration-300"
                      style={{ width: `${(chatStep / (chatFlow.length - 1)) * 100}%` }}
                    />
                  </div>
                </div>

                <div ref={chatScrollRef} className="mt-5 max-h-[420px] space-y-3 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4">
                  {chatMessages.map((message, index) => (
                    <motion.div
                      key={`${message.role}-${index}`}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.22 }}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] rounded-3xl px-4 py-2.5 text-sm leading-6 ${message.role === 'user' ? 'bg-[#1E3A5F] text-white' : 'bg-slate-100 text-slate-800'}`}>
                        {message.text}
                      </div>
                    </motion.div>
                  ))}

                  {isChatAiWorking ? (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="flex items-center gap-2 rounded-3xl bg-slate-100 px-4 py-3 text-sm text-slate-600" aria-label="Awa est en train d’écrire">
                        <span>en train d’écrire</span>
                        <span className="flex items-center gap-1" aria-hidden="true">
                          {[0, 1, 2].map(dot => (
                            <motion.span
                              key={dot}
                              className="h-1.5 w-1.5 rounded-full bg-[#1E3A5F]"
                              animate={{ y: [0, -4, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: dot * 0.15 }}
                            />
                          ))}
                        </span>
                      </div>
                    </motion.div>
                  ) : null}

                  {chatProposal ? (
                    <div className="rounded-2xl border border-[#1E3A5F]/20 bg-[#1E3A5F]/5 p-4 text-sm text-slate-700">
                      <p className="font-semibold text-[#1E3A5F]">Voici ma proposition :</p>
                      <p className="mt-2 whitespace-pre-line">{chatProposal.text}</p>
                      {chatProposal.warning ? (
                        <p className="mt-2 text-xs font-medium text-amber-700">{chatProposal.warning}</p>
                      ) : null}
                      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Ça te convient, ou je reformule ?</p>
                      <div className="mt-3 flex flex-wrap gap-3">
                        <button type="button" onClick={() => void applyChatProposal(true)} className="rounded-full bg-[#E8963A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#d7832d]">Accepter</button>
                        <button type="button" onClick={() => void applyChatProposal(false)} className="rounded-full border border-[#1E3A5F] bg-white px-4 py-2 text-sm font-semibold text-[#1E3A5F] transition hover:bg-[#1E3A5F]/5">Reformuler</button>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 flex items-end gap-2 rounded-full border border-slate-300 bg-white p-1.5 shadow-sm focus-within:border-[#1E3A5F] focus-within:ring-2 focus-within:ring-[#1E3A5F]/10">
                  <textarea
                    ref={chatInputRef}
                    value={chatInput}
                    onChange={event => setChatInput(event.target.value)}
                    onKeyDown={event => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault()
                        void handleChatSubmit()
                      }
                    }}
                    rows={1}
                    placeholder="Répondez à la question, ou donnez plusieurs infos d’un coup…"
                    className="max-h-32 min-h-10 flex-1 resize-none overflow-y-auto border-0 bg-transparent px-3 py-2 text-sm leading-6 text-slate-800 outline-none ring-0 placeholder:text-slate-400 focus:border-0 focus:outline-none focus:ring-0"
                  />
                  <button
                    type="button"
                    onClick={() => void handleChatSubmit()}
                    aria-label="Envoyer le message"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E8963A] text-white transition hover:bg-[#d7832d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E3A5F]"
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                      <path d="M4 12 20 4l-5 16-3.5-7.5L4 12Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                      <path d="m11.5 12.5 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button type="button" onClick={() => setChatStep(Math.min(chatStep + 1, chatFlow.length - 1))} className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700">
                    Étape suivante
                  </button>
                  <button type="button" onClick={() => setChatStep(Math.max(0, chatStep - 1))} className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700">
                    Retour
                  </button>
                </div>
              </section>
            ) : (
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
                      <label className="block text-sm font-medium text-slate-700">Pays</label>
                      <select
                        value={draft.country}
                        onChange={e => changeDraft({ country: e.target.value as CountryKey })}
                        className="mt-2 block w-full rounded border border-slate-300 bg-white px-3 py-2"
                      >
                        {Object.values(countryRules).map(rule => (
                          <option key={rule.countryKey} value={rule.countryKey}>{rule.name}</option>
                        ))}
                      </select>
                      <p className="mt-3 text-sm text-slate-500">Choisissez le pays dont vous souhaitez suivre les usages (ex. si votre pays suit les codes français, choisissez France). Vous pourrez choisir la mise en page et les couleurs à l'étape 4.</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                      <p className="font-semibold text-slate-900">Résumé du pays</p>
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
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-slate-700">Technologies / compétences utilisées (optionnel)</label>
                              <input
                                value={exp.technologies}
                                onChange={e => updateExperience(exp.id, { technologies: e.target.value })}
                                className="mt-2 block w-full rounded border border-slate-300 bg-white px-3 py-2"
                                placeholder="React, Node.js, MongoDB"
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
                      <p className="font-semibold text-slate-900">Compétences par catégorie (optionnel)</p>
                      <p className="mt-1 text-slate-500">Regroupez vos compétences par thème (ex. Frontend, Backend...). Utilisé notamment par le modèle « Colonne latérale ». Si vous ne définissez aucune catégorie, la liste de compétences ci-dessus est utilisée.</p>
                      <div className="space-y-4 mt-4">
                        {draft.skillCategories.map(cat => (
                          <div key={cat.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="grid gap-4 sm:grid-cols-[0.6fr_1fr]">
                              <div>
                                <label className="block text-sm font-medium text-slate-700">Catégorie</label>
                                <input
                                  value={cat.name}
                                  onChange={e => updateSkillCategory(cat.id, { name: e.target.value })}
                                  className="mt-2 block w-full rounded border border-slate-300 bg-white px-3 py-2"
                                  placeholder="Frontend"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700">Compétences (séparées par des virgules)</label>
                                <input
                                  value={cat.skills}
                                  onChange={e => updateSkillCategory(cat.id, { skills: e.target.value })}
                                  className="mt-2 block w-full rounded border border-slate-300 bg-white px-3 py-2"
                                  placeholder="React, Vue, Tailwind CSS"
                                />
                              </div>
                            </div>
                            <button
                              type="button"
                              className="mt-3 text-sm font-semibold text-red-600 hover:text-red-800"
                              onClick={() => removeSkillCategory(cat.id)}
                            >
                              Supprimer cette catégorie
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addSkillCategory}
                          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                        >
                          Ajouter une catégorie
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
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Mise en page</label>
                      <p className="mt-1 text-sm text-slate-500">Choisissez la structure de votre CV. La couleur se règle séparément juste en dessous.</p>
                      <div className="mt-3 grid gap-3 sm:grid-cols-3">
                        {modelOptions.map(model => {
                          const isSelected = draft.model === model.key
                          const isSidebarLayout = model.key === 'colonne-laterale'
                          return (
                            <button
                              key={model.key}
                              type="button"
                              onClick={() => changeDraft({ model: model.key })}
                              aria-pressed={isSelected}
                              className={`flex flex-col overflow-hidden rounded-2xl border-2 bg-white text-left transition ${isSelected ? 'border-slate-900 shadow-md' : 'border-slate-200 hover:border-slate-400'}`}
                            >
                              {isSidebarLayout ? (
                                <div className="flex h-16 gap-1 bg-slate-100 p-2">
                                  <div className="w-1/3 rounded bg-slate-900" />
                                  <div className="flex-1 space-y-1 rounded bg-white p-1.5">
                                    <div className="h-1 w-3/4 rounded-full bg-slate-300" />
                                    <div className="h-1 w-full rounded-full bg-slate-200" />
                                    <div className="h-1 w-2/3 rounded-full bg-slate-200" />
                                  </div>
                                </div>
                              ) : (
                                <div className="h-16 space-y-1 bg-slate-100 p-2">
                                  <div className="h-3 w-full rounded bg-slate-900" />
                                  <div className="h-1 w-full rounded-full bg-slate-200" />
                                  <div className="h-1 w-5/6 rounded-full bg-slate-200" />
                                  <div className="h-1 w-2/3 rounded-full bg-slate-200" />
                                </div>
                              )}
                              <div className="p-3">
                                <p className="text-sm font-semibold text-slate-900">{model.name}</p>
                                <p className="mt-1 text-xs leading-5 text-slate-500">{model.description}</p>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Palette de couleurs</label>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {paletteOptions.map(palette => {
                          const isSelected = draft.palette === palette
                          return (
                            <button
                              key={palette}
                              type="button"
                              onClick={() => changeDraft({ palette })}
                              aria-pressed={isSelected}
                              className={`flex items-center gap-2 rounded-full border-2 bg-white px-3 py-1.5 text-sm transition ${isSelected ? 'border-slate-900 shadow-sm' : 'border-slate-200 hover:border-slate-400'}`}
                            >
                              <span className={`h-4 w-4 rounded-full ${cvPalettes[palette].accentBg}`} />
                              {cvPalettes[palette].label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                      <p className="font-semibold text-slate-900">Prévisualisation</p>
                      <p className="mt-2 text-slate-600">Le rendu ci-contre reflète la mise en page et la palette choisies.</p>
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
          )}
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
