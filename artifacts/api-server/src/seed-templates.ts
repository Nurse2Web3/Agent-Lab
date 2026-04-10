import { db } from "@workspace/db";
import { seedTemplatesTable } from "@workspace/db/schema";

const SEEDS = [
  // Coding
  {
    name: "Code Review",
    description: "Review code for performance, security, and best practices",
    category: "coding",
    prompt: "Review this code for performance issues, security vulnerabilities, and adherence to best practices:\n\n{{CODE}}",
    systemPrompt: "You are a senior software engineer. Provide specific, actionable feedback.",
    sortOrder: 1,
  },
  {
    name: "Debug This",
    description: "Find and fix bugs in the provided code",
    category: "coding",
    prompt: "Debug this code and explain what was wrong and how you fixed it:\n\n{{CODE}}",
    systemPrompt: "You are an expert debugger. Explain your reasoning step by step.",
    sortOrder: 2,
  },
  {
    name: "Write Tests",
    description: "Generate comprehensive unit tests for the given code",
    category: "coding",
    prompt: "Write comprehensive unit tests for this code:\n\n{{CODE}}",
    systemPrompt: "You are a testing expert. Write edge-case-aware tests.",
    sortOrder: 3,
  },
  {
    name: "Explain Architecture",
    description: "Analyze and explain the architecture of this code",
    category: "coding",
    prompt: "Analyze and explain the architecture of this codebase:\n\n{{CODE}}",
    systemPrompt: "You are a software architect. Focus on design patterns and trade-offs.",
    sortOrder: 4,
  },
  // Marketing
  {
    name: "Landing Page Copy",
    description: "Write high-converting landing page hero copy",
    category: "marketing",
    prompt: "Write a landing page hero section for {{PRODUCT}} targeting {{AUDIENCE}}. Include headline, subheadline, and CTA.",
    systemPrompt: "You are a world-class startup copywriter. Use strong action verbs, specific numbers, and social proof.",
    sortOrder: 10,
  },
  {
    name: "Email Sequence",
    description: "Write a 3-email nurture sequence for new subscribers",
    category: "marketing",
    prompt: "Write a 3-email nurture sequence for {{AUDIENCE}} who signed up for {{PRODUCT}}. Each email should be under 150 words and have a clear CTA.",
    systemPrompt: "You are an expert email marketer. Keep it personal, valuable, and action-oriented.",
    sortOrder: 11,
  },
  {
    name: "Social Media Post",
    description: "Write an engaging social media post with hook and CTA",
    category: "marketing",
    prompt: "Write an engaging {{PLATFORM}} post about {{TOPIC}}. Include a hook, key insight, and CTA.",
    systemPrompt: "You are a social media strategist. Keep it punchy, authentic, and engagement-driven.",
    sortOrder: 12,
  },
  {
    name: "Ad Copy",
    description: "Write Google/Facebook ad variations",
    category: "marketing",
    prompt: "Write 3 variations of {{TYPE}} ads for {{PRODUCT}}. Each should have a headline, description, and CTA.",
    systemPrompt: "You are a performance marketing copywriter. Focus on benefits, urgency, and clarity.",
    sortOrder: 13,
  },
  // Analysis
  {
    name: "Market Analysis",
    description: "Analyze market trends and competitive landscape",
    category: "analysis",
    prompt: "Analyze the market for {{INDUSTRY}}. Include trends, key players, opportunities, and threats. Be specific with data points.",
    systemPrompt: "You are a market research analyst. Use data-driven insights and cite sources.",
    sortOrder: 20,
  },
  {
    name: "SWOT Analysis",
    description: "Conduct a SWOT analysis for a business or product",
    category: "analysis",
    prompt: "Conduct a SWOT analysis for {{COMPANY_OR_PRODUCT}}. Be specific and actionable.",
    systemPrompt: "You are a strategic business analyst. Be specific and back up claims with reasoning.",
    sortOrder: 21,
  },
  {
    name: "Risk Assessment",
    description: "Identify and evaluate business risks",
    category: "analysis",
    prompt: "Identify the top 5 risks for {{PROJECT}} and propose mitigation strategies for each.",
    systemPrompt: "You are a risk management expert. Think probabilistically and prioritize by impact.",
    sortOrder: 22,
  },
  {
    name: "Competitor Comparison",
    description: "Compare competitors across key dimensions",
    category: "analysis",
    prompt: "Compare {{YOUR_PRODUCT}} against {{COMPETITOR_A}} and {{COMPETITOR_B}} across: features, pricing, UX, and target market.",
    systemPrompt: "You are a competitive intelligence analyst. Be objective and factual.",
    sortOrder: 23,
  },
  // Creative
  {
    name: "Brand Voice Guide",
    description: "Define brand voice and tone for a company",
    category: "creative",
    prompt: "Create a brand voice guide for {{COMPANY}}. Define tone, vocabulary, examples, and anti-examples.",
    systemPrompt: "You are a brand strategist. Make it memorable and actionable for content creators.",
    sortOrder: 30,
  },
  {
    name: "Storytelling Framework",
    description: "Craft a compelling narrative around a product or idea",
    category: "creative",
    prompt: "Tell the story of {{PRODUCT}} in a way that resonates with {{AUDIENCE}}. Use narrative structure: hook, conflict, resolution.",
    systemPrompt: "You are a master storyteller. Make it emotionally engaging and authentic.",
    sortOrder: 31,
  },
  {
    name: "Product Naming",
    description: "Generate creative, memorable product names",
    category: "creative",
    prompt: "Generate 10 creative, memorable names for {{PRODUCT_TYPE}}. Provide rationale for each and check domain availability.",
    systemPrompt: "You are a branding expert. Focus on memorability, pronounceability, and domain availability.",
    sortOrder: 32,
  },
  {
    name: "Customer Persona",
    description: "Build a detailed customer persona",
    category: "creative",
    prompt: "Create a detailed customer persona for {{AUDIENCE_SEGMENT}}. Include demographics, goals, frustrations, and preferred channels.",
    systemPrompt: "You are a UX researcher and marketer. Be specific and empathetic.",
    sortOrder: 33,
  },
];

export async function seedTemplates() {
  for (const seed of SEEDS) {
    await db.insert(seedTemplatesTable).values(seed).onConflictDoNothing();
  }
  console.log("Seeded", SEEDS.length, "templates");
}
