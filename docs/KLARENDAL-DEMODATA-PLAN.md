# Klarendal Casus als Projojo Demodata

> De Klarendal-casus uit `CasusArnhemCity.md` omzetten naar TypeQL seed data die wordt toegevoegd aan de bestaande `seed.tql`, met realistische fictieve namen en rol-suffixen.

## Mapping Casus naar Datamodel

De casus beschrijft twee lijnen in Klarendal. Hieronder de mapping naar Projojo-entiteiten.

### Businesses (4 nieuw/hergebruik)

- **Gemeente Arnhem** — Bestaat al in `seed.tql` als `$b_arnhem`. Extra supervisors toevoegen.
- **CDKM Arnhem** (City Deal Kennis Maken) — Nieuw. De overkoepelende samenwerkingsorganisatie.
- **RijnStad** — Nieuw. Welzijnsorganisatie, betrokken bij Studentensteunpunt.
- **Volkshuisvesting Arnhem** — Nieuw. Woningcorporatie, betrokken bij Studentensteunpunt.

### Supervisors (9 nieuw)

Gekoppeld aan de juiste business via `manages`:

- **Gemeente Arnhem**: Jeroen Willems (Wijkmanager), Frank Hendriksen (Beleidsadviseur), Anouk Peters (Wijkcoach), Sandra van Dijk (Gebiedsmanager Klarendal), Bas Vermeer (Gebiedsmanager)
- **CDKM Arnhem**: Nadia El Amrani (Projectleider CDKM)
- **RijnStad**: Tom de Groot (Sociaal Werker)
- **Volkshuisvesting Arnhem**: Peter van Leeuwen (Wijkconsulent)

### Teachers (10 nieuw)

HAN en HVHL docenten/lectoren:

- Dr. Karin de Boer (Docent HAN), Martijn Scholten (Docent HAN), Ilse Brouwer (Docent Minor Overheid & Beleid), Pieter van Veen (Docent HAN), Renate Dijkstra (Docent PZW)
- Prof. dr. Marc Janssen (Lector HAN AFMR), Dr. Linda Kosters (Associate Lector AFMR)
- Femke Aalbers (Docent HVHL), Geert-Jan de Wit (Docent Management Leefomgeving), Annemarie Vos (Docent Visual Appraisal)

### Students (11 nieuw)

Met beschrijving en relevante skills:

- **HVHL**: Rosa van den Broek, Max Timmermans, Yara Bakker, Noah Hendriks
- **HAN**: Sanne Mulder, Thijs van der Linden, Fleur de Jong, Rick Vermeer, Merel Kuijpers, Bram Schouten
- **OU**: Charlotte Gerritsen

### Projects (8 nieuw)

**Lijn 1 — Positieve Gezondheid** (onder Gemeente Arnhem):

1. **Foto van de Wijk Klarendal** — Visual appraisal door HVHL studenten
   - Task: "Wijkfotograaf & Visual Appraisal" (3 studenten: Rosa, Max, Yara)
2. **Omgaan met Verward Gedrag** — HAN minor onderzoek
   - Task: "Onderzoeker Verward Gedrag" (3 studenten: Sanne, Thijs, Fleur)
3. **Niet-gebruik van Regelingen Klarendal** — HBO Rechten stage
   - Task: "Onderzoeker Regelingen" (1 student: Rick)
4. **Wijkontwikkeling Klarendal** — HVHL 4 eigen initiatief
   - Task: "Wijkontwikkelaar" (1 student: Noah)
5. **Gezondheidschecks Klarendal** — HAN afstudeeropdracht
   - Task: "Uitvoerder Gezondheidschecks" (3 studenten: Rick, Merel, Bram)
6. **Zingeving en Doelgroepen Klarendal** — OU onderzoek
   - Task: "Onderzoeker Zingeving" (1 student: Charlotte)

**Lijn 2 — Studentensteunpunt** (onder CDKM Arnhem):

7. **Studentensteunpunt Klarendal** — Finance, Tax and Advice
   - Task: "Onderzoeker Studentensteunpunt" (2 studenten: Sanne, Thijs)
8. **Studentensteunpunt Vervolg — Klarendal & Presikhaaf** — vervolg 25-26
   - Task: "Coördinator Steunpunt Vervolg" (openstaand, 2 nodig)

### Skills (9 nieuw)

Wijkanalyse, Positieve Gezondheid, Kwalitatief Onderzoek, Visual Appraisal, Beleidsadvies, Sociaal-Juridische Dienstverlening, Financiele Dienstverlening, Zorg & Welzijn, Gemeentelijk Beleid

### Theme (1 nieuw)

- **Gezondheid & Welzijn** (SDG 3) — koppelen aan alle Lijn 1 projecten
- Bestaande theme **Kennisdeling** (SDG 4) — koppelen aan Lijn 2 projecten

### Registrations (studenttoewijzingen)

Projecten 1-6 krijgen `registersForTask` relaties met `isAccepted: true` en realistische tijdstempels (24-25 / 25-26 semesters). Projecten 1-3 en het steunpunt krijgen `completedAt` (afgerond). Projecten 5-6 en 8 zijn lopend (geen completedAt).

## Bestand dat wordt aangepast

`projojo_backend/db/seed.tql` — een nieuw blok "Klarendal — City Deal Kennis Maken" toevoegen aan het einde van het bestand (voor de afsluitende `;`), in dezelfde stijl als de bestaande City Deal en Gemeente Arnhem blokken.

## Na de wijziging

Database resetten met `docker-compose down && docker-compose up -d --build` zodat de nieuwe seed data geladen wordt.

## Stappen

1. Voeg nieuw theme "Gezondheid & Welzijn" en 9 nieuwe skills toe aan seed.tql
2. Voeg CDKM Arnhem, RijnStad en Volkshuisvesting Arnhem toe als businesses
3. Voeg 9 supervisors toe met manages-relaties en OAuth
4. Voeg 10 teachers toe met OAuth
5. Voeg 11 students toe met skills en beschrijvingen
6. Voeg 8 projecten met taken, skill-requirements en theme-koppelingen toe
7. Voeg registersForTask relaties toe voor studenttoewijzingen
8. Database resetten zodat nieuwe seed data geladen wordt
