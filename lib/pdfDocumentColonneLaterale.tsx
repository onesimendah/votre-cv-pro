import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import { CVDraft } from './cvTypes'
import { CountryRule } from './countryRules'
import { PaletteKey } from './cvTemplates'
import { paletteStyles } from './pdfDocument'

const SIDEBAR_WIDTH = 170

const SIDEBAR_SECTIONS = ['Compétences', 'Langues', 'Centres d\'intérêt']

const styles = StyleSheet.create({
  page: {
    fontSize: 10,
    fontFamily: 'Helvetica',
    lineHeight: 1.4,
    backgroundColor: '#ffffff',
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    padding: 20,
  },
  main: {
    marginLeft: SIDEBAR_WIDTH,
    padding: 26,
  },
  photo: {
    width: 78,
    height: 78,
    borderRadius: 39,
    marginBottom: 16,
    alignSelf: 'center',
  },
  sidebarBlock: {
    marginBottom: 18,
  },
  sidebarHeading: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: '#ffffff',
    marginBottom: 6,
  },
  sidebarDivider: {
    width: 32,
    height: 1.5,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginBottom: 8,
  },
  sidebarText: {
    fontSize: 8.5,
    color: 'rgba(255,255,255,0.92)',
    marginBottom: 4,
    lineHeight: 1.4,
    maxWidth: 130,
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
    flexShrink: 1,
  },
  categoryName: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  pill: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    color: '#ffffff',
    fontSize: 8,
    borderRadius: 3,
    paddingVertical: 3,
    paddingHorizontal: 6,
    marginRight: 4,
    marginBottom: 4,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  jobTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  tagline: {
    fontSize: 9,
    fontStyle: 'italic',
    color: '#64748b',
    marginTop: 6,
    marginBottom: 6,
  },
  sectionTitle: {
    marginTop: 11,
    marginBottom: 4,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  divider: {
    width: 40,
    height: 2,
    marginBottom: 6,
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
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  bullet: {
    fontSize: 10,
    fontWeight: 'bold',
    marginRight: 5,
  },
  techLine: {
    fontSize: 8.5,
    fontStyle: 'italic',
    color: '#64748b',
    marginTop: 2,
  },
  expBlock: {
    marginBottom: 10,
  },
})

const parseSkillList = (value: string) => value.split(',').map(item => item.trim()).filter(Boolean)
const descriptionLines = (description: string) => {
  const lines = description.split('\n').map(line => line.trim()).filter(Boolean)
  return lines.length ? lines : ['Description de la mission, réalisations et résultats.']
}
const formatDate = (value: string) => (value ? value : 'Actuel')

const renderMainSection = (section: string, draft: CVDraft, paletteStyle: typeof paletteStyles[PaletteKey]) => {
  switch (section) {
    case 'Profil':
      return (
        <View key={section}>
          <Text style={[styles.sectionTitle, { color: paletteStyle.heading }]}>Profil</Text>
          <View style={[styles.divider, { backgroundColor: paletteStyle.stripe }]} />
          <Text style={styles.text}>{draft.personalProfile || 'Rédigez un profil clair et percutant sur votre expérience et vos objectifs.'}</Text>
        </View>
      )
    case 'Expériences':
      return (
        <View key={section}>
          <Text style={[styles.sectionTitle, { color: paletteStyle.heading }]}>Expérience</Text>
          <View style={[styles.divider, { backgroundColor: paletteStyle.stripe }]} />
          {draft.experiences.filter(exp => exp.title || exp.company).map(exp => (
            <View key={exp.id} style={styles.expBlock}>
              <View style={styles.row}>
                <Text style={[styles.text, { fontWeight: 'bold' }]}>{exp.title || 'Intitulé de poste'}</Text>
                <Text style={styles.smallText}>{formatDate(exp.startDate)} – {exp.endDate || 'Présent'}</Text>
              </View>
              <Text style={[styles.smallText, { marginBottom: 3 }]}>{exp.company || 'Entreprise'} • {exp.location || 'Lieu'}</Text>
              {descriptionLines(exp.description).map((line, index) => (
                <View key={index} style={styles.bulletRow}>
                  <Text style={[styles.bullet, { color: paletteStyle.accent }]}>›</Text>
                  <Text style={[styles.text, { flex: 1 }]}>{line}</Text>
                </View>
              ))}
              {exp.technologies.trim() && (
                <Text style={styles.techLine}>{exp.technologies}</Text>
              )}
            </View>
          ))}
        </View>
      )
    case 'Formation':
      return (
        <View key={section}>
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
    case 'Références':
      return (
        <View key={section}>
          <Text style={[styles.sectionTitle, { color: paletteStyle.heading }]}>Références</Text>
          <View style={[styles.divider, { backgroundColor: paletteStyle.stripe }]} />
          <Text style={styles.text}>Références disponibles sur demande.</Text>
        </View>
      )
    default:
      return null
  }
}

export const createColonneLateralePdfDocument = (draft: CVDraft, countryRule: CountryRule, palette: PaletteKey) => {
  const paletteStyle = paletteStyles[palette] ?? paletteStyles.bleu
  const mainSections = countryRule.sections.filter(section => !SIDEBAR_SECTIONS.includes(section) && section !== 'Coordonnées')
  const hasSkillCategories = draft.skillCategories.some(cat => cat.name || cat.skills)
  const tagline = draft.personalProfile
    ? draft.personalProfile.split(/(?<=[.!?])\s+/)[0]
    : 'Ajoutez une ligne d\'accroche percutante pour résumer votre profil.'

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <View fixed style={[styles.sidebar, { backgroundColor: paletteStyle.accent }]}>
          {countryRule.showPhoto && draft.identity.photoDataUrl ? (
            <Image style={styles.photo} src={draft.identity.photoDataUrl} />
          ) : null}

          <View style={[styles.sidebarBlock, { maxWidth: 130 }] }>
            <Text style={styles.sidebarHeading}>Contact</Text>
            <View style={styles.sidebarDivider} />
            <Text style={styles.sidebarText}>{draft.contact.email || 'email@exemple.com'}</Text>
            <Text style={styles.sidebarText}>{draft.contact.phone || '+33 6 00 00 00 00'}</Text>
            <Text style={styles.sidebarText}>{draft.contact.location || 'Ville, Pays'}</Text>
            {draft.contact.linkedin ? <Text style={styles.sidebarText}>LinkedIn : {draft.contact.linkedin}</Text> : null}
            {draft.contact.portfolio ? <Text style={styles.sidebarText}>Portfolio : {draft.contact.portfolio}</Text> : null}
          </View>

          {countryRule.sections.includes('Compétences') && (
            <View style={styles.sidebarBlock}>
              <Text style={styles.sidebarHeading}>Compétences</Text>
              <View style={styles.sidebarDivider} />
              {hasSkillCategories ? (
                draft.skillCategories.filter(cat => cat.name || cat.skills).map(cat => (
                  <View key={cat.id} style={{ marginBottom: 8 }}>
                    <Text style={styles.categoryName}>{cat.name || 'Catégorie'}</Text>
                    <View style={styles.pillRow}>
                      {parseSkillList(cat.skills).map((skill, index) => (
                        <Text key={`${skill}-${index}`} style={styles.pill}>{skill}</Text>
                      ))}
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.pillRow}>
                  {draft.skills.filter(Boolean).map((skill, index) => (
                    <Text key={`${skill}-${index}`} style={styles.pill}>{skill}</Text>
                  ))}
                </View>
              )}
            </View>
          )}

          {countryRule.sections.includes('Langues') && (
            <View style={styles.sidebarBlock}>
              <Text style={styles.sidebarHeading}>Langues</Text>
              <View style={styles.sidebarDivider} />
              {draft.languages.filter(lang => lang.language).map(lang => (
                <Text key={lang.id} style={styles.sidebarText}>{lang.language} — {lang.level || 'Niveau'}</Text>
              ))}
            </View>
          )}

          {countryRule.sections.includes('Centres d\'intérêt') && (
            <View style={styles.sidebarBlock}>
              <Text style={styles.sidebarHeading}>Centres d'intérêt</Text>
              <View style={styles.sidebarDivider} />
              <Text style={styles.sidebarText}>{draft.interests || 'Listez quelques centres d\'intérêt pour apporter une touche personnelle.'}</Text>
            </View>
          )}
        </View>

        <View style={styles.main}>
          <Text style={styles.name}>{draft.identity.firstName || 'Prénom'} {draft.identity.lastName || 'Nom'}</Text>
          <Text style={[styles.jobTitle, { color: paletteStyle.heading }]}>{draft.targetJob || 'Poste visé'}</Text>
          <Text style={styles.tagline}>{tagline}</Text>

          {mainSections.map(section => renderMainSection(section, draft, paletteStyle))}

          {countryRule.signatureRequise && draft.signatureDataUrl ? (
            <View wrap={false} style={{ marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#e2e8f0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={[styles.smallText, { marginBottom: 6 }]}>Fait à {draft.signatureLocation || draft.contact.location || 'Ville'}, le {draft.signatureDate ? new Date(draft.signatureDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Date'}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.smallText, { marginBottom: 3, textTransform: 'uppercase', letterSpacing: 1 }]}>Signature</Text>
                <Image style={{ width: 130, height: 46 }} src={draft.signatureDataUrl} />
              </View>
            </View>
          ) : null}
        </View>
      </Page>
    </Document>
  )
}
