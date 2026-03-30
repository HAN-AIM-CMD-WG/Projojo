/**
 * Projojo 2.0 Demo Guide System
 * Contextual help, role switching, tooltips, and interactive guided tours.
 */
(function() {
  'use strict';

  /* ========== PAGE DEFINITIONS ========== */

  const PAGES = {
    'discovery': {
      icon: 'explore',
      title: 'Ontdek — Vind wat je zoekt',
      desc: 'Dit is de startpagina van het platform. Hier zoek en filter je op projecten, programma\'s, mensen en courses.',
      roles: {
        professional: 'Je zoekt studenten, docenten of andere professionals voor je project. Filter op thema of locatie en klik op een profiel om contact te leggen.',
        docent: 'Je zoekt projecten die passen bij je course. Gebruik de filters om op thema en periode te zoeken, of bekijk de kaart voor projecten in de buurt.',
        student: 'Je ontdekt projecten waar je aan kunt meewerken. Filter op thema of locatie en meld je aan via de projectpagina.',
        inwoner: 'Je bekijkt wat er in jouw wijk speelt. Filter op "Klarendal" om projecten bij jou in de buurt te vinden.'
      }
    },
    'programma': {
      icon: 'hub',
      title: 'Programma — Meerdere projecten, één verhaal',
      desc: 'Een programma bundelt meerdere projecten van verschillende organisaties onder één paraplu. De tijdlijn laat zien hoe projecten zich over semesters ontwikkelen.',
      roles: {
        professional: 'Je ziet hier alle projecten binnen je programma, wie er betrokken is en hoe de tijdlijn eruitziet. Als coordinator beheer je het overzicht.',
        docent: 'Bekijk de tijdlijn om te zien welke projecten er lopen en wanneer. Koppel je course aan een passend project.',
        student: 'Vind een project dat bij je past. Bekijk welke organisaties er bij betrokken zijn en welke studenten er al meewerken.',
        inwoner: 'Bekijk welke projecten er in jouw wijk lopen en wat voor resultaten er zijn behaald.'
      }
    },
    'kennisbank': {
      icon: 'library_books',
      title: 'Kennisbank — Leer van eerdere projecten',
      desc: 'Alle gepubliceerde resultaten uit projecten: rapporten, video\'s, flyers en meer. Zoek, filter en bekijk de details.',
      roles: {
        professional: 'Vind inzichten en rapporten uit eerdere projecten. Gebruik ze als input voor nieuw beleid of nieuwe projecten.',
        docent: 'Gebruik gepubliceerde resultaten als lesmateriaal of referentie. Bekijk wat studenten eerder hebben opgeleverd.',
        student: 'Publiceer je eigen resultaten hier — anoniem of met naam. Je vindt ook werk van medestudenten ter inspiratie.',
        inwoner: 'Bekijk wat er in jouw wijk is onderzocht en opgeleverd. De resultaten zijn toegankelijk en begrijpelijk geschreven.'
      }
    },
    'courseprofiel': {
      icon: 'school',
      title: 'Courseprofiel — Brug tussen onderwijs en praktijk',
      desc: 'Een courseprofiel beschrijft wat het onderwijs aanbiedt. Het platform matcht dit automatisch met projecten die passen.',
      roles: {
        professional: 'Bekijk welke courses er beschikbaar zijn en hoe ze aansluiten bij je project. Neem contact op met de docent voor samenwerking.',
        docent: 'Maak en beheer courseprofielen. Het platform toont automatisch welke projecten passen. Koppel ze handmatig of via suggesties.',
        student: 'Bekijk je course-details en welke projecten erbij passen. De match-score helpt je kiezen.',
        inwoner: 'Dit scherm is vooral relevant voor docenten en studenten, maar je kunt zien welke opleidingen actief zijn in je wijk.'
      }
    },
    'profiel': {
      icon: 'person',
      title: 'Profiel — Laat zien wie je bent',
      desc: 'Elk profieltype heeft een rijke pagina met expertise, thema\'s, en "Ik zoek / Ik bied / Ik help graag mee met..."',
      roles: {
        professional: 'Je profiel toont je expertise, organisatie, projecten en publicaties. Andere gebruikers kunnen je vinden en contact opnemen.',
        docent: 'Je profiel toont je vakgebied, courseprofielen en projecten. Professionals vinden je op expertise en thema.',
        student: 'Je profiel toont je opleiding, skills en interesses. Professionals en docenten vinden je voor projecten.',
        inwoner: 'Je hebt een licht profiel met wijk en interesses. Professionals kunnen je uitnodigen voor projecten in je buurt.'
      }
    },
    'project': {
      icon: 'folder_open',
      title: 'Project — Het hart van samenwerking',
      desc: 'Een project is een samenwerkingsverband met opdrachtgever, partners, begeleiders (met flexibele rollen), studenten en inwoners.',
      roles: {
        professional: 'Je beheert het project: wijs rollen toe, accepteer studenten, review publicaties voor de kennisbank. Je hebt veto-recht op publicaties.',
        docent: 'Je neemt deel als begeleider, docent-onderzoeker, of een andere rol — dit wisselt per project. Je kunt ook publicaties reviewen.',
        student: 'Je meldt je aan voor taken, levert resultaten op en kunt voorstellen doen voor publicatie — anoniem of met naam.',
        inwoner: 'Je kunt deelnemen als informant, co-onderzoeker of klankbordgroep-lid. Je inbreng is waardevol voor het project.'
      }
    },
    'organisatie': {
      icon: 'business',
      title: 'Organisatie — Meer dan alleen een bedrijf',
      desc: 'Organisaties zijn breed: gemeenten, hogescholen, welzijnsorganisaties, woningcorporaties.',
      roles: {
        professional: 'Je organisatiepagina toont alle medewerkers, projecten en programma\'s.',
        docent: 'Bekijk welke organisaties actief zijn en welke projecten ze aanbieden.',
        student: 'Ontdek welke organisaties projecten hebben waar je aan kunt meewerken.',
        inwoner: 'Bekijk welke organisaties actief zijn in jouw wijk en wat ze doen.'
      }
    },
    'connectie': {
      icon: 'forum',
      title: 'Connecties — Veilig contact leggen',
      desc: 'Het platform faciliteert AVG-veilig contact: geen e-mailadressen zichtbaar, connectie vereist wederzijds akkoord.',
      roles: {
        professional: 'Je ontvangt connectieverzoeken van docenten, studenten en inwoners. Na acceptatie kun je via het platform overleggen.',
        docent: 'Benader professionals voor samenwerking of studenten voor je course. Alle communicatie gaat via het platform.',
        student: 'Neem contact op met een projectbegeleider of docent. Je persoonlijke gegevens blijven beschermd.',
        inwoner: 'Toon interesse in een project. Een professional ontvangt je verzoek en kan je uitnodigen om mee te doen.'
      }
    }
  };

  /* ========== TOUR STEPS PER PAGE PER ROLE ========== */

  const TOURS = {
    discovery: {
      professional: [
        { sel: '.search-bar', title: 'Zoek op expertise', text: 'Typ hier een thema, locatie of vaardigheid. Bijvoorbeeld "wijkanalyse Arnhem" om de juiste mensen en projecten te vinden.' },
        { sel: '.filter-row', title: 'Filter op thema', text: 'Verfijn je resultaten. Klik "Gezondheid & Welzijn" om alleen relevante projecten en personen te zien.' },
        { sel: '#tabs', title: 'Kies een categorie', text: 'Wissel tussen Projecten, Programma\'s, Mensen en Courses. Als professional zoek je vaak op "Mensen" om docenten of studenten te vinden.' },
        { sel: '[data-group="mensen"]', title: 'Vind de juiste mensen', text: 'Profielkaarten tonen naam, rol, organisatie en expertise. Klik door om het volledige profiel te bekijken en contact op te nemen.' },
        { sel: '.discovery-map', title: 'Kaart: wat speelt er?', text: 'De interactieve kaart toont projecten en programma\'s op locatie. Klik een marker om details te zien — handig om te vinden wat er in jouw werkgebied speelt.' }
      ],
      docent: [
        { sel: '.search-bar', title: 'Zoek een passend project', text: 'Typ het thema van je course, bijv. "beleid" of "gezondheid". Het platform toont projecten die aansluiten bij je onderwijs.' },
        { sel: '[data-group="courses"]', title: 'Je courseprofiel', text: 'Hier zie je courses. Klik door naar je eigen courseprofiel om te zien welke projecten het platform automatisch voorstelt.' },
        { sel: '[data-group="programmas"]', title: 'Programma\'s verkennen', text: 'Programma\'s bevatten meerdere projecten. Als docent kun je je course aan een heel programma koppelen — meerdere projecten in één keer.' },
        { sel: '[data-group="projecten"]', title: 'Projecten bekijken', text: 'Bekijk lopende en afgeronde projecten. Een groen label = afgerond, oranje = lopend. Klik voor details over het team en de taken.' },
        { sel: '.discovery-map', title: 'Projecten in de buurt', text: 'De kaart helpt je projecten te vinden bij jou in de buurt — praktisch als je studenten lokaal wilt inzetten.' }
      ],
      student: [
        { sel: '.search-bar', title: 'Ontdek projecten', text: 'Zoek op thema of locatie. Typ bijv. "Klarendal" of "gezondheid" om te zien waar je aan mee kunt doen.' },
        { sel: '#tabs', title: 'Filter op type', text: 'Klik op "Projecten" om alleen projecten te zien. Je kunt je ook oriënteren op welke programma\'s er lopen.' },
        { sel: '[data-group="projecten"]', title: 'Kies een project', text: 'Projecten met een oranje "Lopend" label zoeken nog studenten. Klik op een project om de details te bekijken en je aan te melden voor een taak.' },
        { sel: '[data-group="courses"]', title: 'Check je course', text: 'Je docent kan een course al gekoppeld hebben aan een project. Bekijk hier welke courses beschikbaar zijn en welke projecten erbij passen.' },
        { sel: '.discovery-map', title: 'Wat is er bij jou?', text: 'Bekijk de kaart om projecten in de buurt te vinden. Handig als je een project zoekt dat goed bereikbaar is.' }
      ],
      inwoner: [
        { sel: '.search-bar', title: 'Zoek in jouw wijk', text: 'Typ de naam van je wijk, bijv. "Klarendal". Je ziet dan projecten en activiteiten bij jou in de buurt.' },
        { sel: '.filter-row', title: 'Filter op locatie', text: 'Klik op "Klarendal" of "Arnhem" om alleen projecten in jouw wijk te zien.' },
        { sel: '.discovery-map', title: 'De kaart', text: 'De kaart laat zien wat er in je wijk speelt. Klik op een marker om meer te weten over een project.' },
        { sel: '[data-group="projecten"]', title: 'Doe mee aan een project', text: 'Als inwoner kun je meedoen als informant, klankbordgroep-lid of co-onderzoeker. Klik op een project voor meer info.' }
      ]
    },
    programma: {
      professional: [
        { sel: '.neu-card.fade-in', title: 'Programma-overzicht', text: 'Dit is het programma "City Deal Kennis Maken". Als professional zie je hier het totaalplaatje: partners, projecten en voortgang.' },
        { sel: '.stat-row', title: 'Kerncijfers', text: '8 projecten, 11 studenten, 6 organisaties — in één oogopslag zie je de omvang van het programma.' },
        { sel: '.partner-row', title: 'Partners', text: 'Alle samenwerkende organisaties op een rij. Als coordinator kun je hier nieuwe partners toevoegen.' },
        { sel: '.timeline-grid-wrapper', title: 'Tijdlijn', text: 'De tijdlijn toont alle projecten over semesters. Groen = afgerond, oranje = actief, blauw = gepland. Scroll voor het complete overzicht.' },
        { sel: '.grid-3', title: 'Alle projecten', text: 'Klik op een project voor details over het team, de taken en de resultaten.' }
      ],
      docent: [
        { sel: '.neu-card.fade-in', title: 'Programma verkennen', text: 'Bekijk dit programma om te ontdekken welke projecten er lopen en waar jouw course bij past.' },
        { sel: '.timeline-grid-wrapper', title: 'Wanneer kun je instappen?', text: 'De tijdlijn laat zien welke projecten in welk semester lopen. Match dit met de periode van jouw course.' },
        { sel: '.stat-row', title: 'Schaal en impact', text: 'Het programma verbindt meerdere projecten. Een course koppelen aan een programma geeft je studenten meer keuze.' },
        { sel: '.grid-3', title: 'Kies een project', text: 'Zoek een project met actieve status dat past bij je leeruitkomsten. Klik door voor details.' }
      ],
      student: [
        { sel: '.neu-card.fade-in', title: 'Wat is dit programma?', text: 'Een programma is een groot samenwerkingsverband. Hier zie je alle projecten die eronder vallen — meer keuze voor jou!' },
        { sel: '.timeline-grid-wrapper', title: 'Tijdlijn', text: 'Zie wanneer projecten lopen. Oranje blokken zijn nu actief — daar kun je je voor aanmelden.' },
        { sel: '.grid-3', title: 'Projecten ontdekken', text: 'Kies een project dat aansluit bij je opleiding en interesses. Elk project heeft een eigen team en taken.' }
      ],
      inwoner: [
        { sel: '.neu-card.fade-in', title: 'Programma in jouw wijk', text: 'Dit programma bundelt projecten in Klarendal. Bekijk waar jij aan mee kunt doen.' },
        { sel: '.timeline-grid-wrapper', title: 'Wat is er gedaan?', text: 'Groene blokken = afgeronde projecten met resultaten. Oranje = lopende projecten waar je nog bij kunt aansluiten.' },
        { sel: '.grid-3', title: 'Projecten bekijken', text: 'Klik op een project om meer te lezen en te zien hoe je als inwoner mee kunt doen.' }
      ]
    },
    kennisbank: {
      professional: [
        { sel: '.search-bar', title: 'Zoek in publicaties', text: 'Zoek op trefwoord, bijv. "verward gedrag" of "gezondheidschecks". Vind rapporten en inzichten uit eerdere projecten.' },
        { sel: '.filter-row', title: 'Filter op type', text: 'Kies "Rapport" voor onderzoeksrapporten, "Video" voor documentaires, of filter op thema. Combineer meerdere filters.' },
        { sel: '#pubGrid .neu-card:first-child', title: 'Publicatie bekijken', text: 'Elke kaart toont titel, samenvatting en auteurs. Klik voor het volledige detail inclusief downloadoptie.' },
        { sel: '#pubGrid .neu-card:nth-child(5)', title: 'Diverse formats', text: 'De kennisbank bevat niet alleen rapporten — ook video\'s, flyers en presentaties. Alles doorzoekbaar.' }
      ],
      docent: [
        { sel: '.search-bar', title: 'Vind lesmateriaal', text: 'Zoek publicaties die je kunt gebruiken als referentie of voorbeeld in je onderwijs.' },
        { sel: '#pubGrid .neu-card:first-child', title: 'Studentenwerk', text: 'Rapporten gemaakt door studenten — gereviewd en goedgekeurd. Laat zien wat studenten in eerdere projecten hebben bereikt.' },
        { sel: '.filter-row', title: 'Filter op thema', text: 'Vind publicaties binnen jouw vakgebied. Handig als voorbereiding op een nieuw project.' }
      ],
      student: [
        { sel: '.page-header', title: 'De kennisbank', text: 'Hier vind je werk van medestudenten en projectresultaten. Na jouw project kan jouw werk hier ook staan!' },
        { sel: '#pubGrid .neu-card:first-child', title: 'Gepubliceerd werk', text: 'Klik om het volledige rapport te lezen. Je ziet auteurs, begeleiders, en kunt het downloaden.' },
        { sel: '.filter-row', title: 'Zoek inspiratie', text: 'Filter op thema of type om werk te vinden dat relevant is voor jouw project.' },
        { sel: '#pubGrid .neu-card:nth-child(6)', title: 'Jouw resultaat hier?', text: 'Na je project kun je resultaten voorstellen voor publicatie — anoniem of met je naam. Je begeleider reviewt het voordat het publiek wordt.' }
      ],
      inwoner: [
        { sel: '.page-header', title: 'Kennisbank', text: 'Hier vind je de resultaten van projecten in jouw wijk. Rapporten, filmpjes en flyers — alles openbaar en begrijpelijk.' },
        { sel: '.filter-row', title: 'Filter op jouw wijk', text: 'Klik "Klarendal" om alleen publicaties uit je eigen wijk te zien.' },
        { sel: '#pubGrid .neu-card:first-child', title: 'Resultaten lezen', text: 'Klik op een kaart om het volledige resultaat te bekijken. De samenvatting geeft een snel overzicht.' }
      ]
    },
    courseprofiel: {
      professional: [
        { sel: '.course-main .neu-card:first-child', title: 'Course-informatie', text: 'Hier zie je wat deze course inhoudt: onderwerpen, samenwerkingsvorm en welke begeleiding er gevraagd wordt van jou als opdrachtgever.' },
        { sel: '.detail-list', title: 'Wat wordt er gevraagd?', text: 'De details tonen precies wat de docent nodig heeft: hoeveel begeleiding, welke periode, hoeveel studenten. Zo weet je of het bij je project past.' },
        { sel: '.course-sidebar', title: 'Automatische matching', text: 'Het platform berekent welke van jouw projecten het beste passen. De match-score is gebaseerd op thema, periode en groepsgrootte.' }
      ],
      docent: [
        { sel: '.course-main .neu-card:first-child', title: 'Jouw courseprofiel', text: 'Dit is hoe jouw course eruitziet voor professionals. Zorg dat de leeruitkomsten en samenwerkingsvorm duidelijk zijn.' },
        { sel: '.detail-list', title: 'Details invullen', text: 'Hoe specifieker je de gevraagde begeleiding en beschikbaarheid invult, hoe beter de matching werkt.' },
        { sel: '.course-sidebar', title: 'Matchende projecten', text: 'Het platform toont automatisch welke projecten passen. 95% match = bijna perfect. Je kunt ook handmatig koppelen.' },
        { sel: '.course-sidebar .neu-card:last-child', title: 'Contact leggen', text: 'Klik "Bekijk project" om details te zien en vervolgens "Neem contact op" om met de opdrachtgever te overleggen.' }
      ],
      student: [
        { sel: '.course-main .neu-card:first-child', title: 'Je course', text: 'Hier zie je de details van je minor of module. De leeruitkomsten zijn leidend voor welke projecten passen.' },
        { sel: '.course-sidebar', title: 'Projecten die passen', text: 'Het platform toont projecten die matchen met je course. Hoe hoger de score, hoe beter de fit. Overleg met je docent over de keuze.' }
      ],
      inwoner: [
        { sel: '.course-main .neu-card:first-child', title: 'Wat doen studenten?', text: 'Dit laat zien welke opleidingen er actief zijn in je wijk. Studenten uit deze courses werken aan projecten bij jou in de buurt.' },
        { sel: '.course-sidebar', title: 'Gekoppelde projecten', text: 'Hier zie je aan welke projecten deze studenten werken — misschien ook in jouw wijk.' }
      ]
    },
    profiel: {
      professional: [
        { sel: '.profile-type-switcher', title: '4 profieltypes', text: 'Het platform kent Professionals, Docenten, Studenten en Inwoners. Elk type heeft eigen rechten en mogelijkheden.' },
        { sel: '.info-grid', title: 'Ik zoek / Ik bied / Ik help', text: 'Deze velden maken je vindbaar. Andere gebruikers zoeken op wat jij biedt. Vul ze specifiek in voor betere matches.' },
        { sel: '.stat-row', title: 'Jouw activiteit', text: 'In één oogopslag zie je hoeveel projecten, programma\'s, publicaties en connecties je hebt.' },
        { sel: '.section:nth-of-type(1)', title: 'Actieve projecten', text: 'Alle projecten waar je bij betrokken bent, met jouw rol (begeleider, opdrachtgever, etc.).' }
      ],
      docent: [
        { sel: '.profile-type-switcher', title: 'Jij als docent', text: 'Als docent is je profiel gelijkwaardig aan dat van een professional. Je vakgebied en courseprofielen zijn prominent zichtbaar.' },
        { sel: '.info-grid', title: 'Vindbaar worden', text: '"Ik bied" toont wat je kunt bijdragen aan projecten. Professionals zoeken hierop wanneer ze een docent-partner zoeken.' },
        { sel: '.stat-row', title: 'Jouw netwerk', text: 'Connecties, publicaties en projecten — alles bij elkaar op je profielpagina.' }
      ],
      student: [
        { sel: '.profile-type-switcher', title: 'Jouw profiel', text: 'Als student vul je je opleiding, skills en interesses in. Professionals en docenten vinden je op basis van wat je kunt.' },
        { sel: '.info-grid', title: 'Laat zien wat je zoekt', text: '"Ik zoek" vertelt professionals welk soort project bij je past. "Ik bied" laat zien wat je in huis hebt.' }
      ],
      inwoner: [
        { sel: '.profile-type-switcher', title: 'Licht profiel', text: 'Als inwoner heb je een eenvoudig profiel: je wijk en je interesses. Geen opleiding of organisatie nodig.' },
        { sel: '.info-grid', title: 'Waar help je mee?', text: '"Ik help graag mee met..." laat professionals weten dat je beschikbaar bent voor projecten in je wijk.' }
      ]
    },
    project: {
      professional: [
        { sel: '.neu-card.fade-in:first-of-type', title: 'Projectoverzicht', text: 'Als opdrachtgever of begeleider beheer je dit project. Je ziet status, beschrijving, en welk programma het onderdeel is van.' },
        { sel: '.stat-row', title: 'Kerncijfers', text: 'Hoeveel studenten, begeleiders, taken en publicaties — direct inzicht in de stand van zaken.' },
        { sel: '.section:nth-of-type(1)', title: 'Opdrachtgever & Partners', text: 'Jouw organisatie is opdrachtgever. Partners (andere organisaties) werken mee. Je kunt partners toevoegen.' },
        { sel: '.section:nth-of-type(2)', title: 'Projectteam met rollen', text: 'Elk teamlid heeft een zichtbare rol: begeleider, docent-onderzoeker, projectcoordinator. Rollen zijn flexibel en aanpasbaar.' },
        { sel: '.task-list', title: 'Taken beheren', text: 'Taken met status-indicatie. Groen = afgerond, oranje = in uitvoering, grijs = open. Je kunt taken toewijzen en voltooien.' }
      ],
      docent: [
        { sel: '.neu-card.fade-in:first-of-type', title: 'Jouw project', text: 'Hier zie je het project waar je aan meewerkt. Je rol (docent-onderzoeker, begeleider, etc.) is zichtbaar voor het hele team.' },
        { sel: '.section:nth-of-type(2)', title: 'Flexibele rollen', text: 'Let op de paarse rol-tags. Per project kies je een andere rol: in het ene project begeleider, in het andere docent-onderzoeker.' },
        { sel: '.task-list', title: 'Voortgang volgen', text: 'Zie welke taken je studenten uitvoeren en hoe ver ze zijn.' }
      ],
      student: [
        { sel: '.neu-card.fade-in:first-of-type', title: 'Je project', text: 'Dit is het project waar je aan meewerkt. Je ziet het team, de opdrachtgever en welke taken er zijn.' },
        { sel: '.task-list', title: 'Jouw taken', text: 'Hier zie je je taken en de voortgang. Je naam staat bij de taak die je uitvoert.' },
        { sel: '.section:nth-of-type(3)', title: 'Medestudenten', text: 'Je medestudenten met hun skills. Samenwerken binnen het project wordt zo makkelijker.' }
      ],
      inwoner: [
        { sel: '.neu-card.fade-in:first-of-type', title: 'Een project in je wijk', text: 'Dit project gaat over gezondheidschecks in Klarendal. Als inwoner kun je meedoen als informant of klankbordgroep-lid.' },
        { sel: '.section:nth-of-type(3)', title: 'Wie werkt eraan?', text: 'Je ziet welke studenten en professionals betrokken zijn. Zij nemen contact met jou op als je je aanmeldt.' }
      ]
    },
    organisatie: {
      professional: [
        { sel: '.neu-card.fade-in:first-of-type', title: 'Je organisatie', text: 'Het organisatieprofiel van Gemeente Arnhem. Hier zien andere gebruikers wie jullie zijn, wat jullie doen en welke thema\'s jullie aanpakken.' },
        { sel: '.stat-row', title: 'Impact', text: 'Hoeveel projecten, medewerkers, programma\'s en publicaties — je ziet de totale bijdrage van je organisatie.' },
        { sel: '.section:nth-of-type(2)', title: 'Je collega\'s', text: 'Alle medewerkers van je organisatie die op Projojo actief zijn. Elk met eigen expertise en projecten.' }
      ],
      docent: [
        { sel: '.neu-card.fade-in:first-of-type', title: 'Organisatie verkennen', text: 'Bekijk organisaties om samenwerkingspartners te vinden. Hier zie je thema\'s, projecten en contactpersonen.' },
        { sel: '.section:nth-of-type(2)', title: 'Contactpersonen', text: 'Vind de juiste persoon om mee samen te werken. Klik door naar een profiel om contact op te nemen.' }
      ],
      student: [
        { sel: '.neu-card.fade-in:first-of-type', title: 'Wie is de opdrachtgever?', text: 'Hier lees je over de organisatie waar je project voor werkt. Handig als achtergrond bij je opdracht.' },
        { sel: '.section:nth-of-type(4)', title: 'Projecten', text: 'Alle projecten van deze organisatie. Klik door om er een te vinden die bij je past.' }
      ],
      inwoner: [
        { sel: '.neu-card.fade-in:first-of-type', title: 'Wie is er actief?', text: 'Bekijk welke organisaties actief zijn in je wijk. Gemeente Arnhem, welzijnsorganisaties en meer.' },
        { sel: '.section:nth-of-type(1)', title: 'Thema\'s', text: 'De focusgebieden van deze organisatie. Komt overeen met jouw interesses? Dan zijn hun projecten interessant voor jou.' }
      ]
    },
    connectie: {
      professional: [
        { sel: '.steps-row', title: 'Zo werkt het', text: 'Drie stappen: iemand toont interesse, jij bekijkt het verzoek, en als je accepteert kun je berichten uitwisselen. E-mailadressen worden nooit gedeeld.' },
        { sel: '.avg-grid', title: 'AVG-waarborgen', text: 'Het platform beschermt persoonsgegevens. Profielen zijn alleen zichtbaar voor ingelogde gebruikers, e-mails nooit.' },
        { sel: '.demo-layout > div:first-child', title: 'Verzoek versturen', text: 'Zo ziet een connectieverzoek eruit. Je schrijft waarom je contact wilt. Alleen je naam, rol en organisatie worden gedeeld.' },
        { sel: '.demo-layout > div:last-child', title: 'Je inbox', text: 'Hier zie je ontvangen verzoeken en lopende gesprekken. Klik op een gesprek om het te openen.' }
      ],
      docent: [
        { sel: '.steps-row', title: 'Contact met professionals', text: 'Vond je een project dat past? Stuur een connectieverzoek naar de opdrachtgever. Leg in je bericht uit welke course je aanbiedt.' },
        { sel: '.demo-layout > div:first-child', title: 'Eerste contact', text: 'Schrijf een kort bericht. De ontvanger ziet je naam en functie — geen e-mailadres tot na acceptatie.' },
        { sel: '.demo-layout > div:last-child', title: 'Berichten', text: 'Na acceptatie: een simpele berichtenthread. Spreek af om verder te gaan via e-mail of Teams.' }
      ],
      student: [
        { sel: '.steps-row', title: 'Veilig contact', text: 'Je persoonlijke gegevens zijn beschermd. Alleen je naam, opleiding en instelling worden gedeeld bij een verzoek.' },
        { sel: '.avg-grid', title: 'Jouw privacy', text: 'E-mailadres blijft verborgen. Je kiest zelf of je publicaties anoniem of met naam verschijnen.' },
        { sel: '.demo-layout > div:first-child', title: 'Contact opnemen', text: 'Wil je meedoen aan een project? Stuur een verzoek met een kort bericht over je motivatie.' }
      ],
      inwoner: [
        { sel: '.steps-row', title: 'Hoe werkt het?', text: 'Je kunt interesse tonen in een project. Een professional bekijkt je verzoek en kan je uitnodigen. Veilig en laagdrempelig.' },
        { sel: '.avg-grid', title: 'Je privacy', text: 'Alleen je naam en wijk worden gedeeld. Geen e-mailadres, geen telefoonnummer. Communicatie gaat via het platform.' },
        { sel: '.demo-layout > div:last-child', title: 'Berichten ontvangen', text: 'Als een professional je uitnodigt, verschijnt dat hier. Je beslist zelf of je meedoet.' }
      ]
    }
  };

  const ROLE_LABELS = {
    professional: { icon: 'work', label: 'Professional' },
    docent: { icon: 'school', label: 'Docent' },
    student: { icon: 'person', label: 'Student' },
    inwoner: { icon: 'location_city', label: 'Inwoner' }
  };

  let currentRole = 'professional';
  let bannerVisible = true;
  let tourActive = false;
  let tourStepIndex = 0;
  let tourSteps = [];

  function getPageKey() {
    const path = window.location.pathname;
    const file = path.split('/').pop().replace('.html', '');
    return PAGES[file] ? file : 'discovery';
  }

  /* ========== BANNER ========== */

  function createBanner(pageKey) {
    const page = PAGES[pageKey];
    if (!page) return;

    const banner = document.createElement('div');
    banner.className = 'guide-banner';
    banner.id = 'guide-banner';

    const roleTabs = Object.entries(ROLE_LABELS).map(([key, val]) =>
      `<button class="guide-role-tab ${key === currentRole ? 'active' : ''}" data-role="${key}">
        <span class="material-symbols-rounded" style="font-size:.9rem;vertical-align:middle;">${val.icon}</span>
        ${val.label}
      </button>`
    ).join('');

    const roleContents = Object.entries(page.roles).map(([key, text]) =>
      `<div class="guide-role-content ${key === currentRole ? 'visible' : ''}" data-role-content="${key}">
        <strong>Als ${ROLE_LABELS[key].label}:</strong> ${text}
        <br>
        <button class="tour-start-btn" data-tour-role="${key}">
          <span class="material-symbols-rounded">play_circle</span>
          Start rondleiding
        </button>
      </div>`
    ).join('');

    banner.innerHTML = `
      <div class="guide-banner-inner">
        <div class="guide-banner-top">
          <div class="guide-banner-content">
            <h2><span class="material-symbols-rounded">${page.icon}</span> ${page.title}</h2>
            <p>${page.desc}</p>
            <div class="guide-roles">${roleTabs}</div>
            ${roleContents}
          </div>
          <button class="guide-close" title="Sluit uitleg">×</button>
        </div>
      </div>
    `;

    const nav = document.querySelector('.nav');
    if (nav) {
      nav.parentNode.insertBefore(banner, nav.nextSibling);
    } else {
      document.body.prepend(banner);
    }

    banner.querySelector('.guide-close').addEventListener('click', () => {
      banner.style.display = 'none';
      bannerVisible = false;
    });

    banner.querySelectorAll('.guide-role-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        currentRole = tab.dataset.role;
        banner.querySelectorAll('.guide-role-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        banner.querySelectorAll('.guide-role-content').forEach(c => c.classList.remove('visible'));
        banner.querySelector(`[data-role-content="${currentRole}"]`).classList.add('visible');
      });
    });

    banner.querySelectorAll('.tour-start-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const role = btn.dataset.tourRole;
        startTour(pageKey, role);
      });
    });
  }

  /* ========== FAB & BADGE ========== */

  function createFab() {
    const fab = document.createElement('button');
    fab.className = 'guide-fab';
    fab.id = 'guide-fab';
    fab.innerHTML = '<span class="material-symbols-rounded">help</span>';
    fab.title = 'Toon/verberg uitleg';
    document.body.appendChild(fab);

    fab.addEventListener('click', () => {
      if (tourActive) return;
      const banner = document.getElementById('guide-banner');
      if (banner) {
        bannerVisible = !bannerVisible;
        banner.style.display = bannerVisible ? '' : 'none';
        if (bannerVisible) {
          banner.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  }

  function createDemoBadge() {
    const badge = document.createElement('div');
    badge.className = 'demo-badge';
    badge.textContent = 'DEMO';
    const navInner = document.querySelector('.nav-inner');
    if (navInner) {
      navInner.style.position = 'relative';
      navInner.appendChild(badge);
    }
  }

  /* ========== TOUR ENGINE ========== */

  let backdropEl = null;
  let spotlightEl = null;
  let popoverEl = null;

  function createTourElements() {
    if (backdropEl) return;

    backdropEl = document.createElement('div');
    backdropEl.className = 'tour-backdrop';
    backdropEl.addEventListener('click', (e) => {
      if (e.target === backdropEl) endTour();
    });
    document.body.appendChild(backdropEl);

    spotlightEl = document.createElement('div');
    spotlightEl.className = 'tour-spotlight';
    document.body.appendChild(spotlightEl);

    popoverEl = document.createElement('div');
    popoverEl.className = 'tour-popover';
    document.body.appendChild(popoverEl);
  }

  function startTour(pageKey, role) {
    const pageTours = TOURS[pageKey];
    if (!pageTours || !pageTours[role]) return;

    tourSteps = pageTours[role];
    tourStepIndex = 0;
    tourActive = true;
    currentRole = role;

    const banner = document.getElementById('guide-banner');
    if (banner) banner.style.display = 'none';

    const fab = document.getElementById('guide-fab');
    if (fab) fab.style.display = 'none';

    createTourElements();
    backdropEl.classList.add('active');

    showTourStep();
  }

  function endTour() {
    tourActive = false;
    if (backdropEl) backdropEl.classList.remove('active');
    if (spotlightEl) {
      spotlightEl.style.display = 'none';
    }
    if (popoverEl) {
      popoverEl.classList.remove('visible');
      popoverEl.style.display = 'none';
    }

    const fab = document.getElementById('guide-fab');
    if (fab) fab.style.display = '';

    const banner = document.getElementById('guide-banner');
    if (banner) {
      banner.style.display = '';
      bannerVisible = true;
    }
  }

  function showTourStep() {
    if (!tourActive || tourStepIndex >= tourSteps.length) {
      endTour();
      return;
    }

    const step = tourSteps[tourStepIndex];
    const target = document.querySelector(step.sel);

    if (!target) {
      tourStepIndex++;
      showTourStep();
      return;
    }

    target.scrollIntoView({ behavior: 'smooth', block: 'center' });

    setTimeout(() => {
      positionSpotlight(target);
      positionPopover(target, step);
    }, 350);
  }

  function positionSpotlight(target) {
    const rect = target.getBoundingClientRect();
    const pad = 8;

    spotlightEl.style.display = 'block';
    spotlightEl.style.position = 'fixed';
    spotlightEl.style.left = (rect.left - pad) + 'px';
    spotlightEl.style.top = (rect.top - pad) + 'px';
    spotlightEl.style.width = (rect.width + pad * 2) + 'px';
    spotlightEl.style.height = (rect.height + pad * 2) + 'px';
    spotlightEl.style.borderRadius = '1rem';
  }

  function positionPopover(target, step) {
    const rect = target.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const roleInfo = ROLE_LABELS[currentRole];
    const totalSteps = tourSteps.length;

    const dots = tourSteps.map((_, i) => {
      let cls = 'tour-dot';
      if (i === tourStepIndex) cls += ' active';
      else if (i < tourStepIndex) cls += ' done';
      return `<div class="${cls}"></div>`;
    }).join('');

    const prevBtn = tourStepIndex > 0
      ? `<button class="tour-btn tour-btn-prev" id="tour-prev">
           <span class="material-symbols-rounded" style="font-size:1rem;">arrow_back</span> Vorige
         </button>`
      : '<div></div>';

    const isLast = tourStepIndex === totalSteps - 1;
    const nextBtn = `<button class="tour-btn tour-btn-next" id="tour-next">
        ${isLast ? 'Afronden' : 'Volgende'} 
        <span class="material-symbols-rounded" style="font-size:1rem;">${isLast ? 'check' : 'arrow_forward'}</span>
      </button>`;

    popoverEl.innerHTML = `
      <button class="tour-btn-close" id="tour-close">×</button>
      <div class="tour-role-label">
        <span class="material-symbols-rounded">${roleInfo.icon}</span>
        Rondleiding: ${roleInfo.label}
      </div>
      <div class="tour-header">
        <div class="tour-step-badge">${tourStepIndex + 1}</div>
        <div class="tour-title">${step.title}</div>
      </div>
      <div class="tour-text">${step.text}</div>
      <div class="tour-footer">
        ${prevBtn}
        <div class="tour-dots">${dots}</div>
        ${nextBtn}
      </div>
    `;

    let arrowHtml = '';
    let left, top;

    const popW = 340;
    const popH = popoverEl.offsetHeight || 240;
    const gap = 16;

    const spaceBelow = vh - rect.bottom;
    const spaceAbove = rect.top;
    const spaceRight = vw - rect.right;
    const spaceLeft = rect.left;

    if (spaceBelow > popH + gap + 30) {
      top = rect.bottom + gap;
      left = Math.max(16, Math.min(rect.left, vw - popW - 16));
      arrowHtml = '<div class="tour-popover-arrow top"></div>';
    } else if (spaceAbove > popH + gap + 30) {
      top = rect.top - gap - popH;
      left = Math.max(16, Math.min(rect.left, vw - popW - 16));
      arrowHtml = '<div class="tour-popover-arrow bottom"></div>';
    } else if (spaceRight > popW + gap) {
      top = Math.max(16, rect.top);
      left = rect.right + gap;
      arrowHtml = '<div class="tour-popover-arrow left"></div>';
    } else {
      top = Math.max(16, rect.top);
      left = Math.max(16, rect.left - popW - gap);
      arrowHtml = '<div class="tour-popover-arrow right"></div>';
    }

    popoverEl.insertAdjacentHTML('afterbegin', arrowHtml);

    popoverEl.style.display = 'block';
    popoverEl.style.position = 'fixed';
    popoverEl.style.left = left + 'px';
    popoverEl.style.top = top + 'px';
    popoverEl.style.zIndex = '402';

    requestAnimationFrame(() => {
      popoverEl.classList.add('visible');
    });

    document.getElementById('tour-close').addEventListener('click', endTour);
    document.getElementById('tour-next').addEventListener('click', () => {
      popoverEl.classList.remove('visible');
      tourStepIndex++;
      setTimeout(showTourStep, 200);
    });
    const prevEl = document.getElementById('tour-prev');
    if (prevEl) {
      prevEl.addEventListener('click', () => {
        popoverEl.classList.remove('visible');
        tourStepIndex--;
        setTimeout(showTourStep, 200);
      });
    }
  }

  /* Key handler for tour */
  document.addEventListener('keydown', (e) => {
    if (!tourActive) return;
    if (e.key === 'Escape') endTour();
    if (e.key === 'ArrowRight' || e.key === ' ') {
      e.preventDefault();
      popoverEl.classList.remove('visible');
      tourStepIndex++;
      setTimeout(showTourStep, 200);
    }
    if (e.key === 'ArrowLeft' && tourStepIndex > 0) {
      e.preventDefault();
      popoverEl.classList.remove('visible');
      tourStepIndex--;
      setTimeout(showTourStep, 200);
    }
  });

  /* Handle window resize during tour */
  window.addEventListener('resize', () => {
    if (tourActive && tourSteps[tourStepIndex]) {
      const target = document.querySelector(tourSteps[tourStepIndex].sel);
      if (target) positionSpotlight(target);
    }
  });

  /* ========== INIT ========== */

  function init() {
    const pageKey = getPageKey();
    createDemoBadge();
    createBanner(pageKey);
    createFab();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
