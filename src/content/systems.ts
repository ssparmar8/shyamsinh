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
    stack: ['Node.js', 'Twilio', 'Jitsi', 'MySQL', 'AWS'],
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
    stack: ['React', 'Python', 'OpenAI', 'LLM prompt engineering'],
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
    stack: ['Node.js', 'OpenAI', 'Twilio'],
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
    stack: ['React', 'Node.js', 'OpenAI'],
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
    stack: ['Node.js', 'Blockchain', 'PostgreSQL'],
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
    stack: ['Node.js', 'React'],
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
    stack: ['Node.js', 'PostgreSQL', 'AWS'],
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
    stack: ['Amazon Lex', 'Amazon Connect', 'AWS Lambda'],
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
 * cost is one parse of 18 records at build time.
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
