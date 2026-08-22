import { SystemSchema, type System } from './schema'

const CONTRACT_ROLE = 'Architecture + led a small team · freelance contract'

export const SYSTEMS: System[] = [
  // ---------- FEATURED (6) ----------
  {
    slug: 'aiva',
    name: 'AIVA Chat',
    domain: 'Voice AI',
    sector: 'Conversational AI',
    // IN, not US, and 'Own product', not a contract. The first draft had both wrong
    // on the most prominent record on the site. The live product prices in ₹, ships
    // 12+ Indian languages, serves Indian SMBs, and its footer reads "Made with care
    // in Rajkot" — it is Shyamsinh's own product, built under Woyce Tech.
    region: 'IN',
    engagement: 'Own product',
    year: 2025,
    role: 'Own product · built and operated under Woyce Tech',
    stack: ['Twilio', 'ElevenLabs', 'OpenAI', 'Node.js'],
    summary:
      'A voice-AI platform for deploying agents and embeddable chat widgets across web, phone, and apps — with full call recordings, logs, and per-conversation analytics. Serves Indian small businesses in 12+ languages.',
    /**
     * The summary above is 212 characters, so Google cut it mid-clause and the reach claim —
     * the most persuasive thing on the record — never rendered. This keeps the opening
     * definition and that claim, and drops only the middle feature list, which is the part a
     * reader gets from the page itself. 146 characters, and every word is from the summary.
     */
    metaDescription:
      'A voice-AI platform for deploying agents and embeddable chat widgets across web, phone, and apps. Serves Indian small businesses in 12+ languages.',
    url: 'https://aivachat.io/',
    status: 'LIVE',
    featured: true,
    caseStudy: {
      problem:
        'Every voice agent was a bespoke build. Deployment had to be productised so a new agent did not mean a new per-client rebuild.',
      decisions:
        'Tenant-isolated configuration over forked deployments. A provider abstraction across speech vendors, to avoid lock-in and allow cost-driven routing. Recording and transcript capture as a platform primitive, not a per-client feature — analytics and dispute resolution are universal needs.',
      delivered:
        'A self-serve platform for creating and deploying voice agents and embeddable chat widgets across web, phone, and apps — with full call recordings and conversation analytics, in 12+ languages.',
    },
  },
  {
    slug: 'health-wealth-safe',
    name: 'Health Wealth Safe',
    domain: 'Healthcare · EMR',
    sector: 'Healthcare',
    region: 'US',
    engagement: 'Client contract',
    year: 2024,
    role: CONTRACT_ROLE,
    // Enriched from the Woyce company deck (p5), which carries a fuller stack for this
    // build than the personal deck did: Angular web + React Native mobile, a microservice
    // split, and WebSocket transport behind the real-time features.
    //
    // MySQL is kept as-is deliberately. The deck says PostgreSQL + DynamoDB + Firestore
    // instead — that is a CONFLICT, not an addition, and overwriting a datastore claim on
    // the strength of a marketing PDF is exactly the kind of unverified edit this file
    // exists to prevent. Resolve with Shyamsinh, then change it here.
    stack: ['Angular', 'React Native', 'Node.js', 'microservices', 'WebSockets', 'Twilio', 'Jitsi', 'MySQL', 'AWS'],
    summary:
      'A healthcare platform handling patient records, EMR, and billing, with real-time chat and video consultations across separate patient and staff applications.',
    url: 'https://www.healthwealthsafe.com/',
    status: 'LIVE',
    featured: true,
    caseStudy: {
      problem:
        'Patient records, billing, and communication were fragmented across care managers, clinicians, and patients.',
      decisions:
        'Consolidate EMR, billing, and engagement into one data model rather than integrating three systems — accepting a heavier build for a single source of truth. Real-time chat and video as first-class infrastructure, not a bolt-on. Role-scoped access boundaries designed before feature work, to keep PHI exposure minimal by default.',
      delivered:
        'A platform with EMR, billing, care-management dashboards, document storage, and video consultations, spanning web plus separate patient and staff applications.',
    },
  },
  {
    slug: 'vetwise',
    name: 'VetWise',
    domain: 'Veterinary telehealth',
    sector: 'Healthcare',
    region: 'CA',
    engagement: 'Client contract',
    year: 2025,
    role: CONTRACT_ROLE,
    stack: ['React', 'Node.js', 'Python', 'PostgreSQL', 'MongoDB', 'Redis', 'AWS'],
    summary:
      'After-hours veterinary phone support and virtual consultations across Canada, booked in three steps.',
    url: 'https://getvetwise.com/',
    status: 'LIVE',
    featured: true,
  },
  {
    slug: 'yellowpad',
    name: 'YellowPad AI',
    domain: 'Legal',
    sector: 'Legal',
    region: 'US',
    engagement: 'Client contract',
    year: 2025,
    role: CONTRACT_ROLE,
    // LangChain added from the Woyce deck (p14). Additive only: the two decks disagree on
    // the backend runtime (personal says Python, Woyce says Node.js), so neither is asserted
    // over the other — Python stays because it was already here and confirmed.
    stack: ['React', 'Python', 'LangChain', 'OpenAI', 'LLM prompt engineering'],
    // Rewritten from the LIVE site, which calls itself "The Truth Layer for Enterprise
    // Documents" — structured extraction with source citation. The source deck (and an
    // earlier draft of this file) described automated *drafting* of contracts and
    // briefs; the product has no such feature and is pitched on the opposite idea.
    // A caption a client can disprove in one click is worse than no caption.
    summary:
      'Document data infrastructure for legal work — structured extraction from enterprise documents, with every answer traceable back to its source.',
    url: 'https://www.yellowpad.ai/',
    status: 'LIVE',
    featured: true,
    // `delivered` deliberately describes extraction + citation, NOT drafting. The
    // résumé's case study for this project is titled "Legal Drafting" and claims
    // agreements were drafted — the same stale claim the summary above was corrected
    // away from. The Problem/Decisions are accurate and kept; the outcome is worded
    // to the live product a client can actually open.
    caseStudy: {
      problem:
        "The client's existing AI returned a different answer to the same question each time — unusable where a wrong answer carries legal liability.",
      decisions:
        'Extract document data into a structured store and query that, rather than regenerating from the model on each request — trading flexibility for determinism, because auditability was the binding constraint. Passage-level citation, fixed up front, since retrofitting it means reprocessing the whole corpus.',
      delivered:
        'A document-intelligence layer that returns consistent, cited, verifiable answers from enterprise documents — every answer traceable back to its source passage.',
    },
  },
  {
    slug: 'quickhub',
    name: 'Quick Hub',
    domain: 'Reputation · marketing',
    sector: 'Marketing',
    region: 'US',
    engagement: 'Client contract',
    year: 2025,
    role: CONTRACT_ROLE,
    stack: ['React', 'Nest.js', 'GraphQL', 'Prisma', 'OpenAI'],
    summary:
      'An AI operating system for local business: review management, campaign automation, social scheduling, and WhatsApp automation in one console.',
    url: 'https://www.quickhub.ai/',
    status: 'LIVE',
    featured: true,
  },
  {
    slug: 'sydon',
    name: 'Sydon AI',
    domain: 'Agentic commerce',
    sector: 'Commerce',
    region: 'US',
    engagement: 'Client contract',
    year: 2026,
    role: CONTRACT_ROLE,
    stack: ['OpenAI', 'AI agents', 'Data analytics', 'Amazon FBA'],
    summary:
      'An agentic operating system for commerce — account health, margin and FBA insight, competitor analysis, plus AI-driven outreach and reply automation.',
    url: 'https://sydon.ai/',
    status: 'LIVE',
    featured: true,
  },

  // ---------- ARCHIVE (12) ----------
  {
    slug: 'frontdesk-clinic',
    name: 'FrontDesk Clinic',
    domain: 'Healthcare automation',
    sector: 'Healthcare',
    region: 'US',
    engagement: 'Client contract',
    year: 2024,
    role: CONTRACT_ROLE,
    // Angular + PostgreSQL added from the Woyce deck (p16). Additive; no conflict.
    stack: ['Angular', 'Node.js', 'PostgreSQL', 'OpenAI', 'Twilio'],
    summary:
      'Secure phone, fax, and text for healthcare practices, with an AI assistant handling scheduling, reminders, refills, and insurance verification.',
    url: 'https://frontdesk.clinic/',
    status: 'LIVE',
    featured: false,
  },
  {
    slug: 'mof-frontdesk',
    name: 'MOF FrontDesk AI',
    domain: 'Healthcare automation',
    sector: 'Healthcare',
    region: 'US',
    engagement: 'Client contract',
    year: 2025,
    role: CONTRACT_ROLE,
    stack: ['React', 'Node.js', 'PostgreSQL', 'OpenAI', 'Twilio', 'AWS'],
    summary:
      'An AI phone agent for medical offices: books, cancels, and reschedules appointments, with call logs, transcription, and a configurable agent voice.',
    // No url — client UAT environment behind a login. See spec §5.2.
    status: 'PRIVATE',
    featured: false,
    caseStudy: {
      problem:
        'The clinic was losing bookings to voicemail and could not answer at volume. The agent had to be trustworthy enough to act on a live clinical calendar.',
      decisions:
        'A realtime speech model over a cascaded STT→LLM→TTS chain, to hold latency inside conversational tolerance. Confidence-threshold handoff to a human rather than best-effort completion. Write-scope limited to appointments only, so a model error can never touch a clinical record. Full transcript retention for audit.',
      delivered:
        'A voice agent that books, reschedules, and cancels appointments, with call logs, transcription, a configurable agent voice, and Twilio number provisioning.',
    },
  },
  {
    slug: 'hcomb',
    name: 'Hcomb',
    domain: 'Hiring · training',
    sector: 'Hiring',
    region: 'US',
    engagement: 'Client contract',
    year: 2025,
    role: CONTRACT_ROLE,
    // The single biggest recovery from the deck review: the Woyce deck (p12) records a
    // Pinecone vector store, RabbitMQ, and n8n behind this build. The site listed three
    // tools; the retrieval layer — the part that makes this an AI-architecture record
    // rather than a CRUD one — was missing entirely.
    stack: ['React', 'Node.js', 'Python', 'RabbitMQ', 'n8n', 'PostgreSQL', 'Pinecone', 'OpenAI'],
    summary:
      'AI-driven training and hiring — matches candidates to roles, automates job posting, and runs AI-conducted interviews.',
    url: 'https://www.hcomb.ai/',
    status: 'LIVE',
    featured: false,
  },
  {
    slug: 'corprite',
    name: 'CorpRite',
    domain: 'Governance · compliance',
    sector: 'Compliance',
    region: 'US',
    engagement: 'Client contract',
    year: 2024,
    role: CONTRACT_ROLE,
    // React added from the Woyce deck (p13). PostgreSQL kept: the deck says MongoDB, which
    // is a conflict to confirm with Shyamsinh rather than an addition to absorb.
    stack: ['React', 'Node.js', 'Blockchain', 'PostgreSQL'],
    summary:
      'Entity and equity management — secure records for shareholders, directors, and executives, with corporate governance tracking.',
    url: 'https://corprite.co/',
    status: 'LIVE',
    featured: false,
  },
  {
    slug: 'krone',
    name: 'Krone',
    domain: 'Compliance consulting',
    sector: 'Compliance',
    region: 'DK',
    engagement: 'Client contract',
    year: 2024,
    role: CONTRACT_ROLE,
    // PostgreSQL + OpenAI added from the Woyce deck (p15). Additive; no conflict.
    stack: ['React', 'Node.js', 'PostgreSQL', 'OpenAI'],
    summary:
      'A Danish consultancy platform covering compliance, anti-corruption, financial management, and ESG advisory.',
    url: 'https://www.krone.one/',
    status: 'LIVE',
    featured: false,
  },
  {
    slug: 'advancedcare',
    name: 'AdvancedCare',
    domain: 'Healthcare · RCM',
    sector: 'Healthcare',
    region: 'US',
    engagement: 'Client contract',
    year: 2024,
    role: CONTRACT_ROLE,
    // Angular, OpenAI, and Twilio added from the Woyce deck (p17). Additive; no conflict.
    stack: ['Angular', 'Node.js', 'PostgreSQL', 'OpenAI', 'Twilio', 'AWS'],
    summary:
      'Healthcare revenue-cycle management and EHR — patient data, telehealth consultation, and insurance claims processing.',
    url: 'https://advancedcare.com/',
    status: 'LIVE',
    featured: false,
  },
  {
    slug: 'pco-intelligence',
    name: 'PCO Intelligence',
    domain: 'Conversational AI',
    sector: 'Conversational AI',
    region: 'US',
    engagement: 'Client contract',
    year: 2024,
    role: CONTRACT_ROLE,
    // API Gateway added from the Woyce deck (p18). Additive; no conflict.
    stack: ['Amazon Lex', 'Amazon Connect', 'AWS Lambda', 'API Gateway'],
    summary:
      'AI-handled customer queries over a cloud call centre, with custom widget support for voice and chatbot interaction.',
    url: 'https://pcointelligence.com/',
    status: 'LIVE',
    featured: false,
  },
  {
    slug: 'lalo',
    name: 'Lalo',
    domain: 'Consumer AI',
    sector: 'Conversational AI',
    region: 'US',
    engagement: 'Client contract',
    year: 2024,
    role: CONTRACT_ROLE,
    stack: ['OpenAI', 'Node.js', 'AWS'],
    // Caption written from the live site (private family media), NOT the deck's
    // stale "free AI obituary writer" description. Spec §5.4.
    summary:
      'A private family media platform. Built the OpenAI-backed generation service behind its written content features.',
    url: 'https://www.lalo.app/',
    status: 'LIVE',
    featured: false,
  },
  {
    slug: 'reknew',
    name: 'ReKnew AI',
    domain: 'Enterprise modernization',
    sector: 'Enterprise',
    region: 'US',
    engagement: 'Client contract',
    year: 2025,
    role: CONTRACT_ROLE,
    stack: ['React', 'Node.js', 'Python', 'PostgreSQL', 'MongoDB', 'Redis', 'OpenAI'],
    summary:
      'Data-platform modernization for enterprises — accelerating AI adoption and automating manual processes across legacy systems.',
    url: 'https://reknew.ai/',
    status: 'LIVE',
    featured: false,
  },
  {
    slug: 'omniai',
    name: 'OmniAI Chatbot',
    domain: 'Omnichannel support',
    sector: 'Conversational AI',
    region: 'US',
    engagement: 'Client contract',
    year: 2025,
    role: CONTRACT_ROLE,
    stack: ['React', 'Node.js', 'Python', 'PostgreSQL', 'Dialogflow', 'Shopify API'],
    summary:
      'A unified inbox for WhatsApp, Instagram, and email, with sentiment-aware AI replies, human handoff, and Shopify order sync.',
    url: 'https://omniaichatbot.com/',
    status: 'LIVE',
    featured: false,
  },
  {
    slug: 'stockly',
    name: 'Stockly',
    domain: 'Fintech · social',
    sector: 'Fintech',
    region: 'US',
    engagement: 'Client contract',
    year: 2024,
    role: CONTRACT_ROLE,
    stack: ['React', 'React Native', 'Node.js', 'Python', 'PostgreSQL', 'Polygon API'],
    summary:
      'A social platform for stock-market discussion, connecting users with investors, experts, and AI assistants over real-time financial data.',
    status: 'PRIVATE',
    featured: false,
  },
  {
    slug: 'flourish-therapy',
    name: 'Flourish Together Therapy',
    domain: 'Healthcare · booking',
    sector: 'Healthcare',
    region: 'US',
    engagement: 'Client contract',
    year: 2024,
    role: 'Chatbot design and integration · freelance contract',
    stack: ['Landbot', 'Asana', 'Zapier'],
    summary:
      'A booking chatbot for a therapy practice — matches therapists, surfaces insurance providers, and books appointments via Asana and Zapier.',
    url: 'https://www.flourishtogethertherapy.com/',
    status: 'LIVE',
    featured: false,
  },

  // ---------- ADDED FROM THE PORTFOLIO DECKS (2026-08-22) ----------
  //
  // Both were in the source decks and had never made it into this file. They are
  // APPENDED rather than slotted in by year on purpose: `recordNumber()` is anchored to
  // declaration order so a record's catalogue number stays stable, and inserting these
  // mid-array would renumber everything after them.
  //
  // A third deck project, the ServiceNow Dashboard, is deliberately still absent. Its
  // only link is servicenow.com — the vendor's own homepage — and its "stack" describes
  // ServiceNow's hosting rather than anything built. It reads as claiming a product that
  // isn't his. A fourth, Woyce's internal AI Call Centre demo, is also left out: it
  // duplicates AIVA's capability and its host serves a certificate that does not match
  // its hostname, so the only link available is one that fails closed in every browser.
  {
    slug: 'goodfin',
    name: 'Goodfin',
    domain: 'Fintech · private markets',
    sector: 'Fintech',
    region: 'US',
    engagement: 'Client contract',
    // Present in the Woyce deck built 2026-04, so no later than that. ASSUMPTION —
    // confirm the actual delivery year with Shyamsinh.
    year: 2026,
    role: CONTRACT_ROLE,
    stack: ['React', 'React Native', 'Node.js', 'Python', 'PostgreSQL', 'OpenAI', 'AWS'],
    // Written from the LIVE site, not the deck — the same rule that governs the YellowPad
    // and Lalo records, and for the same reason: the deck is wrong here. The personal deck
    // describes "an AI financial advisor that connects to users' bank/brokerage accounts"
    // for "budgeting, savings, and investment guidance". The live product is nothing of the
    // sort — it is pre-IPO private-market investing for accredited investors, via an agentic
    // platform called GO. A consumer-budgeting caption is disprovable in one click, and it
    // also sells the work short: private-market portfolio construction is the harder problem.
    summary:
      'An agentic AI platform for pre-IPO private-market investing — research, curation, and institutional-grade portfolio construction.',
    url: 'https://www.goodfin.com/',
    status: 'LIVE',
    featured: false,
  },
  {
    slug: 'chroma-data',
    name: 'Chroma Data',
    domain: 'Enterprise data agent',
    sector: 'Enterprise',
    region: 'US',
    engagement: 'Client contract',
    // As with Goodfin: in the 2026-04 deck, exact year unconfirmed.
    year: 2026,
    role: CONTRACT_ROLE,
    stack: [
      'AWS Bedrock',
      'Amazon Redshift',
      'Azure Bot Framework',
      'Microsoft Teams',
      'Python',
      'PostgreSQL',
      'React',
    ],
    // Woyce deck p25. The most senior record in the archive on paper — a tool-calling agent
    // over a warehouse, delivered inside Teams, spanning two clouds — and it was missing.
    // The url is the client's own site (chromadata.ai, which chromadata.com now redirects
    // to); it does not show the assistant, which is internal. That is the same arrangement
    // as the Krone, ReKnew and AdvancedCare records, so it is consistent — but it is a
    // client-site link, not a demo of the build.
    summary:
      'A Teams-native data assistant for an enterprise AI consultancy — a Bedrock agent that answers analytical questions by querying Redshift through tool calls.',
    url: 'https://chromadata.ai/',
    status: 'LIVE',
    featured: false,
  },
]

/**
 * Validate at module load — NOT only in tests.
 *
 * This is the line that makes the private-host guard real. Vercel deploys run
 * `next build`; they do not run `npm test`. Verified by experiment: pasting the
 * client's UAT link into a record above and running `npm run build` compiled
 * successfully and would have published it. Every guard in schema.ts — the
 * trailing-dot bypass, subdomain matching, the PRIVATE-carries-no-url rule — was
 * protecting the test suite and nothing else.
 *
 * Every route imports this module, so parsing here fails the build itself. The
 * cost is one parse of 20 records at build time.
 *
 * Do not "optimise" this away, and do not move it into a test.
 */
for (const s of SYSTEMS) {
  const parsed = SystemSchema.safeParse(s)
  if (!parsed.success) {
    const why = parsed.error.issues
      .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('; ')
    throw new Error(`Invalid system "${s.slug}" in src/content/systems.ts — ${why}`)
  }
}
