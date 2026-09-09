import {defineMigration, set} from 'sanity/migrate'

const PROJECT_STRING_FIELDS = new Set(['caption', 'subcaption', 'role'])

const TRANSLATIONS: Record<string, string> = {
  '3D Image Generation': '3D-Bildgenerierung',
  'Animation and Interaction Design': 'Animation und Interaktionsdesign',
  Client: 'Kunde',
  'Client Direction': 'Kundenbetreuung',
  'Creative Direction': 'Creative Direction',
  Design: 'Design',
  Development: 'Entwicklung',
  Documentation: 'Dokumentation',
  'Exhibition Production and Curation': 'Ausstellungsproduktion und Kuration',
  'Graphic Design': 'Grafikdesign',
  'Interaction Design & Animation': 'Interaktionsdesign und Animation',
  'Interaction Design and Animation': 'Interaktionsdesign und Animation',
  'Motion Design': 'Motion Design',
  Photography: 'Fotografie',
  '3D Imagery used for the Poster by Alice Vink':
    '3D-Bildmaterial für das Poster von Alice Vink',
  'Printed showcase revealing a shifting landscape depending on the viewer’s angle':
    'Gedruckter Showcase, der je nach Blickwinkel eine wechselnde Landschaft sichtbar macht',
  'Print Production': 'Druckproduktion',
  'Project Manager': 'Projektmanagement',
  'Showcase outside Bergse Linker Rottekade 7, 3056 LA Rotterdam':
    'Showcase vor Bergse Linker Rottekade 7, 3056 LA Rotterdam',
  'Showcase outside Vijverhofstraat 15, 3032 SB Rotterdam.':
    'Showcase vor der Vijverhofstraat 15, 3032 SB Rotterdam.',
  'Showcase outside Zomerhofstraat, 3032 SB Rotterdam':
    'Showcase vor der Zomerhofstraat, 3032 SB Rotterdam',
  'Social Strategy': 'Social-Media-Strategie',
  'Switching from left to right, color and background invert through the reflecting light':
    'Beim Wechsel von links nach rechts invertieren Farbe und Hintergrund durch das reflektierte Licht',
  'The printing process': 'Der Druckprozess',
  'Typographic close-up': 'Typografische Nahaufnahme',
  '"The Zooms" on display at Minus One, Nieuwe Instituut, Rotterdam.':
    '"The Zooms" ausgestellt bei Minus One, Nieuwe Instituut, Rotterdam.',
  'A comprehensive view of all glyphs': 'Eine umfassende Ansicht aller Glyphen',
  "A view of the site's home page, displaying all rugs in an adjustable rotating grid":
    'Ansicht der Startseite, auf der alle Teppiche in einem anpassbaren rotierenden Raster angezeigt werden',
  'Article showcase for an interview with Wolfgang Tillmans':
    'Artikelansicht für ein Interview mit Wolfgang Tillmans',
  'Information screens alternate between prompts, activating the visitor to interact with the space.':
    'Informationsbildschirme wechseln zwischen Impulsen und regen Besucher:innen dazu an, mit dem Raum zu interagieren.',
  'Introduction reel ': 'Einführungsreel ',
  'Recording of a temporary landing page featuring live interaction graphics.':
    'Aufzeichnung einer temporären Landingpage mit interaktiven Live-Grafiken.',
  'Rotterdam, June 2026': 'Rotterdam, Juni 2026',
  'Showcase presenting the evolving visual identity and motion system developed for the gallery, bringing together exhibition displays, resident introductions, and the workshop lineup throughout the space.':
    'Showcase der weiterentwickelten visuellen Identität und des Motion-Systems für die Galerie, das Ausstellungsdisplays, Resident-Vorstellungen und das Workshop-Programm im Raum zusammenführt.',
  'Single letter showcase, reactive to cursor position.':
    'Einzelbuchstaben-Showcase, der auf die Cursorposition reagiert.',
  'The complete character set, displayed on a custom built showcase website.':
    'Der vollständige Zeichensatz, präsentiert auf einer eigens entwickelten Showcase-Website.',
  'The cursive axis, linked to the tilt sensors of a MacBook Pro.':
    'Die Kursivachse, verknüpft mit den Neigungssensoren eines MacBook Pro.',
  "The gallery's entrance screen, showcasing the visual system":
    'Der Eingangsscreen der Galerie zeigt das visuelle System',
  "The identity's warped characteristic is derived from the round glass room, often used as a projection space, bending the original image in the space.":
    'Die verzerrte Charakteristik der Identität leitet sich vom runden Glasraum ab, der oft als Projektionsraum genutzt wird und das ursprüngliche Bild im Raum biegt.',
  'The physical edition of P.IN.E.A 001. Designed by Verena Panholzer, Studio Es.':
    'Die physische Ausgabe von P.IN.E.A 001. Gestaltet von Verena Panholzer, Studio Es.',
  'Work display accompanied by wayfinding.': 'Arbeitspräsentation, begleitet von Wayfinding.',
}

function translateString(value: string) {
  return TRANSLATIONS[value] || value
}

function toInternationalizedString(value: string, keyPrefix: string) {
  return [
    {
      _key: `${keyPrefix}_en`,
      _type: 'internationalizedArrayStringValue',
      language: 'en',
      value,
    },
    {
      _key: `${keyPrefix}_de`,
      _type: 'internationalizedArrayStringValue',
      language: 'de',
      value: translateString(value),
    },
  ]
}

export default defineMigration({
  title: 'Internationalize project captions and credit roles',
  documentTypes: ['project'],
  migrate: {
    string(node, path) {
      const fieldName = path.at(-1)

      if (typeof fieldName !== 'string' || !PROJECT_STRING_FIELDS.has(fieldName) || !node.trim()) return

      return set(toInternationalizedString(node, fieldName))
    },
  },
})
