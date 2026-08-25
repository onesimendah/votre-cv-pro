import type { NextApiRequest, NextApiResponse } from 'next'

type ExperienceInput = {
  title?: string
  company?: string
  location?: string
  startDate?: string
  endDate?: string
  description?: string
}

type OptimizeCvRequest = {
  mode?: 'optimize' | 'rewrite'
  kind?: 'profile' | 'experience'
  text?: string
  accroche?: string
  profile?: string
  experiences?: ExperienceInput[]
  jobOffer?: string
}

type OptimizeCvResponse = {
  accrocheOptimisee: string
  experiencesOptimisees: ExperienceInput[]
}

type RewriteCvResponse = {
  rewrittenText: string
}

const sendJsonError = (res: NextApiResponse, status: number, message: string, details?: unknown) => {
  const payload: Record<string, unknown> = { error: message }
  if (details !== undefined) payload.details = details
  return res.status(status).json(payload)
}

const readJsonBody = (req: NextApiRequest): OptimizeCvRequest => {
  if (req.body && typeof req.body === 'object') {
    return req.body as OptimizeCvRequest
  }

  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as OptimizeCvRequest
    } catch {
      throw new Error('Corps JSON invalide.')
    }
  }

  return {}
}

const getAvailableFlashModel = async (apiKey: string) => {
  const listResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
  if (!listResponse.ok) {
    const errorText = await listResponse.text()
    throw new Error(`ListModels a échoué (${listResponse.status}) : ${errorText}`)
  }

  const listData = await listResponse.json()
  const models = Array.isArray(listData?.models) ? listData.models : []
  const preferred = models.find((model: any) => {
    const name = String(model?.name || '').toLowerCase()
    const supportedMethods = Array.isArray(model?.supportedGenerationMethods) ? model.supportedGenerationMethods : []
    return name.includes('flash') && supportedMethods.includes('generateContent')
  })

  return preferred?.name?.replace(/^models\//, '') || 'gemini-2.5-flash'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return sendJsonError(res, 405, 'Méthode non autorisée. Utilisez POST.')
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return sendJsonError(res, 500, 'Clé API Gemini absente. Configurez GEMINI_API_KEY dans votre fichier .env.local.')
  }

  try {
    const body = readJsonBody(req)
    const mode = body.mode === 'rewrite' ? 'rewrite' : 'optimize'

    if (mode === 'rewrite') {
      const rawText = body.text?.trim() ?? ''
      if (!rawText) {
        return sendJsonError(res, 400, 'Le texte à reformuler est obligatoire.')
      }

      const modelName = await getAvailableFlashModel(apiKey)
      console.info('Using Gemini model for rewrite:', modelName)

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              role: 'user',
              parts: [{
                text: `Tu es un assistant de rédaction pour CV. Ta mission est de reformuler un texte saisi par un utilisateur pour le rendre professionnel, clair, fluide et entièrement correct en français.

Tu DOIS corriger toutes les fautes d’orthographe, de grammaire, de conjugaison, d’accord et de ponctuation. Tu DOIS améliorer le vocabulaire, la précision et le style pour un rendu professionnel de CV, avec des phrases claires, des verbes d’action et un niveau de qualité supérieur. Tu DOIS rendre le texte visiblement différent et meilleur que l’entrée, jamais une simple copie. Si le texte d’entrée est déjà presque parfait, tu dois quand même l’améliorer, pas le recopier tel quel.

Règles strictes et non négociables :
- Corrige systématiquement toutes les erreurs de français.
- Reformule de façon professionnelle et naturelle, sans conserver les erreurs ni les formulations maladroites.
- Produis un texte visiblement amélioré, plus élégant et plus crédible qu’au départ.
- Ne recopie jamais le texte tel quel : ne laisse pas de fautes, ni de tournures faibles, ni de phrases inachevées.
- Ne jamais inventer de faits. Garde uniquement les informations réellement fournies par l’utilisateur : pas de diplôme, employeur, date, poste, compétence, lieu, chiffre ou détail inventé.
- Si l’utilisateur donne des éléments incomplets, laisse-les incomplets plutôt que d’inventer.
- Ne jamais ajouter d’identité, d’expérience, de formation ou de contexte non mentionné.
- Réponds uniquement avec un JSON valide : { "rewrittenText": "..." }.

Texte à reformuler :
${rawText}`,
              }],
            }],
          }),
        },
      )

      if (!response.ok) {
        const errorText = await response.text()
        let message = 'Échec de l’appel à l’API Gemini pour la reformulation.'
        if (response.status === 429) message = 'Quota Gemini dépassé. La reformulation a été annulée.'
        else if (response.status === 401 || response.status === 403) message = 'Clé API Gemini invalide ou non autorisée.'
        else if (errorText) message = `Erreur Gemini (${response.status}) : ${errorText}`
        return sendJsonError(res, response.status >= 500 ? 502 : 400, message, errorText)
      }

      const data = await response.json()
      const rawReply = data?.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text ?? '')
        .join('')
        .trim()

      if (!rawReply) {
        return sendJsonError(res, 502, 'La réponse de Gemini est vide pour la reformulation.')
      }

      const cleaned = rawReply.replace(/^```json\s*/i, '').replace(/```$/i, '').trim()
      let parsed: RewriteCvResponse
      try {
        parsed = JSON.parse(cleaned)
      } catch {
        return sendJsonError(res, 502, 'La réponse de Gemini n’est pas un JSON valide pour la reformulation.')
      }

      if (typeof parsed?.rewrittenText !== 'string' || !parsed.rewrittenText.trim()) {
        return sendJsonError(res, 502, 'La réponse de Gemini ne contient pas le texte reformulé attendu.')
      }

      return res.status(200).json({ rewrittenText: parsed.rewrittenText.trim() })
    }

    const profile = body.accroche ?? body.profile ?? ''
    const experiences = Array.isArray(body.experiences) ? body.experiences : []
    const jobOffer = body.jobOffer?.trim() ?? ''

    if (!jobOffer) {
      return sendJsonError(res, 400, 'L’offre d’emploi est obligatoire.')
    }

    const modelName = await getAvailableFlashModel(apiKey)
    console.info('Using Gemini model:', modelName)

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `Tu es un agent d’optimisation de CV.

Objectif : optimiser l’accroche et les descriptions d’expériences d’un CV pour mieux correspondre à une offre d’emploi, sans inventer de faits.

Règles strictes :
- Analyse d’abord l’offre d’emploi : compétences clés, mots-clés, exigences, niveau attendu.
- Compare ensuite le CV fourni.
- Reformule l’accroche et les descriptions d’expériences pour les aligner sur l’offre.
- Ne pas inventer de faits : ne change pas les noms, dates, diplômes, employeurs, lieux réels, ni les expériences réelles.
- Ne pas inclure d’informations d’identité (nom, email, téléphone, adresse).
- Conserve la structure de base du CV et fais une reformulation plus ciblée et professionnelle.

Données du CV à utiliser (sans identité) :
Accroche : ${profile || 'Aucune accroche fournie.'}

Expériences : ${JSON.stringify(experiences, null, 2)}

Offre d’emploi : ${jobOffer}

Réponds UNIQUEMENT avec un JSON valide au format suivant :
{
  "accrocheOptimisee": "...",
  "experiencesOptimisees": [
    {
      "title": "...",
      "company": "...",
      "location": "...",
      "startDate": "...",
      "endDate": "...",
      "description": "..."
    }
  ]
}`,
                },
              ],
            },
          ],
        }),
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error response:', response.status, errorText)
      let message = 'Échec de l’appel à l’API Gemini.'

      if (response.status === 429) {
        message = 'Quota Gemini dépassé ou trop de requêtes. Réessayez plus tard.'
      } else if (response.status === 401 || response.status === 403) {
        message = 'Clé API Gemini invalide ou non autorisée.'
      } else if (errorText) {
        message = `Erreur Gemini (${response.status}) : ${errorText}`
      }

      return sendJsonError(res, response.status >= 500 ? 502 : 400, message, errorText)
    }

    const data = await response.json()
    const rawText = data?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text ?? '')
      .join('')
      .trim()

    if (!rawText) {
      return sendJsonError(res, 502, 'La réponse de Gemini est vide.')
    }

    const cleanedText = rawText.replace(/^```json\s*/i, '').replace(/```$/i, '').trim()

    let parsed: OptimizeCvResponse
    try {
      parsed = JSON.parse(cleanedText)
    } catch {
      return sendJsonError(res, 502, 'La réponse de Gemini n’est pas un JSON valide.')
    }

    if (
      typeof parsed?.accrocheOptimisee !== 'string' ||
      !Array.isArray(parsed?.experiencesOptimisees)
    ) {
      return sendJsonError(res, 502, 'La réponse de Gemini ne contient pas la structure attendue.')
    }

    return res.status(200).json(parsed)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    console.error('Unexpected Gemini optimization error:', message)
    return sendJsonError(res, 502, `Impossible de contacter Gemini : ${message}`)
  }
}
