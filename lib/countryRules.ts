export type CountryKey = 'Benin' | 'France' | 'Canada' | 'Belgique' | 'Suisse'

export type CountryRule = {
  name: string
  countryKey: CountryKey
  showPhoto: boolean
  signatureRequise: boolean
  photoRecommended?: boolean
  recommendedPages: string
  sections: string[]
  hiddenFields?: {
    dateOfBirth?: boolean
    familyStatus?: boolean
    nationality?: boolean
    age?: boolean
    photo?: boolean
  }
  extraNotes?: string[]
}

export const countryRules: Record<CountryKey, CountryRule> = {
  Benin: {
    name: 'Bénin',
    countryKey: 'Benin',
    showPhoto: true,
    signatureRequise: true,
    photoRecommended: true,
    recommendedPages: '1 à 2 pages',
    sections: [
      'Coordonnées',
      'Profil',
      'Expériences',
      'Formation',
      'Compétences',
      'Langues',
      'Centres d\'intérêt',
    ],
    hiddenFields: {
      dateOfBirth: false,
      familyStatus: false,
      nationality: false,
      age: false,
    },
  },
  France: {
    name: 'France',
    countryKey: 'France',
    showPhoto: true,
    signatureRequise: false,
    photoRecommended: false,
    recommendedPages: '1 à 2 pages',
    sections: [
      'Coordonnées',
      'Profil',
      'Expériences',
      'Formation',
      'Compétences',
      'Langues',
      'Centres d\'intérêt',
    ],
    hiddenFields: {
      dateOfBirth: true,
      familyStatus: true,
    },
    extraNotes: [
      'Profil en haut',
      'Ne pas afficher date de naissance ni situation familiale',
    ],
  },
  Canada: {
    name: 'Canada',
    countryKey: 'Canada',
    showPhoto: false,
    signatureRequise: false,
    recommendedPages: '1 à 2 pages',
    sections: [
      'Coordonnées',
      'Profil',
      'Expériences',
      'Formation',
      'Compétences',
      'Langues',
      'Centres d\'intérêt',
      'Références',
    ],
    hiddenFields: {
      dateOfBirth: true,
      familyStatus: true,
      nationality: true,
      age: true,
      photo: true,
    },
    extraNotes: [
      'PAS de photo, PAS de date de naissance, PAS d\'âge, PAS de situation familiale, PAS de nationalité',
      'Format résumé orienté résultats',
      'Références disponibles sur demande',
    ],
  },
  Belgique: {
    name: 'Belgique',
    countryKey: 'Belgique',
    showPhoto: true,
    signatureRequise: false,
    photoRecommended: false,
    recommendedPages: '1 à 2 pages',
    sections: [
      'Coordonnées',
      'Profil',
      'Expériences',
      'Formation',
      'Compétences',
      'Langues',
      'Centres d\'intérêt',
    ],
    hiddenFields: {
      dateOfBirth: true,
      familyStatus: true,
    },
    extraNotes: [
      'Ton concis',
      'Photo optionnelle',
    ],
  },
  Suisse: {
    name: 'Suisse',
    countryKey: 'Suisse',
    showPhoto: true,
    signatureRequise: true,
    photoRecommended: true,
    recommendedPages: '2 à 3 pages',
    sections: [
      'Coordonnées',
      'Profil',
      'Expériences',
      'Formation',
      'Compétences',
      'Langues',
      'Centres d\'intérêt',
      'Lettre de motivation',
    ],
    hiddenFields: {
      dateOfBirth: false,
      familyStatus: false,
      nationality: false,
    },
    extraNotes: [
      'Photo attendue',
      'Peut inclure date de naissance et nationalité',
      'CV détaillé',
    ],
  },
}
