export const DEFAULT_LANGUAGE = "en";
export const LANGUAGE_STORAGE_KEY = "gigvora.language";

export const SUPPORTED_LANGUAGES = [
  {
    code: "en",
    label: "English",
    nativeLabel: "English",
    flag: "🇬🇧",
    region: "Global",
    coverage: 100,
    status: "ga",
    supportLead: "London localisation studio",
    lastUpdated: "2024-05-12T09:00:00Z",
    summary:
      "Editorial canon reviewed quarterly with AI prompts tuned for English-first teams and global partners.",
  },
  {
    code: "fr",
    label: "French",
    nativeLabel: "Français",
    flag: "🇫🇷",
    region: "France • Canada • Belgium",
    coverage: 96,
    status: "ga",
    supportLead: "Paris localisation squad",
    lastUpdated: "2024-04-22T08:30:00Z",
    summary:
      "Trust, billing, and marketplace surfaces are fully translated with weekly QA on mentorship copy.",
  },
  {
    code: "es",
    label: "Spanish",
    nativeLabel: "Español",
    flag: "🇪🇸",
    region: "Spain • LATAM",
    coverage: 94,
    status: "ga",
    supportLead: "Madrid localisation pod",
    lastUpdated: "2024-04-29T10:15:00Z",
    summary:
      "Marketplace, wallet, and mentorship journeys include in-market tone while knowledge base updates ship twice weekly.",
  },
  {
    code: "pt",
    label: "Portuguese",
    nativeLabel: "Português",
    flag: "🇵🇹",
    region: "Portugal • Brazil",
    coverage: 88,
    status: "beta",
    supportLead: "Lisbon localisation guild",
    lastUpdated: "2024-04-18T14:45:00Z",
    summary:
      "Core dashboards and billing flows localised; professional services copy is in beta with feedback loops every sprint.",
  },
  {
    code: "it",
    label: "Italian",
    nativeLabel: "Italiano",
    flag: "🇮🇹",
    region: "Italy",
    coverage: 86,
    status: "beta",
    supportLead: "Milan editorial partners",
    lastUpdated: "2024-04-09T11:20:00Z",
    summary:
      "Navigation, invoicing, and mentorship modules complete; supply-side insights land in May localisation drop.",
  },
  {
    code: "pl",
    label: "Polish",
    nativeLabel: "Polski",
    flag: "🇵🇱",
    region: "Poland • CEE",
    coverage: 82,
    status: "beta",
    supportLead: "Warsaw partner desk",
    lastUpdated: "2024-03-28T07:00:00Z",
    summary:
      "Hiring workflows and compliance rails complete; mentor marketing copy undergoing editorial QA.",
  },
  {
    code: "hi",
    label: "Hindi",
    nativeLabel: "हिन्दी",
    flag: "🇮🇳",
    region: "India",
    coverage: 78,
    status: "preview",
    supportLead: "Bengaluru enablement hub",
    lastUpdated: "2024-03-18T06:45:00Z",
    summary:
      "Dashboard chrome, jobs, and messaging flows in preview; finance and legal copy due next localisation cycle.",
  },
  {
    code: "ar",
    label: "Arabic",
    nativeLabel: "العربية",
    flag: "🇦🇪",
    region: "MENA",
    coverage: 74,
    status: "preview",
    supportLead: "Dubai localisation studio",
    lastUpdated: "2024-03-05T15:10:00Z",
    summary:
      "RTL layout, navigation, and trust centre localised; analytics wording under joint review with compliance leads.",
  },
  {
    code: "de",
    label: "German",
    nativeLabel: "Deutsch",
    flag: "🇩🇪",
    region: "Germany • DACH",
    coverage: 92,
    status: "ga",
    supportLead: "Berlin localisation chapter",
    lastUpdated: "2024-04-12T12:25:00Z",
    summary:
      "Enterprise billing, compliance, and analytics dashboards fully reviewed with legal-approved terminology.",
  },
  {
    code: "ru",
    label: "Russian",
    nativeLabel: "Русский",
    flag: "🇷🇺",
    region: "Central & Eastern Europe",
    coverage: 81,
    status: "preview",
    supportLead: "Tallinn localisation pod",
    lastUpdated: "2024-03-11T09:35:00Z",
    summary:
      "Marketplace and onboarding flows translated; compliance language is in stakeholder review ahead of GA.",
  },
];

export const LANGUAGE_DIRECTIONS = {
  ar: "rtl",
};

function deepFreeze(value) {
  if (!value || typeof value !== "object") {
    return value;
  }
  Object.freeze(value);
  Object.keys(value).forEach((key) => {
    const child = value[key];
    if (child && typeof child === "object" && !Object.isFrozen(child)) {
      deepFreeze(child);
    }
  });
  return value;
}

const translationsMap = {
  en: {
    language: {
      label: "Language",
      menuTitle: "Choose your language",
      ariaLabel: "Change language",
    },
    navigation: {
      feed: "Live Feed",
      explorer: "Explorer",
      jobs: "Jobs",
      gigs: "Gigs",
      projects: "Projects",
      launchpad: "Launchpad",
      volunteering: "Volunteering",
      groups: "Groups",
      pages: "Pages",
      mentors: "Mentors",
      inbox: "Inbox",
      "security-operations": "Security Ops",
      profile: "Profile",
    },
    menu: {
      dashboard: "Dashboard",
      profile: "Profile",
      notifications: "Notifications",
      messages: "Messages",
      markAllRead: "Mark all read",
      openNotificationCenter: "Open notification centre",
      openInbox: "Open inbox",
      financialHub: "Financial hub",
      trustCenter: "Trust centre",
      supportCenter: "Support centre",
      securityOperations: "Security operations",
      logout: "Logout",
      requestAccess: "Request access",
      manageMemberships: "Manage memberships",
      contactSupport: "Contact support",
    },
    auth: {
      login: "Login",
      register: "Join Now",
      startProfile: "Start your free profile",
      watchTour: "Watch a 90-second walk-through",
    },
    assistants: {
      messaging: {
        inboxTab: "Inbox",
        supportTab: "Support",
        subtitle: "Secure messaging, calls, and files for every workspace.",
        supportSubtitle: "Switch to the trust centre for ticket analytics and SLAs.",
        syncedCopy: "Synced across dashboards for teams and partners.",
        refresh: "Refresh",
        signInPrompt: "Sign in to view your organisation inbox, start calls, and collaborate in real time.",
        emptyThreads: "Start a conversation with collaborators or clients. Threads appear here once you create them.",
        privateNotes: "Private notes",
        startVideo: "Start video",
        startVoice: "Start voice",
        loadOlder: "Load older conversations",
        loadingOlder: "Loading more conversations…",
        emptyMessages: "Introduce the team, share files, and schedule calls – messages appear here in real time.",
        signInToRead: "Sign in to read and send messages.",
        composePlaceholder: "Write your reply…",
        composeDisabled: "Sign in to send messages",
        composeHintActive: "Files, reactions, and approvals sync across dashboards.",
        composeHintEmpty: "Select a conversation to reply.",
        send: "Send",
        supportBody:
          "Our support specialists respond within minutes during UK and EU hours. Start a thread here or launch the full trust centre.",
        visitSupport: "Visit support centre",
        tipTitle: "Latest tip",
        tipBody:
          "Launch a video or voice call directly from any project thread – the audit log and recordings stay in sync.",
      },
    },
    hero: {
      tagline: "Gigvora platform",
      heading: "Hire brilliantly. Collaborate beautifully.",
      subheading:
        "Gigvora pairs curated talent with effortless workflows so your team can launch ideas without the jargon and without the wait.",
      liveMoments: "Live moments",
      liveMomentsDescription: "Real teams shipping now",
      statusBadge: "In sync",
      stats: {
        teams: "teams scaling global talent",
        projects: "projects delivered with heart",
        onboarding: "average onboarding time",
      },
      deckSubtitle: "Web and mobile dashboards stay perfectly in step.",
    },
    home: {
      guestTitle: "Gigvora home",
      guestSubtitle: "Sign in to unlock personalised dashboards",
      guestDescription: "Pick a path to join the network or return to your saved progress.",
      guestLogin: "Sign in to continue",
      guestRegister: "Create a Gigvora profile",
      guestInfo:
        "Not sure where to start? Tap \"Create a Gigvora profile\" to explore freelancer, company, and agency onboarding.",
    },
  },
  fr: {
    language: {
      label: "Langue",
      menuTitle: "Choisissez votre langue",
      ariaLabel: "Changer de langue",
    },
    navigation: {
      feed: "Fil en direct",
      explorer: "Explorateur",
      jobs: "Offres",
      gigs: "Missions",
      projects: "Projets",
      launchpad: "Plateforme de lancement",
      volunteering: "Bénévolat",
      groups: "Groupes",
      pages: "Pages",
      mentors: "Mentors",
      inbox: "Boîte de réception",
      "security-operations": "Ops sécurité",
      profile: "Profil",
    },
    menu: {
      dashboard: "Tableau de bord",
      profile: "Profil",
      notifications: "Notifications",
      messages: "Messages",
      markAllRead: "Tout marquer comme lu",
      openNotificationCenter: "Ouvrir le centre de notifications",
      openInbox: "Ouvrir la boîte de réception",
      financialHub: "Centre financier",
      trustCenter: "Centre de confiance",
      supportCenter: "Centre d'assistance",
      securityOperations: "Opérations de sécurité",
      logout: "Déconnexion",
      requestAccess: "Demander l'accès",
      manageMemberships: "Gérer les adhésions",
      contactSupport: "Contacter le support",
    },
    auth: {
      login: "Connexion",
      register: "Rejoindre maintenant",
      startProfile: "Créer votre profil gratuit",
      watchTour: "Regarder une présentation de 90 secondes",
    },
    assistants: {
      messaging: {
        inboxTab: "Boîte de réception",
        supportTab: "Support",
        subtitle: "Messagerie sécurisée, appels et fichiers pour chaque espace de travail.",
        supportSubtitle: "Basculez vers le centre de confiance pour les analyses de tickets et les SLA.",
        syncedCopy: "Synchronisé sur les tableaux de bord des équipes et partenaires.",
        refresh: "Actualiser",
        signInPrompt: "Connectez-vous pour voir la messagerie de votre organisation, lancer des appels et collaborer en direct.",
        emptyThreads:
          "Démarrez une conversation avec des collaborateurs ou clients. Les fils apparaissent ici après leur création.",
        privateNotes: "Notes privées",
        startVideo: "Démarrer la vidéo",
        startVoice: "Démarrer l'audio",
        loadOlder: "Charger les conversations plus anciennes",
        loadingOlder: "Chargement des conversations…",
        emptyMessages:
          "Présentez l'équipe, partagez des fichiers et planifiez des appels – les messages s'affichent ici en temps réel.",
        signInToRead: "Connectez-vous pour lire et envoyer des messages.",
        composePlaceholder: "Écrire votre réponse…",
        composeDisabled: "Connectez-vous pour envoyer des messages",
        composeHintActive: "Les fichiers, réactions et validations restent synchronisés sur les tableaux de bord.",
        composeHintEmpty: "Sélectionnez une conversation pour répondre.",
        send: "Envoyer",
        supportBody:
          "Nos spécialistes répondent en quelques minutes pendant les heures UK et UE. Lancez un fil ici ou ouvrez le centre de confiance.",
        visitSupport: "Visiter le centre de support",
        tipTitle: "Dernier conseil",
        tipBody:
          "Lancez un appel vidéo ou audio depuis n'importe quel fil – le journal d'audit et les enregistrements restent synchronisés.",
      },
    },
    hero: {
      tagline: "Plateforme Gigvora",
      heading: "Recrutez brillamment. Collaborez avec élégance.",
      subheading:
        "Gigvora associe des talents sélectionnés à des flux de travail fluides pour que votre équipe lance des idées sans jargon ni attente.",
      liveMoments: "Moments en direct",
      liveMomentsDescription: "Équipes réelles en production",
      statusBadge: "Synchronisé",
      stats: {
        teams: "équipes développant des talents mondiaux",
        projects: "projets livrés avec passion",
        onboarding: "délai moyen d'intégration",
      },
      deckSubtitle: "Les tableaux de bord web et mobile restent parfaitement synchronisés.",
    },
    home: {
      guestTitle: "Accueil Gigvora",
      guestSubtitle: "Connectez-vous pour déverrouiller des tableaux de bord personnalisés",
      guestDescription: "Choisissez un parcours pour rejoindre le réseau ou revenir à votre progression enregistrée.",
      guestLogin: "Se connecter pour continuer",
      guestRegister: "Créer un profil Gigvora",
      guestInfo:
        "Vous ne savez pas par où commencer ? Touchez « Créer un profil Gigvora » pour explorer les parcours indépendant, entreprise et agence.",
    },
  },
  es: {
    language: {
      label: "Idioma",
      menuTitle: "Elige tu idioma",
      ariaLabel: "Cambiar idioma",
    },
    navigation: {
      feed: "Transmisión en vivo",
      explorer: "Explorador",
      jobs: "Empleos",
      gigs: "Trabajos",
      projects: "Proyectos",
      launchpad: "Plataforma de lanzamiento",
      volunteering: "Voluntariado",
      groups: "Grupos",
      pages: "Páginas",
      mentors: "Mentores",
      inbox: "Bandeja de entrada",
      "security-operations": "Operaciones de seguridad",
      profile: "Perfil",
    },
    menu: {
      dashboard: "Panel",
      profile: "Perfil",
      notifications: "Notificaciones",
      messages: "Mensajes",
      markAllRead: "Marcar todo como leído",
      openNotificationCenter: "Abrir centro de notificaciones",
      openInbox: "Abrir bandeja de entrada",
      financialHub: "Centro financiero",
      trustCenter: "Centro de confianza",
      supportCenter: "Centro de soporte",
      securityOperations: "Operaciones de seguridad",
      logout: "Cerrar sesión",
      requestAccess: "Solicitar acceso",
      manageMemberships: "Gestionar membresías",
      contactSupport: "Contactar soporte",
    },
    auth: {
      login: "Iniciar sesión",
      register: "Únete ahora",
      startProfile: "Crea tu perfil gratis",
      watchTour: "Ver recorrido de 90 segundos",
    },
    assistants: {
      messaging: {
        inboxTab: "Bandeja",
        supportTab: "Soporte",
        subtitle: "Mensajería segura, llamadas y archivos para cada espacio de trabajo.",
        supportSubtitle: "Cambia al centro de confianza para ver analíticas de tickets y SLA.",
        syncedCopy: "Sincronizado en tableros de equipos y socios.",
        refresh: "Actualizar",
        signInPrompt: "Inicia sesión para ver el buzón de tu organización, comenzar llamadas y colaborar en tiempo real.",
        emptyThreads:
          "Inicia una conversación con colaboradores o clientes. Los hilos aparecerán aquí cuando los crees.",
        privateNotes: "Notas privadas",
        startVideo: "Iniciar video",
        startVoice: "Iniciar voz",
        loadOlder: "Cargar conversaciones anteriores",
        loadingOlder: "Cargando más conversaciones…",
        emptyMessages:
          "Presenta al equipo, comparte archivos y programa llamadas; los mensajes aparecen aquí en tiempo real.",
        signInToRead: "Inicia sesión para leer y enviar mensajes.",
        composePlaceholder: "Escribe tu respuesta…",
        composeDisabled: "Inicia sesión para enviar mensajes",
        composeHintActive: "Los archivos, reacciones y aprobaciones se sincronizan en todos los tableros.",
        composeHintEmpty: "Selecciona una conversación para responder.",
        send: "Enviar",
        supportBody:
          "Nuestros especialistas responden en minutos durante el horario de Reino Unido y la UE. Inicia un hilo aquí o abre el centro de confianza.",
        visitSupport: "Visitar centro de soporte",
        tipTitle: "Último consejo",
        tipBody:
          "Lanza una llamada de video o voz desde cualquier hilo; el registro de auditoría y las grabaciones permanecen sincronizados.",
      },
    },
    hero: {
      tagline: "Plataforma Gigvora",
      heading: "Contrata con brillantez. Colabora con estilo.",
      subheading:
        "Gigvora conecta talento seleccionado con flujos de trabajo sin fricción para que tu equipo lance ideas sin jerga ni demoras.",
      liveMoments: "Momentos en vivo",
      liveMomentsDescription: "Equipos reales produciendo ahora",
      statusBadge: "Sincronizado",
      stats: {
        teams: "equipos potenciando talento global",
        projects: "proyectos entregados con pasión",
        onboarding: "tiempo medio de incorporación",
      },
      deckSubtitle: "Los paneles web y móviles se mantienen perfectamente sincronizados.",
    },
    home: {
      guestTitle: "Inicio Gigvora",
      guestSubtitle: "Inicia sesión para desbloquear paneles personalizados",
      guestDescription: "Elige un camino para unirte a la red o retomar tu progreso guardado.",
      guestLogin: "Inicia sesión para continuar",
      guestRegister: "Crea un perfil Gigvora",
      guestInfo:
        "¿No sabes por dónde empezar? Pulsa «Crear un perfil Gigvora» para explorar los recorridos de freelancer, empresa y agencia.",
    },
  },
  pt: {
    language: {
      label: "Idioma",
      menuTitle: "Escolha seu idioma",
      ariaLabel: "Alterar idioma",
    },
    navigation: {
      feed: "Feed ao vivo",
      explorer: "Explorador",
      jobs: "Vagas",
      gigs: "Projetos",
      projects: "Projetos",
      launchpad: "Base de lançamento",
      volunteering: "Voluntariado",
      groups: "Grupos",
      pages: "Páginas",
      mentors: "Mentores",
      inbox: "Caixa de entrada",
      "security-operations": "Operações de segurança",
      profile: "Perfil",
    },
    menu: {
      dashboard: "Painel",
      profile: "Perfil",
      notifications: "Notificações",
      messages: "Mensagens",
      markAllRead: "Marcar tudo como lido",
      openNotificationCenter: "Abrir centro de notificações",
      openInbox: "Abrir caixa de entrada",
      financialHub: "Centro financeiro",
      trustCenter: "Centro de confiança",
      supportCenter: "Centro de suporte",
      securityOperations: "Operações de segurança",
      logout: "Sair",
      requestAccess: "Solicitar acesso",
      manageMemberships: "Gerenciar associações",
      contactSupport: "Contatar suporte",
    },
    auth: {
      login: "Entrar",
      register: "Junte-se agora",
      startProfile: "Crie seu perfil gratuito",
      watchTour: "Assistir apresentação de 90 segundos",
    },
    assistants: {
      messaging: {
        inboxTab: "Caixa",
        supportTab: "Suporte",
        subtitle: "Mensagens seguras, chamadas e ficheiros para cada espaço de trabalho.",
        supportSubtitle: "Mude para o centro de confiança para análises de tickets e SLAs.",
        syncedCopy: "Sincronizado nos painéis de equipas e parceiros.",
        refresh: "Atualizar",
        signInPrompt: "Inicie sessão para ver a caixa da organização, iniciar chamadas e colaborar em tempo real.",
        emptyThreads:
          "Inicie uma conversa com colaboradores ou clientes. As conversas surgem aqui após serem criadas.",
        privateNotes: "Notas privadas",
        startVideo: "Iniciar vídeo",
        startVoice: "Iniciar áudio",
        loadOlder: "Carregar conversas anteriores",
        loadingOlder: "A carregar mais conversas…",
        emptyMessages:
          "Apresente a equipa, partilhe ficheiros e agende chamadas – as mensagens aparecem aqui em tempo real.",
        signInToRead: "Inicie sessão para ler e enviar mensagens.",
        composePlaceholder: "Escreva a sua resposta…",
        composeDisabled: "Inicie sessão para enviar mensagens",
        composeHintActive: "Ficheiros, reações e aprovações ficam sincronizados nos painéis.",
        composeHintEmpty: "Selecione uma conversa para responder.",
        send: "Enviar",
        supportBody:
          "Os nossos especialistas respondem em minutos durante o horário do Reino Unido e da UE. Inicie um tópico aqui ou abra o centro de confiança.",
        visitSupport: "Visitar centro de suporte",
        tipTitle: "Última dica",
        tipBody:
          "Inicie uma chamada de vídeo ou áudio a partir de qualquer tópico – o registo e as gravações permanecem sincronizados.",
      },
    },
    hero: {
      tagline: "Plataforma Gigvora",
      heading: "Contrate com brilho. Colabore com beleza.",
      subheading:
        "A Gigvora conecta talentos selecionados a fluxos de trabalho sem atrito para que sua equipe lance ideias sem jargões e sem espera.",
      liveMoments: "Momentos ao vivo",
      liveMomentsDescription: "Equipes reais entregando agora",
      statusBadge: "Sincronizado",
      stats: {
        teams: "equipes escalando talento global",
        projects: "projetos entregues com cuidado",
        onboarding: "tempo médio de integração",
      },
      deckSubtitle: "Os painéis web e mobile permanecem perfeitamente sincronizados.",
    },
    home: {
      guestTitle: "Início Gigvora",
      guestSubtitle: "Faça login para desbloquear painéis personalizados",
      guestDescription: "Escolha um caminho para entrar na rede ou retomar o seu progresso salvo.",
      guestLogin: "Entrar para continuar",
      guestRegister: "Criar um perfil Gigvora",
      guestInfo:
        "Não sabe por onde começar? Toque em «Criar um perfil Gigvora» para explorar os fluxos de freelancer, empresa e agência.",
    },
  },
  it: {
    language: {
      label: "Lingua",
      menuTitle: "Scegli la tua lingua",
      ariaLabel: "Cambia lingua",
    },
    navigation: {
      feed: "Feed live",
      explorer: "Esploratore",
      jobs: "Offerte",
      gigs: "Incarichi",
      projects: "Progetti",
      launchpad: "Piattaforma di lancio",
      volunteering: "Volontariato",
      groups: "Gruppi",
      pages: "Pagine",
      mentors: "Mentor",
      inbox: "Posta in arrivo",
      "security-operations": "Operazioni di sicurezza",
      profile: "Profilo",
    },
    menu: {
      dashboard: "Cruscotto",
      profile: "Profilo",
      notifications: "Notifiche",
      messages: "Messaggi",
      markAllRead: "Segna tutto come letto",
      openNotificationCenter: "Apri centro notifiche",
      openInbox: "Apri posta in arrivo",
      financialHub: "Hub finanziario",
      trustCenter: "Centro fiducia",
      supportCenter: "Centro assistenza",
      securityOperations: "Operazioni di sicurezza",
      logout: "Disconnetti",
      requestAccess: "Richiedi accesso",
      manageMemberships: "Gestisci iscrizioni",
      contactSupport: "Contatta il supporto",
    },
    auth: {
      login: "Accedi",
      register: "Unisciti ora",
      startProfile: "Crea il tuo profilo gratuito",
      watchTour: "Guarda il tour di 90 secondi",
    },
    assistants: {
      messaging: {
        inboxTab: "Posta",
        supportTab: "Supporto",
        subtitle: "Messaggistica sicura, chiamate e file per ogni spazio di lavoro.",
        supportSubtitle: "Passa al centro fiducia per analisi ticket e SLA.",
        syncedCopy: "Sincronizzato su dashboard di team e partner.",
        refresh: "Aggiorna",
        signInPrompt: "Accedi per vedere la posta della tua organizzazione, avviare chiamate e collaborare in tempo reale.",
        emptyThreads:
          "Avvia una conversazione con collaboratori o clienti. I thread appariranno qui dopo la creazione.",
        privateNotes: "Note private",
        startVideo: "Avvia video",
        startVoice: "Avvia audio",
        loadOlder: "Carica conversazioni precedenti",
        loadingOlder: "Caricamento delle conversazioni…",
        emptyMessages:
          "Presenta il team, condividi file e pianifica chiamate: i messaggi compaiono qui in tempo reale.",
        signInToRead: "Accedi per leggere e inviare messaggi.",
        composePlaceholder: "Scrivi la tua risposta…",
        composeDisabled: "Accedi per inviare messaggi",
        composeHintActive: "File, reazioni e approvazioni restano sincronizzati sulle dashboard.",
        composeHintEmpty: "Seleziona una conversazione per rispondere.",
        send: "Invia",
        supportBody:
          "I nostri specialisti rispondono in pochi minuti durante l'orario del Regno Unito e dell'UE. Avvia un thread qui o apri il centro fiducia.",
        visitSupport: "Visita il centro di supporto",
        tipTitle: "Ultimo suggerimento",
        tipBody:
          "Avvia una chiamata video o audio da qualsiasi thread: registro e registrazioni restano sincronizzati.",
      },
    },
    hero: {
      tagline: "Piattaforma Gigvora",
      heading: "Assumi con brillantezza. Collabora con stile.",
      subheading:
        "Gigvora abbina talenti selezionati a flussi di lavoro fluidi così il tuo team lancia idee senza gergo e senza attese.",
      liveMoments: "Momenti live",
      liveMomentsDescription: "Team reali all'opera ora",
      statusBadge: "Sincronizzato",
      stats: {
        teams: "team che scalano talenti globali",
        projects: "progetti consegnati con cura",
        onboarding: "tempo medio di onboarding",
      },
      deckSubtitle: "Le dashboard web e mobile restano perfettamente allineate.",
    },
    home: {
      guestTitle: "Home Gigvora",
      guestSubtitle: "Accedi per sbloccare dashboard personalizzate",
      guestDescription: "Scegli un percorso per unirti alla rete o riprendere i progressi salvati.",
      guestLogin: "Accedi per continuare",
      guestRegister: "Crea un profilo Gigvora",
      guestInfo:
        "Non sai da dove iniziare? Tocca «Crea un profilo Gigvora» per esplorare i percorsi freelancer, azienda e agenzia.",
    },
  },
  pl: {
    language: {
      label: "Język",
      menuTitle: "Wybierz swój język",
      ariaLabel: "Zmień język",
    },
    navigation: {
      feed: "Aktualności na żywo",
      explorer: "Eksplorator",
      jobs: "Oferty pracy",
      gigs: "Zlecenia",
      projects: "Projekty",
      launchpad: "Platforma startowa",
      volunteering: "Wolontariat",
      groups: "Grupy",
      pages: "Strony",
      mentors: "Mentorzy",
      inbox: "Skrzynka odbiorcza",
      "security-operations": "Operacje bezpieczeństwa",
      profile: "Profil",
    },
    menu: {
      dashboard: "Panel",
      profile: "Profil",
      notifications: "Powiadomienia",
      messages: "Wiadomości",
      markAllRead: "Oznacz wszystko jako przeczytane",
      openNotificationCenter: "Otwórz centrum powiadomień",
      openInbox: "Otwórz skrzynkę odbiorczą",
      financialHub: "Centrum finansowe",
      trustCenter: "Centrum zaufania",
      supportCenter: "Centrum wsparcia",
      securityOperations: "Operacje bezpieczeństwa",
      logout: "Wyloguj",
      requestAccess: "Poproś o dostęp",
      manageMemberships: "Zarządzaj członkostwami",
      contactSupport: "Skontaktuj się ze wsparciem",
    },
    auth: {
      login: "Zaloguj się",
      register: "Dołącz teraz",
      startProfile: "Utwórz darmowy profil",
      watchTour: "Obejrzyj 90-sekundowy przegląd",
    },
    assistants: {
      messaging: {
        inboxTab: "Skrzynka",
        supportTab: "Wsparcie",
        subtitle: "Bezpieczne wiadomości, połączenia i pliki dla każdego workspace'u.",
        supportSubtitle: "Przejdź do centrum zaufania, aby zobaczyć analitykę zgłoszeń i SLA.",
        syncedCopy: "Zsynchronizowane na panelach zespołów i partnerów.",
        refresh: "Odśwież",
        signInPrompt: "Zaloguj się, aby zobaczyć skrzynkę organizacji, rozpocząć połączenia i współpracować na żywo.",
        emptyThreads:
          "Rozpocznij rozmowę z współpracownikami lub klientami. Wątki pojawią się tutaj po utworzeniu.",
        privateNotes: "Notatki prywatne",
        startVideo: "Rozpocznij wideo",
        startVoice: "Rozpocznij audio",
        loadOlder: "Wczytaj starsze rozmowy",
        loadingOlder: "Wczytywanie kolejnych rozmów…",
        emptyMessages:
          "Przedstaw zespół, udostępnij pliki i zaplanuj połączenia – wiadomości pojawiają się tutaj w czasie rzeczywistym.",
        signInToRead: "Zaloguj się, aby czytać i wysyłać wiadomości.",
        composePlaceholder: "Napisz odpowiedź…",
        composeDisabled: "Zaloguj się, aby wysyłać wiadomości",
        composeHintActive: "Pliki, reakcje i akceptacje pozostają zsynchronizowane na panelach.",
        composeHintEmpty: "Wybierz rozmowę, aby odpowiedzieć.",
        send: "Wyślij",
        supportBody:
          "Nasi specjaliści odpowiadają w kilka minut w godzinach pracy w UK i UE. Rozpocznij wątek tutaj lub otwórz centrum zaufania.",
        visitSupport: "Odwiedź centrum wsparcia",
        tipTitle: "Ostatnia wskazówka",
        tipBody:
          "Uruchom połączenie wideo lub głosowe z dowolnego wątku – dziennik audytu i nagrania pozostają zsynchronizowane.",
      },
    },
    hero: {
      tagline: "Platforma Gigvora",
      heading: "Rekrutuj z klasą. Współpracuj pięknie.",
      subheading:
        "Gigvora łączy wyselekcjonowane talenty z płynnymi procesami, dzięki czemu Twój zespół uruchamia pomysły bez żargonu i zwłoki.",
      liveMoments: "Wydarzenia na żywo",
      liveMomentsDescription: "Prawdziwe zespoły działające teraz",
      statusBadge: "Zsynchronizowano",
      stats: {
        teams: "zespoły rozwijające globalne talenty",
        projects: "projekty dostarczane z pasją",
        onboarding: "średni czas wdrożenia",
      },
      deckSubtitle: "Panele webowe i mobilne pozostają doskonale zsynchronizowane.",
    },
    home: {
      guestTitle: "Strona główna Gigvora",
      guestSubtitle: "Zaloguj się, aby odblokować spersonalizowane pulpity",
      guestDescription: "Wybierz ścieżkę, aby dołączyć do sieci lub wrócić do zapisanych postępów.",
      guestLogin: "Zaloguj się, aby kontynuować",
      guestRegister: "Utwórz profil Gigvora",
      guestInfo:
        "Nie wiesz, od czego zacząć? Dotknij «Utwórz profil Gigvora», aby poznać ścieżки freelancera, firmy i agencji.",
    },
  },
  hi: {
    language: {
      label: "भाषा",
      menuTitle: "अपनी भाषा चुनें",
      ariaLabel: "भाषा बदलें",
    },
    navigation: {
      feed: "लाइव फ़ीड",
      explorer: "एक्सप्लोरर",
      jobs: "नौकरियाँ",
      gigs: "गिग्स",
      projects: "प्रोजेक्ट्स",
      launchpad: "लॉन्चपैड",
      volunteering: "स्वयंसेवा",
      groups: "समूह",
      pages: "पृष्ठ",
      mentors: "मार्गदर्शक",
      inbox: "इनबॉक्स",
      "security-operations": "सुरक्षा संचालन",
      profile: "प्रोफ़ाइल",
    },
    menu: {
      dashboard: "डैशबोर्ड",
      profile: "प्रोफ़ाइल",
      notifications: "सूचनाएँ",
      messages: "संदेश",
      markAllRead: "सभी को पढ़ा चिह्नित करें",
      openNotificationCenter: "सूचना केंद्र खोलें",
      openInbox: "इनबॉक्स खोलें",
      financialHub: "वित्तीय हब",
      trustCenter: "ट्रस्ट सेंटर",
      supportCenter: "सहायता केंद्र",
      securityOperations: "सुरक्षा संचालन",
      logout: "लॉगआउट",
      requestAccess: "पहुंच का अनुरोध करें",
      manageMemberships: "सदस्यता प्रबंधित करें",
      contactSupport: "सपोर्ट से संपर्क करें",
    },
    auth: {
      login: "लॉगिन",
      register: "अभी शामिल हों",
      startProfile: "अपना निःशुल्क प्रोफ़ाइल शुरू करें",
      watchTour: "90 सेकंड का वॉक-थ्रू देखें",
    },
    assistants: {
      messaging: {
        inboxTab: "इनबॉक्स",
        supportTab: "सहायता",
        subtitle: "हर कार्यस्थान के लिए सुरक्षित संदेश, कॉल और फ़ाइलें।",
        supportSubtitle: "टिकट विश्लेषण और SLA के लिए ट्रस्ट सेंटर पर स्विच करें।",
        syncedCopy: "टीम और पार्टनर डैशबोर्ड पर समन्वयित।",
        refresh: "रिफ़्रेश",
        signInPrompt: "अपने संगठन का इनबॉक्स देखने, कॉल शुरू करने और वास्तविक समय में सहयोग करने के लिए साइन इन करें।",
        emptyThreads:
          "सहकर्मियों या ग्राहकों के साथ बातचीत शुरू करें। बनाते ही थ्रेड यहाँ दिखाई देंगे।",
        privateNotes: "निजी नोट्स",
        startVideo: "वीडियो शुरू करें",
        startVoice: "आवाज़ शुरू करें",
        loadOlder: "पुरानी बातचीत लोड करें",
        loadingOlder: "अधिक बातचीत लोड हो रही हैं…",
        emptyMessages:
          "टीम का परिचय दें, फ़ाइलें साझा करें और कॉल शेड्यूल करें – संदेश वास्तविक समय में यहाँ दिखाई देंगे।",
        signInToRead: "संदेश पढ़ने और भेजने के लिए साइन इन करें।",
        composePlaceholder: "अपना उत्तर लिखें…",
        composeDisabled: "संदेश भेजने के लिए साइन इन करें",
        composeHintActive: "फ़ाइलें, प्रतिक्रियाएँ और अनुमोदन सभी डैशबोर्ड पर सिंक रहते हैं।",
        composeHintEmpty: "उत्तर देने के लिए कोई बातचीत चुनें।",
        send: "भेजें",
        supportBody:
          "हमारे विशेषज्ञ यूके और ईयू समय में कुछ ही मिनटों में जवाब देते हैं। यहाँ थ्रेड शुरू करें या ट्रस्ट सेंटर खोलें।",
        visitSupport: "सपोर्ट सेंटर देखें",
        tipTitle: "नवीनतम सुझाव",
        tipBody:
          "किसी भी थ्रेड से वीडियो या वॉइस कॉल शुरू करें – ऑडिट लॉग और रिकॉर्डिंग समन्वित रहते हैं।",
      },
    },
    hero: {
      tagline: "गिगवोरा प्लेटफ़ॉर्म",
      heading: "बेहतर भर्ती करें। सुंदर सहयोग करें।",
      subheading:
        "गिगवोरा चुने हुए टैलेंट को सहज वर्कफ़्लो से जोड़ता है ताकि आपकी टीम बिना जटिल शब्दों और बिना इंतज़ार के विचार लॉन्च कर सके।",
      liveMoments: "लाइव क्षण",
      liveMomentsDescription: "अभी डिलीवर करते वास्तविक टीमें",
      statusBadge: "समन्वय में",
      stats: {
        teams: "वैश्विक टैलेंट को स्केल करने वाली टीमें",
        projects: "जुनून से डिलीवर किए गए प्रोजेक्ट्स",
        onboarding: "औसत ऑनबोर्डिंग समय",
      },
      deckSubtitle: "वेब और मोबाइल डैशबोर्ड पूरी तरह समन्वित रहते हैं।",
    },
    home: {
      guestTitle: "गिगवोरा होम",
      guestSubtitle: "व्यक्तिगत डैशबोर्ड अनलॉक करने के लिए साइन इन करें",
      guestDescription: "नेटवर्क से जुड़ने या अपने सहेजे हुए प्रगति पर लौटने के लिए एक रास्ता चुनें।",
      guestLogin: "जारी रखने के लिए साइन इन करें",
      guestRegister: "गिगवोरा प्रोफ़ाइल बनाएँ",
      guestInfo:
        "समझ नहीं आ रहा कहाँ से शुरू करें? फ़्रीलांसर, कंपनी और एजेंसी ऑनबोर्डिंग देखने के लिए \"गिगवोरा प्रोफ़ाइल बनाएँ\" टैप करें।",
    },
  },
  ar: {
    language: {
      label: "اللغة",
      menuTitle: "اختر لغتك",
      ariaLabel: "تغيير اللغة",
    },
    navigation: {
      feed: "البث المباشر",
      explorer: "المستكشف",
      jobs: "الوظائف",
      gigs: "العقود",
      projects: "المشروعات",
      launchpad: "منصة الإطلاق",
      volunteering: "التطوع",
      groups: "المجموعات",
      pages: "الصفحات",
      mentors: "المرشدون",
      inbox: "صندوق الوارد",
      "security-operations": "عمليات الأمان",
      profile: "الملف الشخصي",
    },
    menu: {
      dashboard: "لوحة التحكم",
      profile: "الملف الشخصي",
      notifications: "الإشعارات",
      messages: "الرسائل",
      markAllRead: "تحديد الكل كمقروء",
      openNotificationCenter: "فتح مركز الإشعارات",
      openInbox: "فتح صندوق الوارد",
      financialHub: "المركز المالي",
      trustCenter: "مركز الثقة",
      supportCenter: "مركز الدعم",
      securityOperations: "عمليات الأمان",
      logout: "تسجيل الخروج",
      requestAccess: "طلب صلاحية",
      manageMemberships: "إدارة العضويات",
      contactSupport: "التواصل مع الدعم",
    },
    auth: {
      login: "تسجيل الدخول",
      register: "انضم الآن",
      startProfile: "ابدأ ملفك الشخصي مجانًا",
      watchTour: "شاهد جولة مدتها 90 ثانية",
    },
    assistants: {
      messaging: {
        inboxTab: "الوارد",
        supportTab: "الدعم",
        subtitle: "رسائل آمنة ومكالمات وملفات لكل مساحة عمل.",
        supportSubtitle: "انتقل إلى مركز الثقة لتحليلات التذاكر واتفاقيات مستوى الخدمة.",
        syncedCopy: "متزامن عبر لوحات فرق الشركاء.",
        refresh: "تحديث",
        signInPrompt: "سجّل الدخول لعرض صندوق رسائل مؤسستك، وبدء المكالمات والتعاون الفوري.",
        emptyThreads:
          "ابدأ محادثة مع الزملاء أو العملاء. ستظهر المحادثات هنا بمجرد إنشائها.",
        privateNotes: "ملاحظات خاصة",
        startVideo: "بدء مكالمة فيديو",
        startVoice: "بدء مكالمة صوتية",
        loadOlder: "تحميل المحادثات الأقدم",
        loadingOlder: "جاري تحميل محادثات إضافية…",
        emptyMessages:
          "قدّم الفريق، وشارك الملفات، وحدد مواعيد للمكالمات – ستظهر الرسائل هنا في الوقت الحقيقي.",
        signInToRead: "سجّل الدخول لقراءة الرسائل وإرسالها.",
        composePlaceholder: "اكتب ردك…",
        composeDisabled: "سجّل الدخول لإرسال الرسائل",
        composeHintActive: "تظل الملفات والتفاعلات والموافقات متزامنة عبر اللوحات.",
        composeHintEmpty: "اختر محادثة للرد.",
        send: "إرسال",
        supportBody:
          "يستجيب اختصاصيونا خلال دقائق في ساعات العمل بالمملكة المتحدة والاتحاد الأوروبي. ابدأ محادثة هنا أو افتح مركز الثقة.",
        visitSupport: "زيارة مركز الدعم",
        tipTitle: "آخر نصيحة",
        tipBody:
          "ابدأ مكالمة فيديو أو صوت من أي محادثة – يظل سجل التدقيق والتسجيلات متزامنًا.",
      },
    },
    hero: {
      tagline: "منصة جيجفورا",
      heading: "وظّف بامتياز. وتعاون بروعة.",
      subheading:
        "تربط جيجفورا المواهب المختارة بتدفقات عمل سلسة حتى يطلق فريقك الأفكار دون تعقيد أو انتظار.",
      liveMoments: "لحظات مباشرة",
      liveMomentsDescription: "فرق حقيقية تعمل الآن",
      statusBadge: "متزامن",
      stats: {
        teams: "فرق تطور المواهب العالمية",
        projects: "مشروعات تُسلَّم بشغف",
        onboarding: "متوسط زمن الانضمام",
      },
      deckSubtitle: "تظل لوحات التحكم على الويب والهاتف متناسقة تمامًا.",
    },
    home: {
      guestTitle: "الصفحة الرئيسية لجيجفورا",
      guestSubtitle: "سجّل الدخول لفتح لوحات تحكم مخصصة",
      guestDescription: "اختر مسارك للانضمام إلى الشبكة أو العودة لتقدمك المحفوظ.",
      guestLogin: "سجّل الدخول للمتابعة",
      guestRegister: "أنشئ ملف جيجفورا",
      guestInfo:
        "لا تعرف من أين تبدأ؟ اضغط «أنشئ ملف جيجفورا» لاستكشاف مسارات المستقلين والشركات والوكالات.",
    },
  },
  de: {
    language: {
      label: "Sprache",
      menuTitle: "Wähle deine Sprache",
      ariaLabel: "Sprache ändern",
    },
    navigation: {
      feed: "Live-Feed",
      explorer: "Explorer",
      jobs: "Jobs",
      gigs: "Aufträge",
      projects: "Projekte",
      launchpad: "Launchpad",
      volunteering: "Ehrenamt",
      groups: "Gruppen",
      pages: "Seiten",
      mentors: "Mentoren",
      inbox: "Posteingang",
      "security-operations": "Sicherheitsbetrieb",
      profile: "Profil",
    },
    menu: {
      dashboard: "Dashboard",
      profile: "Profil",
      notifications: "Benachrichtigungen",
      messages: "Nachrichten",
      markAllRead: "Alle als gelesen markieren",
      openNotificationCenter: "Benachrichtigungscenter öffnen",
      openInbox: "Posteingang öffnen",
      financialHub: "Finanzhub",
      trustCenter: "Trust Center",
      supportCenter: "Support-Center",
      securityOperations: "Sicherheitsbetrieb",
      logout: "Abmelden",
      requestAccess: "Zugriff anfordern",
      manageMemberships: "Mitgliedschaften verwalten",
      contactSupport: "Support kontaktieren",
    },
    auth: {
      login: "Anmelden",
      register: "Jetzt beitreten",
      startProfile: "Starte dein kostenloses Profil",
      watchTour: "90-Sekunden-Tour ansehen",
    },
    assistants: {
      messaging: {
        inboxTab: "Posteingang",
        supportTab: "Support",
        subtitle: "Sichere Nachrichten, Anrufe und Dateien für jeden Arbeitsbereich.",
        supportSubtitle: "Wechsle zum Trust Center für Ticket-Analysen und SLAs.",
        syncedCopy: "Auf Team- und Partner-Dashboards synchronisiert.",
        refresh: "Aktualisieren",
        signInPrompt: "Melde dich an, um das Postfach deiner Organisation zu sehen, Anrufe zu starten und in Echtzeit zusammenzuarbeiten.",
        emptyThreads:
          "Starte ein Gespräch mit Kolleg:innen oder Kund:innen. Threads erscheinen hier, sobald du sie erstellst.",
        privateNotes: "Private Notizen",
        startVideo: "Video starten",
        startVoice: "Audio starten",
        loadOlder: "Ältere Unterhaltungen laden",
        loadingOlder: "Weitere Unterhaltungen werden geladen…",
        emptyMessages:
          "Stelle das Team vor, teile Dateien und plane Anrufe – Nachrichten erscheinen hier in Echtzeit.",
        signInToRead: "Zum Lesen und Senden anmelden.",
        composePlaceholder: "Schreibe deine Antwort…",
        composeDisabled: "Zum Senden anmelden",
        composeHintActive: "Dateien, Reaktionen und Freigaben bleiben auf allen Dashboards synchron.",
        composeHintEmpty: "Wähle eine Unterhaltung zum Antworten.",
        send: "Senden",
        supportBody:
          "Unsere Spezialist:innen antworten innerhalb weniger Minuten während der UK- und EU-Zeiten. Starte hier einen Thread oder öffne das Trust Center.",
        visitSupport: "Support-Center öffnen",
        tipTitle: "Neuester Tipp",
        tipBody:
          "Starte Video- oder Audioanrufe direkt aus jedem Thread – Audit-Log und Aufzeichnungen bleiben synchron.",
      },
    },
    hero: {
      tagline: "Gigvora-Plattform",
      heading: "Brillant einstellen. Stilvoll zusammenarbeiten.",
      subheading:
        "Gigvora verbindet kuratiertes Talent mit reibungslosen Workflows, damit dein Team Ideen ohne Jargon und ohne Warten starten kann.",
      liveMoments: "Live-Momente",
      liveMomentsDescription: "Echte Teams liefern jetzt",
      statusBadge: "Synchron",
      stats: {
        teams: "Teams, die globale Talente skalieren",
        projects: "Projekte mit Herz geliefert",
        onboarding: "durchschnittliche Onboarding-Zeit",
      },
      deckSubtitle: "Web- und Mobile-Dashboards bleiben perfekt abgestimmt.",
    },
    home: {
      guestTitle: "Gigvora-Startseite",
      guestSubtitle: "Melde dich an, um personalisierte Dashboards freizuschalten",
      guestDescription: "Wähle einen Weg, um dem Netzwerk beizutreten oder zu deinem gespeicherten Fortschritt zurückzukehren.",
      guestLogin: "Zum Fortfahren anmelden",
      guestRegister: "Gigvora-Profil erstellen",
      guestInfo:
        "Du weißt nicht, wo du anfangen sollst? Tippe auf «Gigvora-Profil erstellen», um Freelancer-, Unternehmens- und Agentur-Workflows zu entdecken.",
    },
  },
  ru: {
    language: {
      label: "Язык",
      menuTitle: "Выберите язык",
      ariaLabel: "Сменить язык",
    },
    navigation: {
      feed: "Живая лента",
      explorer: "Обозреватель",
      jobs: "Вакансии",
      gigs: "Проекты",
      projects: "Проекты",
      launchpad: "Стартовая площадка",
      volunteering: "Волонтёрство",
      groups: "Группы",
      pages: "Страницы",
      mentors: "Наставники",
      inbox: "Входящие",
      "security-operations": "Операции безопасности",
      profile: "Профиль",
    },
    menu: {
      dashboard: "Панель",
      profile: "Профиль",
      notifications: "Уведомления",
      messages: "Сообщения",
      markAllRead: "Отметить всё как прочитанное",
      openNotificationCenter: "Открыть центр уведомлений",
      openInbox: "Открыть входящие",
      financialHub: "Финансовый центр",
      trustCenter: "Центр доверия",
      supportCenter: "Служба поддержки",
      securityOperations: "Операции безопасности",
      logout: "Выйти",
      requestAccess: "Запросить доступ",
      manageMemberships: "Управлять членствами",
      contactSupport: "Связаться с поддержкой",
    },
    auth: {
      login: "Войти",
      register: "Присоединиться",
      startProfile: "Создайте бесплатный профиль",
      watchTour: "Посмотреть 90-секундный обзор",
    },
    assistants: {
      messaging: {
        inboxTab: "Входящие",
        supportTab: "Поддержка",
        subtitle: "Безопасные сообщения, звонки и файлы для каждого рабочего пространства.",
        supportSubtitle: "Перейдите в центр доверия, чтобы просматривать аналитику тикетов и SLA.",
        syncedCopy: "Синхронизируется на панелях команд и партнёров.",
        refresh: "Обновить",
        signInPrompt: "Войдите, чтобы увидеть почтовый ящик организации, запускать звонки и сотрудничать в реальном времени.",
        emptyThreads:
          "Начните беседу с коллегами или клиентами. Созданные беседы появятся здесь.",
        privateNotes: "Личные заметки",
        startVideo: "Начать видео",
        startVoice: "Начать аудио",
        loadOlder: "Загрузить старые беседы",
        loadingOlder: "Загружаем дополнительные беседы…",
        emptyMessages:
          "Представьте команду, поделитесь файлами и запланируйте звонки — сообщения отображаются здесь в реальном времени.",
        signInToRead: "Войдите, чтобы читать и отправлять сообщения.",
        composePlaceholder: "Напишите ответ…",
        composeDisabled: "Войдите, чтобы отправлять сообщения",
        composeHintActive: "Файлы, реакции и согласования остаются синхронизированными на всех панелях.",
        composeHintEmpty: "Выберите беседу, чтобы ответить.",
        send: "Отправить",
        supportBody:
          "Наши специалисты отвечают в течение нескольких минут в рабочие часы Великобритании и ЕС. Начните беседу здесь или откройте центр доверия.",
        visitSupport: "Перейти в центр поддержки",
        tipTitle: "Свежий совет",
        tipBody:
          "Запускайте видео- или голосовые звонки из любого треда — журнал аудита и записи остаются синхронизированными.",
      },
    },
    hero: {
      tagline: "Платформа Gigvora",
      heading: "Нанимайте блестяще. Сотрудничайте красиво.",
      subheading:
        "Gigvora объединяет отобранные таланты с безупречными процессами, чтобы ваша команда запускала идеи без лишнего жаргона и задержек.",
      liveMoments: "Моменты в прямом эфире",
      liveMomentsDescription: "Реальные команды работают сейчас",
      statusBadge: "Синхронизировано",
      stats: {
        teams: "команды, развивающие глобальные таланты",
        projects: "проекты, выполненные с душой",
        onboarding: "среднее время адаптации",
      },
      deckSubtitle: "Веб- и мобильные панели остаются идеально синхронизированными.",
    },
    home: {
      guestTitle: "Домашняя страница Gigvora",
      guestSubtitle: "Войдите, чтобы открыть персональные панели",
      guestDescription: "Выберите путь, чтобы присоединиться к сети или вернуться к сохранённому прогрессу.",
      guestLogin: "Войдите, чтобы продолжить",
      guestRegister: "Создать профиль Gigvora",
      guestInfo:
        "Не знаете, с чего начать? Нажмите «Создать профиль Gigvora», чтобы изучить пути фрилансера, компании и агентства.",
    },
  },
};

deepFreeze(translationsMap);

export const translations = translationsMap;

export function resolveLanguage(code) {
  if (!code) {
    return SUPPORTED_LANGUAGES[0];
  }
  const normalised = `${code}`.trim().toLowerCase();
  return SUPPORTED_LANGUAGES.find((language) => language.code === normalised) ?? SUPPORTED_LANGUAGES[0];
}

export function getLanguageDirection(code) {
  const language = resolveLanguage(code);
  return LANGUAGE_DIRECTIONS[language.code] ?? "ltr";
}

export function translate(languageCode, keyPath, fallbackValue = "") {
  const language = resolveLanguage(languageCode);
  const segments = typeof keyPath === "string" ? keyPath.split(".").filter(Boolean) : [];
  if (!segments.length) {
    return fallbackValue;
  }

  const traverse = (source) =>
    segments.reduce((accumulator, segment) => {
      if (accumulator && typeof accumulator === "object" && segment in accumulator) {
        return accumulator[segment];
      }
      return undefined;
    }, source);

  const primary = traverse(translationsMap[language.code]);
  if (typeof primary === "string") {
    return primary;
  }

  const fallback = traverse(translationsMap[DEFAULT_LANGUAGE]);
  return typeof fallback === "string" ? fallback : fallbackValue;
}

export function getLanguageMeta(code) {
  return SUPPORTED_LANGUAGES.find((language) => language.code === code) ?? SUPPORTED_LANGUAGES[0];
}
