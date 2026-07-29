export type TemplateKey = 'classique' | 'moderne'
export type PaletteKey = 'bleu' | 'emeraude' | 'bordeaux' | 'indigo' | 'sable'

export const cvModels: Array<{ key: TemplateKey; name: string; description: string }> = [
  {
    key: 'classique',
    name: 'Classique',
    description: 'Structure élégante et formelle avec hiérarchie claire.',
  },
  {
    key: 'moderne',
    name: 'Moderne',
    description: 'Design épuré et contemporain, idéal pour une présentation dynamique.',
  },
]

export const cvPalettes: Record<PaletteKey, {
  label: string
  accent: string
  accentBg: string
  heading: string
  panel: string
  highlight: string
  pdfAccent: string
  pdfHeading: string
  pdfPanel: string
  pdfBackground: string
  pdfText: string
  pdfStripe: string
}> = {
  bleu: {
    label: 'Bleu & ambre',
    accent: 'bg-slate-900 text-white',
    accentBg: 'bg-slate-900',
    heading: 'text-slate-900',
    panel: 'bg-slate-50',
    highlight: 'bg-amber-400',
    pdfAccent: '#1E3A5F',
    pdfHeading: '#1E3A5F',
    pdfPanel: '#F8FAFC',
    pdfBackground: '#FFFFFF',
    pdfText: '#1F2937',
    pdfStripe: '#E8963A',
  },
  emeraude: {
    label: 'Émeraude & or',
    accent: 'bg-emerald-800 text-white',
    accentBg: 'bg-emerald-800',
    heading: 'text-emerald-800',
    panel: 'bg-emerald-50',
    highlight: 'bg-amber-400',
    pdfAccent: '#064E3B',
    pdfHeading: '#064E3B',
    pdfPanel: '#ECFDF5',
    pdfBackground: '#FFFFFF',
    pdfText: '#0F172A',
    pdfStripe: '#D97706',
  },
  bordeaux: {
    label: 'Bordeaux & gris',
    accent: 'bg-rose-900 text-white',
    accentBg: 'bg-rose-900',
    heading: 'text-rose-900',
    panel: 'bg-slate-100',
    highlight: 'bg-slate-400',
    pdfAccent: '#7C1D37',
    pdfHeading: '#7C1D37',
    pdfPanel: '#F3F4F6',
    pdfBackground: '#FFFFFF',
    pdfText: '#111827',
    pdfStripe: '#6B7280',
  },
  indigo: {
    label: 'Indigo & cuivre',
    accent: 'bg-indigo-900 text-white',
    accentBg: 'bg-indigo-900',
    heading: 'text-indigo-900',
    panel: 'bg-slate-50',
    highlight: 'bg-amber-500',
    pdfAccent: '#312E81',
    pdfHeading: '#312E81',
    pdfPanel: '#EEF2FF',
    pdfBackground: '#FFFFFF',
    pdfText: '#111827',
    pdfStripe: '#D97706',
  },
  sable: {
    label: 'Sable & brun',
    accent: 'bg-amber-900 text-white',
    accentBg: 'bg-amber-900',
    heading: 'text-amber-900',
    panel: 'bg-amber-50',
    highlight: 'bg-slate-400',
    pdfAccent: '#92400E',
    pdfHeading: '#92400E',
    pdfPanel: '#FFFBEB',
    pdfBackground: '#FFFFFF',
    pdfText: '#1F2937',
    pdfStripe: '#6B7280',
  },
}
