import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import { CVDraft } from './cvTypes'
import { CountryRule } from './countryRules'
import { PaletteKey } from './cvTemplates'

const paletteStyles: Record<PaletteKey, {
  accent: string
  heading: string
  background: string
  panel: string
  text: string
  stripe: string
}> = {
  bleu: {
    accent: '#1E3A5F',
    heading: '#1E3A5F',
    background: '#F8FAFC',
    panel: '#FFFFFF',
    text: '#1F2937',
    stripe: '#E8963A',
  },
  emeraude: {
    accent: '#064E3B',
    heading: '#064E3B',
    background: '#ECFDF5',
    panel: '#FFFFFF',
    text: '#0F172A',
    stripe: '#D97706',
  },
  bordeaux: {
    accent: '#7C1D37',
    heading: '#7C1D37',
    background: '#F3F4F6',
    panel: '#FFFFFF',
    text: '#111827',
    stripe: '#6B7280',
  },
  indigo: {
    accent: '#312E81',
    heading: '#312E81',
    background: '#EEF2FF',
    panel: '#FFFFFF',
    text: '#111827',
    stripe: '#D97706',
  },
  sable: {
    accent: '#92400E',
    heading: '#92400E',
    background: '#FFFBEB',
    panel: '#FFFFFF',
    text: '#1F2937',
    stripe: '#6B7280',
  },
}

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontSize: 11,
    fontFamily: 'Helvetica',
    lineHeight: 1.4,
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  hero: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 11,
    color: '#475569',
    marginTop: 4,
  },
  sectionTitle: {
    marginTop: 14,
    marginBottom: 6,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  text: {
    fontSize: 10,
    color: '#334155',
  },
  smallText: {
    fontSize: 9,
    color: '#475569',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  badge: {
    padding: 4,
    borderRadius: 4,
    fontSize: 9,
    color: '#0f172a',
    marginRight: 4,
    marginBottom: 4,
  },
  divider: {
    width: '100%',
    height: 2,
    marginTop: 4,
    marginBottom: 8,
  },
  section: {
    marginTop: 10,
    marginBottom: 12,
  },
  photo: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  photoWrapper: {
    marginLeft: 10,
  },
  pillar: {
    width: 100,
    borderRadius: 12,
    padding: 10,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroInfo: {
    flex: 1,
  },
})

const renderSection = (section: string, draft: CVDraft, countryRule: CountryRule, palette: PaletteKey) => {
  const paletteStyle = paletteStyles[palette]
  const formatDate = (value: string) => (value ? value : 'Actuel')

  switch (section) {
    case 'Coordonnées':
      return null
    case 'Profil':
      return (
        <View style={styles.section} key={section}>
          <Text style={[styles.sectionTitle, { color: paletteStyle.heading }]}>{section}</Text>
          <View style={[styles.divider, { backgroundColor: paletteStyle.stripe }]} />
          <Text style={styles.text}>{draft.personalProfile || 'Rédigez un profil clair et percutant sur votre expérience et vos objectifs.'}</Text>
        </View>
      )
    case 'Expériences':
      return (
        <View style={styles.section} key={section}>
          <Text style={[styles.sectionTitle, { color: paletteStyle.heading }]}>{section}</Text>
          <View style={[styles.divider, { backgroundColor: paletteStyle.stripe }]} />
          {draft.experiences.filter(exp => exp.title || exp.company).map(exp => (
            <View key={exp.id} style={{ marginBottom: 8 }}>
              <View style={styles.row}>
                <Text style={[styles.text, { fontWeight: 'bold' }]}>{exp.title || 'Intitulé de poste'}</Text>
                <Text style={styles.smallText}>{formatDate(exp.startDate)} – {exp.endDate || 'Présent'}</Text>
              </View>
              <Text style={styles.smallText}>{exp.company || 'Entreprise'} • {exp.location || 'Lieu'}</Text>
              <Text style={styles.text}>{exp.description || 'Description de la mission, réalisations et résultats.'}</Text>
            </View>
          ))}
        </View>
      )
    case 'Formation':
      return (
        <View style={styles.section} key={section}>
          <Text style={[styles.sectionTitle, { color: paletteStyle.heading }]}>Formation</Text>
          <View style={[styles.divider, { backgroundColor: paletteStyle.stripe }]} />
          {draft.education.filter(ed => ed.degree || ed.institution).map(ed => (
            <View key={ed.id} style={{ marginBottom: 8 }}>
              <View style={styles.row}>
                <Text style={styles.text}>{ed.degree || 'Diplôme'}</Text>
                <Text style={styles.smallText}>{formatDate(ed.startDate)} – {ed.endDate || 'Présent'}</Text>
              </View>
              <Text style={styles.smallText}>{ed.institution || 'Établissement'} • {ed.location || 'Lieu'}</Text>
            </View>
          ))}
        </View>
      )
    case 'Compétences':
      return (
        <View style={styles.section} key={section}>
          <Text style={[styles.sectionTitle, { color: paletteStyle.heading }]}>Compétences</Text>
          <View style={[styles.divider, { backgroundColor: paletteStyle.stripe }]} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
            {draft.skills.filter(Boolean).map((skill, index) => (
              <Text key={`${skill}-${index}`} style={[styles.badge, { backgroundColor: paletteStyle.accent, color: '#FFFFFF' }]}>{skill}</Text>
            ))}
          </View>
        </View>
      )
    case 'Langues':
      return (
        <View style={styles.section} key={section}>
          <Text style={[styles.sectionTitle, { color: paletteStyle.heading }]}>Langues</Text>
          <View style={[styles.divider, { backgroundColor: paletteStyle.stripe }]} />
          {draft.languages.filter(lang => lang.language).map(lang => (
            <Text key={lang.id} style={styles.text}>{lang.language} — {lang.level || 'Niveau'}</Text>
          ))}
        </View>
      )
    case 'Centres d\'intérêt':
      return (
        <View style={styles.section} key={section}>
          <Text style={[styles.sectionTitle, { color: paletteStyle.heading }]}>Centres d'intérêt</Text>
          <View style={[styles.divider, { backgroundColor: paletteStyle.stripe }]} />
          <Text style={styles.text}>{draft.interests || 'Listez quelques centres d\'intérêt pour apporter une touche personnelle.'}</Text>
        </View>
      )
    case 'Références':
      return (
        <View style={styles.section} key={section}>
          <Text style={[styles.sectionTitle, { color: paletteStyle.heading }]}>Références</Text>
          <View style={[styles.divider, { backgroundColor: paletteStyle.stripe }]} />
          <Text style={styles.text}>Références disponibles sur demande.</Text>
        </View>
      )
    default:
      return null
  }
}

export const createPdfDocument = (draft: CVDraft, countryRule: CountryRule, palette: PaletteKey) => {
  const paletteStyle = paletteStyles[palette] ?? paletteStyles.bleu

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <View style={[styles.hero, { backgroundColor: paletteStyle.panel, borderColor: paletteStyle.accent, borderWidth: 1 }]}>          
          <View style={[styles.heroRow, { backgroundColor: paletteStyle.accent, borderRadius: 10, padding: 12 }]}>            
            <View style={styles.heroInfo}>
              <Text style={[styles.title, { color: '#ffffff' }]}>{draft.identity.firstName || 'Prénom'} {draft.identity.lastName || 'Nom'}</Text>
              <Text style={[styles.subtitle, { color: '#f8fafc', marginTop: 4 }]}>{draft.targetJob || 'Poste visé'}</Text>
              <Text style={[styles.smallText, { color: '#f8fafc', marginTop: 8 }]}>{draft.contact.email || 'email@exemple.com'}</Text>
              <Text style={[styles.smallText, { color: '#f8fafc' }]}>{draft.contact.phone || '+33 6 00 00 00 00'}</Text>
              <Text style={[styles.smallText, { color: '#f8fafc' }]}>{draft.contact.location || 'Ville, Pays'}</Text>
            </View>
            {countryRule.showPhoto && draft.identity.photoDataUrl ? (
              <View style={styles.photoWrapper}>
                <Image style={styles.photo} src={draft.identity.photoDataUrl} />
              </View>
            ) : null}
          </View>
        </View>

        {countryRule.sections.map(section => renderSection(section, draft, countryRule, palette))}
        {countryRule.signatureRequise && draft.signatureDataUrl ? (
          <View style={{ marginTop: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e2e8f0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={[styles.smallText, { color: paletteStyle.text, marginBottom: 8 }]}>Fait à {draft.signatureLocation || draft.contact.location || 'Ville'}, le {draft.signatureDate ? new Date(draft.signatureDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Date'}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.smallText, { color: paletteStyle.text, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }]}>Signature</Text>
              <Image style={{ width: 140, height: 54 }} src={draft.signatureDataUrl} />
            </View>
          </View>
        ) : null}
      </Page>
    </Document>
  )
}
