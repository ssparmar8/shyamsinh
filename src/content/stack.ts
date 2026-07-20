/**
 * Beat 04.5 — the toolchain behind the systems.
 *
 * Two typed lists, kept in the same terse register as the rest of the archive:
 * `CAPABILITIES` are the architecture areas the work spans; `STACK` is the
 * concrete toolset. Both are demonstrable — every group here is exercised by a
 * system in `systems.ts`. Wording stays inside the site's freelance framing:
 * "leading a small cross-functional team", client stakeholders, contract
 * delivery — never the executive/company narrative the résumé also carries.
 */

export const CAPABILITIES = [
  {
    area: 'SOLUTION ARCHITECTURE',
    items: [
      'requirements discovery',
      'build-vs-buy analysis',
      'reference architectures',
      'integration mapping',
      'risk registers',
      'phased delivery roadmaps',
    ],
  },
  {
    area: 'LLM & AGENT SYSTEMS',
    items: [
      'model selection & routing',
      'tool/function-call schema design',
      'agent state & memory',
      'multi-agent orchestration',
      'human-in-the-loop escalation',
      'prompt & context strategy',
      'fallback & failure-path design',
    ],
  },
  {
    area: 'RETRIEVAL & DATA',
    items: [
      'RAG architecture',
      'chunking & embedding strategy',
      're-ranking',
      'citation grounding',
      'vector store selection & sizing',
      'hybrid search',
      'corpus drift & re-indexing policy',
    ],
  },
  {
    area: 'PLATFORM ENGINEERING',
    items: [
      'multi-tenant AI service design',
      'API gateway & rate limiting',
      'model abstraction layers',
      'evaluation harnesses',
      'observability & tracing',
      'token-cost budgeting',
      'autoscaling & capacity planning',
    ],
  },
  {
    area: 'RELIABILITY & GOVERNANCE',
    items: [
      'evaluation-driven delivery',
      'regression test sets',
      'guardrails & output constraints',
      'PII handling',
      'HIPAA-conscious design',
      'audit trails',
      'vendor lock-in & exit strategy',
    ],
  },
  {
    area: 'DELIVERY LEADERSHIP',
    items: [
      'leading a small cross-functional team',
      'pre-sales & solution design',
      'estimation',
      'technical governance',
      'code-review standards',
      'mentoring',
      'client stakeholder management',
    ],
  },
] as const

export const STACK = [
  {
    group: 'AI',
    items: [
      'OpenAI',
      'Anthropic Claude',
      'Google Gemini',
      'Llama',
      'Mistral',
      'LangChain',
      'LangGraph',
      'LlamaIndex',
      'CrewAI',
      'AutoGen',
      'OpenAI Agents SDK',
      'ElevenLabs',
      'Dialogflow',
      'Amazon Lex',
    ],
  },
  {
    group: 'DATA',
    items: [
      'PostgreSQL / pgvector',
      'Pinecone',
      'Qdrant',
      'Weaviate',
      'Milvus',
      'FAISS',
      'MongoDB',
      'Redis',
      'DynamoDB',
    ],
  },
  {
    group: 'BACKEND',
    items: [
      'Python (FastAPI, Flask)',
      'Node.js (Express, NestJS)',
      'REST',
      'GraphQL',
      'WebSockets',
      'RabbitMQ',
      'microservices',
    ],
  },
  {
    group: 'CLOUD',
    items: [
      'AWS (Lambda, ECS, EC2, S3, RDS, API Gateway, CloudFront, IAM, Lex, Connect)',
      'Docker',
      'GitHub Actions',
      'GitLab CI/CD',
      'Nginx',
      'Linux',
    ],
  },
  {
    group: 'INTEGRATION',
    items: [
      'Twilio (Voice, SMS, Flex, TaskRouter)',
      'Chatwoot',
      'Shopify',
      'WhatsApp / Telegram / Slack / Messenger',
    ],
  },
] as const
