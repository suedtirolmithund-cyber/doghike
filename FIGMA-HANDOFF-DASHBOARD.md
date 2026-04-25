# DogHike Dashboard Figma Handoff

## Ziel
Dashboard-Screen aus dem aktuellen Code in die Figma-Datei `DogHike – Onboarding Varianten` übernehmen.

## Screen-Name
`Dashboard`

## Layout-Richtung
- Desktop-first Hauptbreite: `max-w-7xl`
- Mobile mit Bottom-Navigation
- Hintergrund: sehr helles Verlaufslayout von `stone-50` über `white` nach `slate-50`

## Hauptbereiche
1. Hero
2. Suche
3. Statistik
4. Übersichtskarte
5. Tourenliste

## 1. Hero
- Volle Breite
- Hintergrundbild: `/splash/autumn-hero.jpg`
- Bildposition: `60% 75%`
- Dunkler Overlay-Verlauf von `slate-900/70` zu `slate-900/50` nach unten offen Richtung Content
- Innenabstand:
  - oben `pt-20`
  - unten `pb-32`
- Inhalt zentriert

### Hero-Inhalte
- Headline:
  - `Hundefreundliche Wanderungen`
  - sehr groß
  - leichtes Font-Weight
  - weiß
- Subline:
  - `Entdecke die schönsten Wanderungen in den Bergen zusammen mit deinem Vierbeinern.`
  - weiß mit reduzierter Deckkraft
  - max Breite etwa `2xl`

### Hero-Buttons
- Primär:
  - `Alle Touren entdecken`
  - Icon `Mountain`
  - weißer Button mit dunklem Text
- Sekundär:
  - `Tour einreichen`
  - Icon `Plus`
  - transparenter Button mit weißem Rand
- Nur wenn ausgeloggt:
  - `Registrieren`
  - Icon `UserPlus`
  - gleicher Stil wie Sekundärbutton

## 2. Suche
- Schwebt optisch über dem Content
- zentriert
- max Breite etwa `2xl`
- weißes Eingabefeld
- Höhe `14`
- linkes Such-Icon im Feld
- Platzhalter:
  - `Tour oder Ort suchen...`

## 3. Statistik
- Eine einzelne Statistik-Karte mittig
- Wert:
  - Anzahl der gefilterten Wanderungen
- Label:
  - `Wanderungen`
- Icon:
  - `Route`

## 4. Übersichtskarte
- Nur wenn Touren mit Koordinaten vorhanden sind
- Abschnittstitel:
  - `Übersichtskarte`
- rechter Button:
  - `Große Karte`
  - Icon `Map`
- Kartenhöhe:
  - `350px`
- Markerfarben nach Jahreszeit
- Journal-Touren bevorzugt mit Foto-Marker statt Pfotenmarker

## 5. Tourenliste

### Abschnittskopf
- Titel:
  - wenn Suche aktiv: `Suchergebnisse`
  - sonst: `Unsere Wandertipps für dich`
- Untertitel nur ohne Suche:
  - `Passend zur aktuellen Jahreszeit – {Saison} & Ganzjährig`

### Rechte Aktionen
- Wenn ausgeloggt:
  - Button `Anmelden`
  - Icon `LogIn`
- Immer:
  - Textbutton `Alle anzeigen`
  - Icon `ArrowRight`

### Grid
- Desktop: 2 Spalten
- Mobile: 1 Spalte
- Kartenabstand: `gap-6`

## HikeCard-Aufbau
- Großes Titelbild
- dunkler Verlauf über dem Bild unten
- Badge links oben nur bei Premium:
  - `💎 Premium`
- Saison-Emoji rechts oben:
  - Frühling `🌸`
  - Sommer `☀️`
  - Herbst `🍂`
  - Winter `❄️`
  - Ganzjährig `🍃`
- Titel unten auf dem Bild
- darunter Ort mit `MapPin`

### Karteninhalt
- Badges/Infos:
  - Mensch-Schwierigkeit `👤 Stufe X`
  - Hund-Schwierigkeit `🐕 Stufe X`
  - Wasserstatus `💧`
- Stats-Boxen:
  - Distanz in km
  - Höhenmeter in Hm
  - Dauer in Std
- Beschreibung gekürzt

### Karten-Footer
- Bei Journal-Tour:
  - rundes Bild von Hund oder Autor
  - Hundename mit `🐾`
  - optional Username
- Sonst:
  - bis zu 3 Hundebilder
- optional Bewertung mit Stern

## Leere Zustände
- Bei Ladezustand:
  - 4 Skeleton-Karten
- Bei keiner Suche ohne Ergebnisse:
  - `Noch keine Touren`
- Bei Suche ohne Treffer:
  - `Keine Touren gefunden`
  - Button `Suche zurücksetzen`

## Mobile Navigation
- feste Bottom-Navigation
- Tabs:
  - Home
  - Touren
  - Tagebuch
  - Planen
  - Profil
  - Mehr

## Desktop Navigation
- feste Top-Navigation
- Brand links:
  - Icon-Box mit Bergsymbol
  - `DogHike`
  - Unterzeile `Hundefreundliche Wanderungen`

## Visueller Stil
- weich, freundlich, alpine Premium-Richtung
- viel Weißraum
- runde Ecken
- helle Karten mit leichten Borders
- Stone/Slate als Basis
- Brand-Akzent warmes Braun/Beige
- Hero deutlich emotionaler durch Foto

## Wichtige Codequellen
- `src/pages/Dashboard.jsx`
- `src/components/hikes/HikeCard.jsx`
- `src/components/map/HikeMap.jsx`
- `src/Layout.jsx`
