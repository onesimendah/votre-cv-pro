import { CountryKey } from './countryRules'

export type CVExperience = {
  id: string
  title: string
  company: string
  location: string
  startDate: string
  endDate: string
  description: string
  technologies: string
}

export type CVEducation = {
  id: string
  degree: string
  institution: string
  location: string
  startDate: string
  endDate: string
}

export type CVLanguage = {
  id: string
  language: string
  level: string
}

export type CVSkillCategory = {
  id: string
  name: string
  skills: string
}

export type CVDraft = {
  country: CountryKey
  targetJob: string
  personalProfile: string
  identity: {
    firstName: string
    lastName: string
    photoDataUrl?: string
  }
  signatureDataUrl?: string
  signatureLocation: string
  signatureDate: string
  contact: {
    email: string
    phone: string
    location: string
    linkedin: string
    portfolio: string
  }
  dateOfBirth: string
  nationality: string
  familyStatus: string
  experiences: CVExperience[]
  education: CVEducation[]
  skills: string[]
  skillCategories: CVSkillCategory[]
  languages: CVLanguage[]
  interests: string
  model: 'classique' | 'moderne' | 'colonne-laterale'
  palette: 'bleu' | 'emeraude' | 'bordeaux' | 'indigo' | 'sable'
}

export const emptyDraft: CVDraft = {
  country: 'France',
  targetJob: '',
  personalProfile: '',
  identity: {
    firstName: '',
    lastName: '',
    photoDataUrl: undefined,
  },
  signatureDataUrl: undefined,
  signatureLocation: '',
  signatureDate: '',
  contact: {
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    portfolio: '',
  },
  dateOfBirth: '',
  nationality: '',
  familyStatus: '',
  experiences: [
    {
      id: 'exp-1',
      title: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      description: '',
      technologies: '',
    },
  ],
  education: [
    {
      id: 'edu-1',
      degree: '',
      institution: '',
      location: '',
      startDate: '',
      endDate: '',
    },
  ],
  skills: ['', ''],
  skillCategories: [],
  languages: [
    {
      id: 'lang-1',
      language: '',
      level: '',
    },
  ],
  interests: '',
  model: 'classique',
  palette: 'bleu',
}
