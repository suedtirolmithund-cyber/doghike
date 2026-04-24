# Doghike Testplan für Testnutzer

Dieses Dokument ist für Testnutzer gedacht, die die App einmal in Ruhe durchklicken sollen.

Wichtig:
- Bitte nicht nur kurz anschauen, sondern die Schritte wirklich ausführen.
- Wenn etwas nicht funktioniert, bitte dazuschreiben:
  - Was genau gemacht wurde
  - Auf welcher Seite der Fehler war
  - Welche Fehlermeldung angezeigt wurde
  - Ob ihr am Handy oder am Computer wart

## Ziel

Geprüft werden soll, ob die wichtigsten Funktionen der App im Alltag sauber funktionieren.

## Allgemeine Hinweise für Tester

- Bitte testet, wenn möglich, am Handy und am Computer.
- Bitte achtet auch darauf:
  - Lädt die Seite schnell genug?
  - Sind Texte verständlich?
  - Ist etwas unklar oder verwirrend?
  - Fehlt irgendwo ein Button oder eine Info?

## 1. Registrierung und Login

Bitte testen:
- App öffnen
- Neues Konto erstellen
- Prüfen, ob die Registrierung funktioniert
- Danach ausloggen
- Wieder einloggen

Bitte zusätzlich testen:
- `Passwort oder E-Mail vergessen?`
- Eigene E-Mail eingeben
- Prüfen, ob die E-Mail ankommt
- Link aus der E-Mail öffnen
- Neues Passwort setzen
- Danach mit dem neuen Passwort einloggen

Bitte melden, wenn:
- keine E-Mail kommt
- der Link nicht funktioniert
- das neue Passwort nicht gespeichert wird

## 2. Profil

Bitte testen:
- Profil öffnen
- Name oder Angaben ändern
- Profilbild hochladen
- Profilbild wieder ändern

Bitte prüfen:
- Wird alles gespeichert?
- Wird das neue Bild richtig angezeigt?

## 3. Hunde

Bitte testen:
- Einen Hund anlegen
- Hundebild hochladen
- Angaben zum Hund ändern
- Hundebild ändern
- Hund wieder löschen

Bitte prüfen:
- Wird alles gespeichert?
- Ist alles verständlich?

## 4. Freunde

Bitte mit zwei Testkonten prüfen:

Konto A:
- Konto B suchen
- Freundschaftsanfrage senden

Konto B:
- Anfrage sehen
- Anfrage annehmen

Danach prüfen:
- Werden beide als Freunde angezeigt?
- Ist die Seite verständlich?
- Sind `Offene Anfragen`, `Gesendet` und `Touren von Freunden` klar?

Zusätzlich:
- Freund wieder entfernen

## 5. Route planen

Bitte testen:
- Route planen
- Name eingeben
- Startpunkt setzen
- Mehrere Punkte auf der Karte setzen
- Route speichern

Bitte prüfen:
- Wird die Route gespeichert?
- Wird sie im Profil angezeigt?
- Bleibt sie privat?

## 6. Route als erledigt markieren

Bitte testen:
- Gespeicherte Route öffnen
- `Als erledigt markieren`
- Datum eintragen
- Dauer eintragen
- Notizen ergänzen

Danach:
- Prüfen, ob die Route als erledigt gespeichert wurde
- Prüfen, ob `Als Wanderung eintragen` erst dann sichtbar ist

## 7. Wanderung eintragen

Bitte testen:
- Aus einer erledigten Route einen Wanderungseintrag machen
- Prüfen, ob Daten übernommen wurden:
  - Titel
  - Ort
  - Dauer
  - Strecke
  - Höhenmeter
  - Beschreibung

Dann bitte diese drei Fälle testen:

### Privat
- Eintrag privat speichern
- Prüfen, ob alles gespeichert wurde

### Freunde
- Eintrag auf `Freunde` stellen
- Prüfen, ob befreundete Nutzer ihn sehen
- Prüfen, ob fremde Nutzer ihn nicht sehen

### Öffentlich
- Eintrag auf `Öffentlich` stellen
- Prüfen, ob alle Pflichtfelder verlangt werden
- Prüfen, ob der Eintrag erst nach Admin-Freigabe öffentlich sichtbar wird

## 8. Kommentare

Bitte auf einer öffentlichen Wanderung testen:
- Kommentar schreiben
- Kommentar mit Foto schreiben
- Einverständnisfeld anklicken
- Kommentar absenden

Bitte prüfen:
- Wird der Kommentar angezeigt?
- Wird das Bild angezeigt?

Danach:
- Eigenen Kommentar löschen
- Prüfen, ob das funktioniert

Wichtig:
- Fremde Kommentare dürfen nicht löschbar sein

## 9. Triggerwort-Test

Bitte testen:
- Einen Kommentar mit einem problematischen Wort schreiben

Bitte prüfen:
- Wird der Kommentar nicht sofort öffentlich?
- Bleibt er für den eigenen Nutzer als wartend erkennbar?
- Ist das Bild dabei nicht öffentlich sichtbar?

## 10. Merkliste

Bitte testen:
- Eine Wanderung speichern
- Prüfen, ob sie in der Merkliste erscheint
- Wieder entfernen

## 11. Offline-Download

Bitte testen:
- Bei einer Wanderung den Download auslösen

Bitte prüfen:
- Wird eine Datei erstellt?
- Sind wichtige Infos enthalten?
- Ist nur das Titelbild enthalten?
- Fehlen Kommentare und Bewertungen?

## 12. Öffentliche Seiten

Bitte einmal allgemein durchgehen:
- Startseite
- Login
- Support
- Datenschutz
- Impressum

Bitte prüfen:
- Laden die Seiten normal?
- Sind Texte verständlich?
- Gibt es noch kaputte Umlaute oder komische Zeichen?

## 13. Admin-Test

Bitte mit einem Admin-Konto prüfen:

### Öffentliche Wanderungen
- Öffentliche Nutzer-Wanderung sehen
- Eintrag freigeben
- Eintrag ablehnen
- Eintrag bearbeiten

### Kommentare
- Kommentar mit Triggerwort sehen
- Kommentar freigeben
- Kommentar löschen

Bitte prüfen:
- Ist im Admin-Bereich alles klar verständlich?
- Werden wartende Dinge richtig angezeigt?

## 14. Was Testnutzer am Ende zurückmelden sollen

Bitte jede Rückmeldung so einfach wie möglich schreiben:

- Was hat gut funktioniert?
- Was hat nicht funktioniert?
- Was war unklar?
- Wo habt ihr euch unsicher gefühlt?
- Welche Seite war betroffen?
- Handy oder Computer?

## Kurzfassung für schnelle Tester

Wenn jemand nicht alles testen will, dann bitte mindestens diese Punkte:

1. Registrierung und Login
2. Passwort vergessen
3. Hund anlegen
4. Route planen
5. Wanderung eintragen
6. Kommentar schreiben
7. Freundschaftsanfrage
8. Admin-Freigabe einer öffentlichen Wanderung

