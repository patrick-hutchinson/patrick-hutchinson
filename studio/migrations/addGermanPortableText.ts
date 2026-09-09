import {defineMigration, set} from 'sanity/migrate'

const PORTABLE_TEXT_FIELDS = new Set(['description', 'selectedClients'])

const TRANSLATIONS: Record<string, string> = {
  'Patrick Hutchinson is an independent graphic designer and creative developer currently based in Freiburg, Germany. Operating at the intersection of design and technology, his practice combines typography, development, 3D, and animation to create coherent visual languages that extend across print, spatial environments, and the web. Alongside commissioned work, Patrick maintains an ongoing interest in typography, generative design, creative coding, and emerging web technologies. As well as ongoing research into digital culture, ethical technology, copyright legislation and the educative arts.':
    'Patrick Hutchinson ist ein unabhängiger Grafikdesigner und Creative Developer, derzeit in Freiburg, Deutschland. An der Schnittstelle von Design und Technologie verbindet seine Praxis Typografie, Entwicklung, 3D und Animation, um kohärente visuelle Sprachen zu schaffen, die sich über Print, räumliche Umgebungen und das Web erstrecken. Neben Auftragsarbeiten verfolgt Patrick ein kontinuierliches Interesse an Typografie, generativem Design, Creative Coding und neuen Webtechnologien sowie an Forschung zu digitaler Kultur, ethischer Technologie, Urheberrechtsgesetzgebung und vermittelnden künstlerischen Praktiken.',
  'His work spans cultural institutions, publishers, artists, research initiatives, and commercial clients, notably the Nieuwe Instituut (Museum for Architecture, Design and Digital Culture), Rotterdam, Royal Academy of Art (The Hague), Diagonale (Festival of Austrian Film), Graz and DesignAustria, Vienna.':
    'Seine Arbeit umfasst kulturelle Institutionen, Verlage, Künstler:innen, Forschungsinitiativen und kommerzielle Kund:innen, darunter insbesondere das Nieuwe Instituut (Museum for Architecture, Design and Digital Culture), Rotterdam, die Royal Academy of Art (The Hague), die Diagonale (Festival des österreichischen Films), Graz, und DesignAustria, Wien.',
  'Patrick Hutchinson is an independent graphic designer and creative coder currently based in Freiburg im Breisgau, DE. Operating at the intersection of design and technology, his practice combines typography, generative programming, 3D modelling, and animation to create coherent visual systems that extend across print, spatial environments, and the screen.':
    'Patrick Hutchinson ist ein unabhängiger Grafikdesigner und Creative Coder, derzeit in Freiburg im Breisgau, DE. An der Schnittstelle von Design und Technologie verbindet seine Praxis Typografie, generative Programmierung, 3D-Modellierung und Animation, um kohärente visuelle Systeme zu schaffen, die sich über Print, räumliche Umgebungen und den Bildschirm erstrecken.',
  'His research-based work has been recognised across awards, exhibitions, public lecturing, and funding contexts, including The Best Dutch Book Designs ‘22 and Dutch Design Yearbook ‘23-‘24; ':
    'Seine forschungsbasierte Arbeit wurde in Auszeichnungen, Ausstellungen, öffentlichen Vorträgen und Förderkontexten anerkannt, darunter The Best Dutch Book Designs ‘22 und Dutch Design Yearbook ‘23-‘24; ',
  'Season Three': 'Season Three',
  ', Minus One Space for Digital Culture ': ', Minus One Space for Digital Culture ',
  'Rotterdam, NL': 'Rotterdam, NL',
  ' and ': ' und ',
  'The Hmm @ 4 locations': 'The Hmm @ 4 locations',
  'Amsterdam, NL': 'Amsterdam, NL',
  '; Desina Festival ': '; Desina Festival ',
  'Naples, IT': 'Neapel, IT',
  ' and the NADD Open Day ': ' und der NADD Open Day ',
  'Rotterdam,': 'Rotterdam,',
  'NL': 'NL',
  '; and Stimuleringsfonds.\nSimultaneously, his client-focused practice spans cultural institutions, publishers, artists, research initiatives, and commercial work, including\nHet Nieuwe Instituut–Museum for Architecture, Design and Digital Culture ':
    '; und Stimuleringsfonds.\nGleichzeitig umfasst seine kundenorientierte Praxis kulturelle Institutionen, Verlage, Künstler:innen, Forschungsinitiativen und kommerzielle Arbeiten, darunter\nHet Nieuwe Instituut–Museum for Architecture, Design and Digital Culture ',
  '\nDesignAustria ': '\nDesignAustria ',
  'Vienna, AT': 'Wien, AT',
  ', Diagonale–Festival of Austrian Film ': ', Diagonale–Festival des österreichischen Films ',
  'Graz, AT': 'Graz, AT',
  '\nthe Royal Academy of Art, KABK ': '\ndie Royal Academy of Art, KABK ',
  'The Hague, NL': 'Den Haag, NL',
  ', P.IN.E.A Periodical ': ', P.IN.E.A Periodical ',
  ',\nProject Solomon ': ',\nProject Solomon ',
  'Athens, GR': 'Athen, GR',
  ', and Möbius Design Studio ': ', und Möbius Design Studio ',
  'Dubai, AE': 'Dubai, AE',
  'Poster and Magazine Cover for Bergamo based fashion label 46° (46 GRADI / 46 DEGREES).':
    'Poster und Magazincover für das in Bergamo ansässige Modelabel 46° (46 GRADI / 46 DEGREES).',
  'The Festival of Austrian Film is an annual cinema festival spanning the theaters of Graz. Each year, the city is transformed by a distinctive visual system of stripes and patterns extending throughout its streets and cinemas. In collaboration with Studio Es, personal responsibilities included the design and production of the event’s motion graphics, as well as the development of applications including city banners, ticketing, and advertising.':
    'Das Festival des österreichischen Films ist ein jährlich stattfindendes Filmfestival, das sich über die Kinos von Graz erstreckt. Jedes Jahr wird die Stadt durch ein markantes visuelles System aus Streifen und Mustern verwandelt, das sich durch Straßen und Kinos zieht. In Zusammenarbeit mit Studio Es umfassten die eigenen Aufgaben die Gestaltung und Produktion der Motion Graphics des Festivals sowie die Entwicklung von Anwendungen wie Stadtbanner, Ticketing und Werbung.',
  'Interactive landing page for Sicilian graphic designer, creative director and animator Enrico Gisana. ':
    'Interaktive Landingpage für den sizilianischen Grafikdesigner, Creative Director und Animator Enrico Gisana. ',
  'The text on the page becomes more displaced the further the cursor travels from it, making the hovered text calm and legible.':
    'Der Text auf der Seite wird stärker verschoben, je weiter sich der Cursor von ihm entfernt, wodurch der berührte Text ruhig und lesbar bleibt.',
  'On mobile, the orientation sensors of the phone are used to distort based on tilt angles.':
    'Auf Mobilgeräten werden die Orientierungssensoren des Telefons genutzt, um die Verzerrung anhand der Neigungswinkel zu steuern.',
  'Studio website for Sicily-based graphic- and motion design agency "GG–OFFICE".':
    'Studio-Website für die in Sizilien ansässige Grafik- und Motion-Design-Agentur „GG–OFFICE“.',
  'The site opens with an interactive landing page based on one of the studio’s core animations. The About page introduces the team through a deliberately chaotic collective portrait of evermore aliens whizzing across the screen, while the Research section presents an endlessly scrollable archive of sketches, experiments, and unused material. The Work page brings together a curated selection of the studio’s projects, each coming with a customisable layout and a grid optimised for heavy video content.':
    'Die Seite eröffnet mit einer interaktiven Landingpage, die auf einer der zentralen Animationen des Studios basiert. Die About-Seite stellt das Team durch ein bewusst chaotisches Gruppenporträt immer neuer Aliens vor, die über den Bildschirm sausen, während der Research-Bereich ein endlos scrollbares Archiv aus Skizzen, Experimenten und ungenutztem Material präsentiert. Die Work-Seite bündelt eine kuratierte Auswahl der Studioprojekte, jeweils mit anpassbarem Layout und einem für umfangreiche Videoinhalte optimierten Raster.',
  'GG–RUGS is a carpet tufting service by GG–OFFICE. Keeping with the vibrant, squeaky design of the rugs themselves, the website offers a similar play on color, contrast and playfulness. \n\nBuilding on an early animation by Enrico Gisana, the identity was adapted into an interactive opening sequence that transforms the logotype into a fluffy, bouncy composition. The same sense of play extends throughout the site, from flipping product cards and toy pistols shooting across the screen to an infinitely animated background gradient and an unexpected cameo by Arnold Schwarzenegger himself.':
    'GG–RUGS ist ein Teppich-Tufting-Service von GG–OFFICE. In Anlehnung an das lebendige, quietschige Design der Teppiche selbst spielt die Website ebenfalls mit Farbe, Kontrast und Verspieltheit. \n\nAuf Grundlage einer frühen Animation von Enrico Gisana wurde die Identität zu einer interaktiven Eröffnungssequenz weiterentwickelt, die das Logo in eine flauschige, federnde Komposition verwandelt. Dieser spielerische Ansatz zieht sich durch die gesamte Seite, von umklappenden Produktkarten und Spielzeugpistolen, die über den Bildschirm schießen, bis hin zu einem endlos animierten Hintergrundverlauf und einem unerwarteten Cameo von Arnold Schwarzenegger persönlich.',
  'As a former resident of the -1 Digital Lab, we were invited to reimaginine the institute’s social presence: strategy, colors, movement, and atmosphere. ':
    'Als ehemalige Residents des -1 Digital Lab wurden wir eingeladen, die Social-Media-Präsenz der Institution neu zu denken: Strategie, Farben, Bewegung und Atmosphäre. ',
  'Part art laboratory, part exhibition space, -1 Digital Lab responds to the urgent need to address critical issues in digital culture, from the rapid advancement of AI and the reemergence of do-it-yourself technology to the inclusion of more diverse and alternative voices in computing.':
    'Teils Kunstlabor, teils Ausstellungsraum reagiert das -1 Digital Lab auf die dringende Notwendigkeit, kritische Fragen der digitalen Kultur zu verhandeln: vom rasanten Fortschritt der KI und dem Wiederaufleben von Do-it-yourself-Technologie bis hin zur Einbindung vielfältigerer und alternativer Stimmen im Computing.',
  'Poster for Rotterdam-based DJ-collective ': 'Poster für das in Rotterdam ansässige DJ-Kollektiv ',
  'NO FRIENDS': 'NO FRIENDS',
  ', hosting a club night at MONO Rotterdam featuring  Nikos ten Hoedt, Uncle George Electronics, and DirtyDMs.':
    ', das im MONO Rotterdam eine Clubnacht mit Nikos ten Hoedt, Uncle George Electronics und DirtyDMs veranstaltete.',
  'Produced using silver silkscreen ink on metallic paper, the design relies on the interaction between light, material, and viewpoint. Rather than presenting a fixed image, the poster continuously changes appearance, with colors and forms reflecting, inverting, or vanishing as the viewing angle shifts.':
    'Produziert mit silberner Siebdruckfarbe auf metallischem Papier, basiert das Design auf dem Zusammenspiel von Licht, Material und Blickwinkel. Statt ein festes Bild zu zeigen, verändert das Poster fortlaufend seine Erscheinung: Farben und Formen reflektieren, invertieren oder verschwinden, sobald sich der Betrachtungswinkel verschiebt.',
  'P.IN.E.A (Photography, Intermedia et Al.) is a Vienna-based platform and semiannual publication exploring contemporary photography and post-photographic practices.':
    'P.IN.E.A (Photography, Intermedia et Al.) ist eine in Wien ansässige Plattform und halbjährlich erscheinende Publikation, die zeitgenössische Fotografie und postfotografische Praktiken untersucht.',
  'The project involved developing a cohesive visual language across both the printed publication and its online editorial platform. Print content is expanded through interactive and animated digital experiences, including a custom homepage brush tool that paints with imagery from the publication. The platform features bespoke editorial layouts for interviews, reviews, and advertorials alongside news, open calls, and an integrated shop.':
    'Das Projekt umfasste die Entwicklung einer kohärenten visuellen Sprache für die gedruckte Publikation und ihre digitale Editorial-Plattform. Printinhalte werden durch interaktive und animierte digitale Erfahrungen erweitert, darunter ein eigens entwickeltes Pinselwerkzeug auf der Startseite, das mit Bildmaterial aus der Publikation malt. Die Plattform bietet maßgeschneiderte Editorial-Layouts für Interviews, Rezensionen und Advertorials sowie News, Open Calls und einen integrierten Shop.',
  'Founded in 1969, STEIM (Studio for Electro-Instrumental Music) was an independent Amsterdam-based laboratory dedicated to the research and development of experimental electronic instruments, sound art, and performance. A pioneer in live electronic music, the institution was forced to permanently close in 2020.':
    'Das 1969 gegründete STEIM (Studio for Electro-Instrumental Music) war ein unabhängiges Labor in Amsterdam, das sich der Forschung und Entwicklung experimenteller elektronischer Instrumente, Klangkunst und Performance widmete. Als Pionierinstitution der Live-Elektronik musste STEIM 2020 dauerhaft schließen.',
  'Driven by a belief that technology should serve artistic intent—not the other way around—STEIM developed an extraordinary range of bespoke instruments and interfaces. Often balancing somewhere between the ingenious and the absurd, these inventions embodied decades of technical expertise, experimentation, and an unwavering preference for customization over commercial convention.':
    'Getragen von der Überzeugung, dass Technologie der künstlerischen Absicht dienen sollte und nicht umgekehrt, entwickelte STEIM eine außergewöhnliche Bandbreite maßgeschneiderter Instrumente und Interfaces. Oft irgendwo zwischen genial und absurd angesiedelt, verkörperten diese Erfindungen Jahrzehnte technischer Expertise, Experimentierfreude und eine unbeirrbare Vorliebe für individuelle Anpassung statt kommerzieller Konvention.',
  'Rather than attempting to create a complete archive, the publication captures the spirit of an institution whose influence continues to shape experimental music and instrument design.':
    'Anstatt ein vollständiges Archiv anzustreben, fängt die Publikation den Geist einer Institution ein, deren Einfluss experimentelle Musik und Instrumentendesign bis heute prägt.',
  'Times New Variable is a self-initiated project that reimagines the classic typeface as a variable font. Expanding the traditional six-style family into a continuous four variable axes, it allows weight and italicisation to be adjusted with precision rather than limited to predefined styles. A fully custom backslant rendition was developed to enable interpolation in both directions.':
    'Times New Variable ist ein selbstinitiiertes Projekt, das die klassische Schriftfamilie als Variable Font neu interpretiert. Durch die Erweiterung der traditionellen Familie mit sechs Schnitten zu vier kontinuierlichen variablen Achsen lassen sich Strichstärke und Kursivierung präzise einstellen, statt auf vordefinierte Stile beschränkt zu sein. Eine vollständig eigens entwickelte Backslant-Variante ermöglicht die Interpolation in beide Richtungen.',
  'The result is a familiar typeface with a far broader expressive range, offering virtually unlimited stylistic combinations while remaining rooted in the proportions and character of the original.':
    'Das Ergebnis ist eine vertraute Schrift mit einem deutlich breiteren Ausdrucksspektrum, die nahezu unbegrenzte stilistische Kombinationen ermöglicht und zugleich in den Proportionen und im Charakter des Originals verankert bleibt.',
  'The font is available free of charge with attribution. Please get in touch to request access.':
    'Die Schrift ist bei Namensnennung kostenlos verfügbar. Bitte nimm Kontakt auf, um Zugang anzufragen.',
}

function translateText(text: string) {
  if (!text) return text
  return TRANSLATIONS[text] || text
}

function translatePortableText(value: unknown) {
  if (!Array.isArray(value)) return value

  return value.map((block) => ({
    ...block,
    _key: `de_${block._key}`,
    children: Array.isArray(block.children)
      ? block.children.map((child) => ({
          ...child,
          _key: `de_${child._key}`,
          text: translateText(child.text),
        }))
      : block.children,
  }))
}

export default defineMigration({
  title: 'Add German Portable Text translations',
  documentTypes: ['project', 'info'],
  migrate: {
    array(node, path) {
      const fieldName = typeof path[0] === 'string' ? path[0] : null

      if (!fieldName || path.length !== 1 || !PORTABLE_TEXT_FIELDS.has(fieldName)) return
      if (!Array.isArray(node)) return

      const hasGerman = node.some((item) => item?.language === 'de')
      const englishItem = node.find((item) => item?.language === 'en')

      if (hasGerman || !englishItem?.value) return

      return set([
        ...node,
        {
          _key: `de_${fieldName}`,
          _type: 'internationalizedArrayPortableTextValue',
          language: 'de',
          value: translatePortableText(englishItem.value),
        },
      ])
    },
  },
})
