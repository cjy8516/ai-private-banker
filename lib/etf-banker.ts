import { z } from "zod";

export const modeSchema = z.enum(["build", "review"]);

export const profileSchema = z.object({
  client_name: z.string().max(80).optional().default("Charlotte Everly"),
  age: z.string().max(20).optional().default("55"),
  investable_assets: z.string().max(40).optional().default("£3m"),
  investment_objective: z.string().max(80).optional().default("Long-term growth with controlled concentration"),
  preferred_regions: z.string().max(80).optional().default("United States, developed markets"),
  excluded_regions: z.string().max(80).optional().default("China"),
  esg_preference: z.string().max(40).optional().default("Neutral"),
  goal: z.enum(["growth", "balanced", "income", "retirement", "inflation"]),
  risk: z.enum(["conservative", "moderate", "aggressive"]),
  horizon: z.enum(["1-3y", "3-7y", "7y+"]),
  style: z.enum(["growth", "balanced", "income"]),
  preference: z.enum(["us-core", "global", "technology", "dividend", "inflation-hedge"]),
  note: z.string().max(300).optional().default("")
});

export const requestSchema = z.object({
  mode: modeSchema,
  profile: profileSchema,
  holdingsText: z.string().optional().default("")
});

export type Mode = z.infer<typeof modeSchema>;
export type ClientProfile = z.infer<typeof profileSchema>;
export type RecommendationRequest = z.infer<typeof requestSchema>;

export type PortfolioLine = {
  ticker: string;
  name: string;
  weight: number;
  role: string;
  why: string;
  expenseRatio: number;
};

export type MetricPoint = {
  metric: string;
  proposed: number;
  current?: number;
};

export type Diagnostics = {
  suitabilityScore: number;
  weightedExpense: number;
  numberOfFunds: number;
  equityWeight: number;
  defensiveWeight: number;
  incomeWeight: number;
  concentrationRisk: string;
  feeComment: string;
  overlapComment: string;
  regionComment: string;
  clientFitComment: string;
  duplicationSignals: string[];
};

export type RecommendationResult = {
  mode: Mode;
  headline: string;
  clientHeadline: string;
  clientSummary: string;
  whyThisPortfolio: string;
  whyNotObviousChoices: string;
  bankerBrief: string;
  voiceBrief: string;
  tradeoffs: string[];
  risks: string[];
  portfolio: PortfolioLine[];
  currentHoldings: PortfolioLine[];
  observations: string[];
  diagnostics: Diagnostics;
  currentDiagnostics: Diagnostics | null;
  metrics: MetricPoint[];
};

export type ScenarioAnalysis = {
  title: string;
  summary: string;
  impact: "Positive" | "Neutral" | "Negative";
  affectedHoldings: string[];
  risks: string[];
  suggestedActions: string[];
};

type EtfDefinition = {
  ticker: string;
  name: string;
  role: string;
  assetClass: "equity" | "bond" | "cash" | "real-asset";
  region: "US" | "International" | "Emerging" | "Global" | "Defensive";
  style: "growth" | "blend" | "income" | "defensive" | "inflation";
  expenseRatio: number;
  incomeLevel: number;
  riskLevel: number;
  tags: string[];
  recommendable?: boolean;
};

type Sleeves = {
  usCore: number;
  usGrowth: number;
  dividend: number;
  international: number;
  bonds: number;
  cash: number;
  inflation: number;
  gold: number;
};

const ETF_UNIVERSE: Record<string, EtfDefinition> = {
  VOO: {
    ticker: "VOO",
    name: "Vanguard S&P 500 ETF",
    role: "Low-cost US core equity anchor",
    assetClass: "equity",
    region: "US",
    style: "blend",
    expenseRatio: 0.03,
    incomeLevel: 2,
    riskLevel: 7,
    tags: ["us-core", "large-cap"]
  },
  VTI: {
    ticker: "VTI",
    name: "Vanguard Total Stock Market ETF",
    role: "Broad US equity exposure",
    assetClass: "equity",
    region: "US",
    style: "blend",
    expenseRatio: 0.03,
    incomeLevel: 2,
    riskLevel: 7,
    tags: ["us-core", "broad-market"]
  },
  QQQ: {
    ticker: "QQQ",
    name: "Invesco QQQ Trust",
    role: "US mega-cap growth tilt",
    assetClass: "equity",
    region: "US",
    style: "growth",
    expenseRatio: 0.20,
    incomeLevel: 1,
    riskLevel: 9,
    tags: ["technology", "growth", "ai"]
  },
  SCHG: {
    ticker: "SCHG",
    name: "Schwab U.S. Large-Cap Growth ETF",
    role: "Cheaper broad growth sleeve",
    assetClass: "equity",
    region: "US",
    style: "growth",
    expenseRatio: 0.04,
    incomeLevel: 1,
    riskLevel: 8,
    tags: ["growth", "large-cap"]
  },
  SCHD: {
    ticker: "SCHD",
    name: "Schwab U.S. Dividend Equity ETF",
    role: "Equity income sleeve",
    assetClass: "equity",
    region: "US",
    style: "income",
    expenseRatio: 0.06,
    incomeLevel: 5,
    riskLevel: 6,
    tags: ["dividend", "income", "quality"]
  },
  VXUS: {
    ticker: "VXUS",
    name: "Vanguard Total International Stock ETF",
    role: "International diversification",
    assetClass: "equity",
    region: "International",
    style: "blend",
    expenseRatio: 0.07,
    incomeLevel: 2,
    riskLevel: 7,
    tags: ["global", "international"]
  },
  IEFA: {
    ticker: "IEFA",
    name: "iShares Core MSCI EAFE ETF",
    role: "Developed ex-US markets sleeve",
    assetClass: "equity",
    region: "International",
    style: "blend",
    expenseRatio: 0.07,
    incomeLevel: 2,
    riskLevel: 7,
    tags: ["international", "developed"]
  },
  IEMG: {
    ticker: "IEMG",
    name: "iShares Core MSCI Emerging Markets ETF",
    role: "Emerging markets growth kicker",
    assetClass: "equity",
    region: "Emerging",
    style: "growth",
    expenseRatio: 0.09,
    incomeLevel: 2,
    riskLevel: 8,
    tags: ["emerging", "global"]
  },
  BND: {
    ticker: "BND",
    name: "Vanguard Total Bond Market ETF",
    role: "Core bond ballast",
    assetClass: "bond",
    region: "Defensive",
    style: "defensive",
    expenseRatio: 0.03,
    incomeLevel: 4,
    riskLevel: 3,
    tags: ["bond", "core"]
  },
  SGOV: {
    ticker: "SGOV",
    name: "iShares 0-3 Month Treasury Bond ETF",
    role: "Cash-like dry powder",
    assetClass: "cash",
    region: "Defensive",
    style: "defensive",
    expenseRatio: 0.09,
    incomeLevel: 4,
    riskLevel: 1,
    tags: ["cash", "treasury"]
  },
  TIP: {
    ticker: "TIP",
    name: "iShares TIPS Bond ETF",
    role: "Inflation-linked protection sleeve",
    assetClass: "bond",
    region: "Defensive",
    style: "inflation",
    expenseRatio: 0.19,
    incomeLevel: 3,
    riskLevel: 3,
    tags: ["inflation", "bond"]
  },
  GLD: {
    ticker: "GLD",
    name: "SPDR Gold Shares",
    role: "Inflation and stress hedge",
    assetClass: "real-asset",
    region: "Global",
    style: "inflation",
    expenseRatio: 0.40,
    incomeLevel: 0,
    riskLevel: 5,
    tags: ["inflation", "gold", "hedge"]
  },
  VNQ: {
    ticker: "VNQ",
    name: "Vanguard Real Estate ETF",
    role: "Real asset income diversifier",
    assetClass: "real-asset",
    region: "US",
    style: "income",
    expenseRatio: 0.13,
    incomeLevel: 4,
    riskLevel: 6,
    tags: ["reit", "income"]
  },
  XLK: {
    ticker: "XLK",
    name: "Technology Select Sector SPDR Fund",
    role: "Pure-play US technology sleeve",
    assetClass: "equity",
    region: "US",
    style: "growth",
    expenseRatio: 0.09,
    incomeLevel: 1,
    riskLevel: 9,
    tags: ["technology", "sector"],
    recommendable: false
  },
  ARKK: {
    ticker: "ARKK",
    name: "ARK Innovation ETF",
    role: "High-volatility thematic growth sleeve",
    assetClass: "equity",
    region: "US",
    style: "growth",
    expenseRatio: 0.75,
    incomeLevel: 0,
    riskLevel: 10,
    tags: ["innovation", "technology", "high-beta"],
    recommendable: false
  }
};

const EXPLANATION_SCHEMA = z.object({
  headline: z.string(),
  clientSummary: z.string(),
  whyThisPortfolio: z.string(),
  whyNotObviousChoices: z.string(),
  bankerBrief: z.string(),
  tradeoffs: z.array(z.string()).length(3),
  risks: z.array(z.string()).length(3)
});

export type ExplanationEnhancement = z.infer<typeof EXPLANATION_SCHEMA>;

export const EXPLANATION_PROMPT = `
You are an ETF private banker speaking to a retail investor.
Keep the tone credible, warm, and practical.
Do not sound like a screener or like compliance boilerplate.
Explain why the portfolio fits the client, why it is cleaner than obvious alternatives,
and what the client should watch out for.
Return only valid JSON with:
headline, clientSummary, whyThisPortfolio, whyNotObviousChoices, bankerBrief, tradeoffs, risks.
tradeoffs must be an array of exactly 3 strings.
risks must be an array of exactly 3 strings.
`;

export function parseExplanation(jsonText: string) {
  return EXPLANATION_SCHEMA.parse(JSON.parse(jsonText));
}

export function buildRecommendation(input: RecommendationRequest): RecommendationResult {
  const profile = input.profile;
  const proposedPortfolio = buildPortfolio(profile);
  const proposedDiagnostics = analyzePortfolio(proposedPortfolio, profile);
  const currentHoldings = input.mode === "review" ? parseHoldings(input.holdingsText) : [];
  const currentDiagnostics =
    currentHoldings.length > 0 ? analyzePortfolio(currentHoldings, profile) : null;
  const observations =
    currentHoldings.length > 0
      ? buildReviewObservations(currentHoldings, currentDiagnostics)
      : buildBuildObservations(profile, proposedPortfolio);

  const inferred = describeClient(profile);
  const clientHeadline = `${profile.client_name}, age ${profile.age}, ${profile.investable_assets}`;
  const headline =
    input.mode === "review"
      ? "Your portfolio second opinion"
      : "Your ETF private banker recommendation";

  const whyThisPortfolio =
    input.mode === "review"
      ? "This mix removes duplicate growth exposure, lowers product complexity, and re-centers the portfolio on the goal you described."
      : "This portfolio uses a small number of recognizable ETFs so the risk budget, income profile, and diversification are easy to understand.";

  const whyNotObviousChoices =
    input.mode === "review"
      ? "Instead of stacking several similar growth ETFs, the proposal keeps only the exposures that actually add a distinct job inside the portfolio."
      : "The recommendation avoids overfitting around one theme or headline ETF, because retail investors often confuse product count with diversification.";

  const bankerBrief =
    input.mode === "review"
      ? `You already have investable building blocks, but the current lineup is less efficient than it needs to be. The proposed mix keeps the parts that fit ${inferred} and removes the overlap that is not earning its keep.`
      : `For a client seeking ${inferred}, the portfolio focuses on a small ETF lineup that balances suitability, cost, and clarity rather than chasing every possible theme.`;

  return {
    mode: input.mode,
    headline,
    clientHeadline,
    clientSummary:
      input.mode === "review"
        ? `We reviewed ${profile.client_name}'s current ETF mix against a ${inferred} mandate and proposed a cleaner version with stronger role separation.`
        : `We translated ${profile.client_name}'s brief into a ${inferred} ETF portfolio with clear jobs for each fund.`,
    whyThisPortfolio,
    whyNotObviousChoices,
    bankerBrief,
    voiceBrief: buildVoiceBrief(profile, proposedPortfolio, currentDiagnostics),
    tradeoffs: buildTradeoffs(profile),
    risks: buildRisks(profile),
    portfolio: proposedPortfolio,
    currentHoldings,
    observations,
    diagnostics: proposedDiagnostics,
    currentDiagnostics,
    metrics: buildMetrics(profile, proposedPortfolio, currentHoldings)
  };
}

export function mergeExplanation(
  base: RecommendationResult,
  explanation: ExplanationEnhancement
): RecommendationResult {
  return {
    ...base,
    headline: explanation.headline,
    clientSummary: explanation.clientSummary,
    whyThisPortfolio: explanation.whyThisPortfolio,
    whyNotObviousChoices: explanation.whyNotObviousChoices,
    bankerBrief: explanation.bankerBrief,
    tradeoffs: explanation.tradeoffs,
    risks: explanation.risks
  };
}

export function generateScenarioAnalysis(
  question: string,
  profile: ClientProfile,
  portfolio: PortfolioLine[]
): ScenarioAnalysis {
  const text = question.toLowerCase();
  const holdings = portfolio.map((line) => line.ticker);
  const has = (ticker: string) => holdings.includes(ticker);

  if (text.includes("tariff") || text.includes("trump")) {
    return {
      title: "Tariff shock scenario",
      summary:
        "A tariff-driven shock would likely tighten financial conditions, pressure global trade, and hit growth-heavy equity exposures first.",
      impact: "Negative",
      affectedHoldings: holdings.filter((ticker) => ["QQQ", "SCHG", "VXUS", "IEFA", "IEMG", "VOO", "VTI"].includes(ticker)),
      risks: [
        "US growth valuations may compress if markets start repricing inflation and slower trade.",
        "International equities can underperform if cross-border demand weakens.",
        "Client portfolios with concentrated tech exposure may discover they are less diversified than they thought."
      ],
      suggestedActions: [
        has("BND") ? "Lean on the bond ballast already in the allocation rather than panic-selling equity risk." : "Add a cleaner defensive sleeve such as core bonds or short Treasuries.",
        has("GLD") ? "Use gold as a visible hedge in the client conversation." : "Introduce a modest gold hedge to make macro protection tangible.",
        "Cut redundant growth overlap before adding new themes."
      ]
    };
  }

  if (text.includes("ai") || text.includes("bubble") || text.includes("tech")) {
    return {
      title: "AI bubble unwind",
      summary:
        "If the AI trade unwinds sharply, the first damage would likely come through crowded mega-cap growth and thematic technology products.",
      impact: "Negative",
      affectedHoldings: holdings.filter((ticker) => ["QQQ", "SCHG", "XLK", "ARKK", "VOO", "VTI"].includes(ticker)),
      risks: [
        "Several ETF labels can still lead back to the same US growth engine.",
        "Clients often mistake owning multiple growth ETFs for true diversification.",
        "Drawdowns can deepen when the same underlying names dominate across several funds."
      ],
      suggestedActions: [
        "Keep one deliberate growth sleeve, not several overlapping ones.",
        "Increase role clarity with more international or defensive exposure.",
        "Reframe the client conversation around total portfolio resilience, not theme excitement."
      ]
    };
  }

  if (text.includes("recession")) {
    return {
      title: "US recession scenario",
      summary:
        "In a recessionary setup, equity beta would likely weaken while defensive sleeves, cash, and duration become more important in the client narrative.",
      impact: profile.risk === "aggressive" ? "Negative" : "Neutral",
      affectedHoldings: holdings.filter((ticker) => ["VOO", "VTI", "QQQ", "SCHG", "SCHD", "BND", "SGOV"].includes(ticker)),
      risks: [
        "Growth-heavy portfolios can draw down faster than the client expects.",
        "Dividend equity is still equity and should not be sold as capital protection.",
        "Clients with short horizons may react emotionally if there is not enough ballast."
      ],
      suggestedActions: [
        "Raise the visibility of defensive sleeves such as BND or SGOV.",
        "Reduce duplicate cyclical or growth exposures before markets force the conversation.",
        "Set expectations early around what the client is being paid to endure."
      ]
    };
  }

  if (text.includes("inflation")) {
    return {
      title: "Inflation re-acceleration",
      summary:
        "If inflation re-accelerates, duration-sensitive assets may struggle while real assets and pricing-power equities become more valuable.",
      impact: has("TIP") || has("GLD") ? "Neutral" : "Negative",
      affectedHoldings: holdings.filter((ticker) => ["BND", "TIP", "GLD", "VOO", "SCHD", "VTI"].includes(ticker)),
      risks: [
        "Core bonds can be less protective if inflation is the primary problem.",
        "Clients may overestimate how much dividend exposure protects real purchasing power.",
        "Without explicit inflation hedges, the portfolio story can sound incomplete."
      ],
      suggestedActions: [
        has("TIP") ? "Use the inflation sleeve as a visible talking point with the client." : "Add a modest TIPS sleeve for explicit inflation defense.",
        has("GLD") ? "Keep gold as a secondary macro hedge rather than the main portfolio engine." : "Consider a small gold hedge to diversify macro outcomes.",
        "Favor broad quality exposure over crowded speculative growth."
      ]
    };
  }

  return {
    title: "Market stress scenario",
    summary:
      "Under a broad market stress event, the right response is usually cleaner role separation, less overlap, and more visible ballast rather than more products.",
    impact: "Neutral",
    affectedHoldings: holdings.slice(0, 5),
    risks: [
      "Too many ETFs can create false comfort without adding true diversification.",
      "Concentrated growth exposure can dominate outcomes in stress periods.",
      "Clients need a portfolio story they can hold through volatility."
    ],
    suggestedActions: [
      "Simplify the ETF lineup before adding complexity.",
      "Add or preserve defensive ballast if the client horizon is short or their risk tolerance is moderate.",
      "Make every holding justify its job in one sentence."
    ]
  };
}

function buildPortfolio(profile: ClientProfile): PortfolioLine[] {
  const sleeves = buildSleeves(profile);
  const base: Array<{ ticker: keyof typeof ETF_UNIVERSE; weight: number }> = [
    { ticker: chooseCoreEtf(profile), weight: sleeves.usCore },
    { ticker: chooseGrowthEtf(profile), weight: sleeves.usGrowth },
    { ticker: "SCHD", weight: sleeves.dividend },
    { ticker: chooseInternationalEtf(profile), weight: sleeves.international },
    { ticker: "BND", weight: sleeves.bonds },
    { ticker: "SGOV", weight: sleeves.cash },
    { ticker: "TIP", weight: sleeves.inflation },
    { ticker: "GLD", weight: sleeves.gold }
  ];

  const merged = new Map<string, number>();

  for (const line of base) {
    if (line.weight <= 0) continue;
    merged.set(line.ticker, (merged.get(line.ticker) ?? 0) + line.weight);
  }

  const capped = capConcentration([...merged.entries()].map(([ticker, weight]) => ({ ticker, weight })));

  return capped
    .map(([ticker, weight]) => toPortfolioLine(ticker, weight, profile))
    .sort((left, right) => right.weight - left.weight);
}

function capConcentration(lines: Array<{ ticker: string; weight: number }>) {
  const maxWeight = 35;
  const primary = lines.find((line) => line.weight > maxWeight);
  if (!primary) return lines.map((line) => [line.ticker, line.weight] as const);

  const excess = primary.weight - maxWeight;
  primary.weight = maxWeight;

  const core = lines.find((line) => line.ticker === "VOO" || line.ticker === "VTI");
  const intl = lines.find((line) => line.ticker === "VXUS" || line.ticker === "IEFA");
  const bonds = lines.find((line) => line.ticker === "BND");

  if (core) core.weight += excess * 0.5;
  if (intl) intl.weight += excess * 0.3;
  if (bonds) bonds.weight += excess * 0.2;

  return lines.map((line) => [line.ticker, roundWeight(line.weight)] as const);
}

function buildSleeves(profile: ClientProfile): Sleeves {
  const baseByGoal: Record<ClientProfile["goal"], Sleeves> = {
    growth: { usCore: 35, usGrowth: 25, dividend: 0, international: 15, bonds: 15, cash: 5, inflation: 0, gold: 5 },
    balanced: { usCore: 30, usGrowth: 10, dividend: 10, international: 20, bonds: 20, cash: 5, inflation: 0, gold: 5 },
    income: { usCore: 20, usGrowth: 0, dividend: 30, international: 10, bonds: 25, cash: 10, inflation: 0, gold: 5 },
    retirement: { usCore: 20, usGrowth: 0, dividend: 20, international: 10, bonds: 30, cash: 15, inflation: 0, gold: 5 },
    inflation: { usCore: 20, usGrowth: 0, dividend: 10, international: 15, bonds: 20, cash: 10, inflation: 15, gold: 10 }
  };

  const sleeves = { ...baseByGoal[profile.goal] };

  applyRiskAdjustment(sleeves, profile);
  applyStyleAdjustment(sleeves, profile);
  applyPreferenceAdjustment(sleeves, profile);

  return normalizeSleeves(sleeves);
}

function applyRiskAdjustment(sleeves: Sleeves, profile: ClientProfile) {
  if (profile.risk === "aggressive") {
    shiftFromDefensiveToRisk(sleeves, 10);
  }

  if (profile.risk === "conservative") {
    shiftFromRiskToDefensive(sleeves, 12);
  }

  if (profile.horizon === "1-3y") {
    shiftFromRiskToDefensive(sleeves, 8);
  }

  if (profile.horizon === "7y+") {
    shiftFromDefensiveToRisk(sleeves, 6);
  }
}

function applyStyleAdjustment(sleeves: Sleeves, profile: ClientProfile) {
  if (profile.style === "growth") {
    transferWeight(sleeves, "dividend", "usGrowth", 8);
    transferWeight(sleeves, "bonds", "usGrowth", 5);
  }

  if (profile.style === "income") {
    transferWeight(sleeves, "usGrowth", "dividend", 10);
    transferWeight(sleeves, "usCore", "bonds", 5);
  }
}

function applyPreferenceAdjustment(sleeves: Sleeves, profile: ClientProfile) {
  switch (profile.preference) {
    case "technology":
      transferWeight(sleeves, "usCore", "usGrowth", 10);
      break;
    case "global":
      transferWeight(sleeves, "usCore", "international", 10);
      transferWeight(sleeves, "usGrowth", "international", 5);
      break;
    case "dividend":
      transferWeight(sleeves, "usCore", "dividend", 10);
      break;
    case "inflation-hedge":
      transferWeight(sleeves, "bonds", "inflation", 10);
      transferWeight(sleeves, "cash", "gold", 5);
      break;
    default:
      break;
  }
}

function normalizeSleeves(sleeves: Sleeves) {
  const total = Object.values(sleeves).reduce((sum, value) => sum + value, 0);
  const factor = total === 100 ? 1 : 100 / total;

  return {
    usCore: roundWeight(sleeves.usCore * factor),
    usGrowth: roundWeight(sleeves.usGrowth * factor),
    dividend: roundWeight(sleeves.dividend * factor),
    international: roundWeight(sleeves.international * factor),
    bonds: roundWeight(sleeves.bonds * factor),
    cash: roundWeight(sleeves.cash * factor),
    inflation: roundWeight(sleeves.inflation * factor),
    gold: roundWeight(sleeves.gold * factor)
  };
}

function chooseCoreEtf(profile: ClientProfile) {
  return profile.preference === "us-core" ? "VTI" : "VOO";
}

function chooseGrowthEtf(profile: ClientProfile) {
  return profile.preference === "technology" || profile.note.toLowerCase().includes("ai")
    ? "QQQ"
    : "SCHG";
}

function chooseInternationalEtf(profile: ClientProfile) {
  return profile.preference === "global" || profile.horizon === "7y+" ? "VXUS" : "IEFA";
}

function toPortfolioLine(
  ticker: string,
  weight: number,
  profile: ClientProfile
): PortfolioLine {
  const etf = ETF_UNIVERSE[ticker];
  return {
    ticker: etf.ticker,
    name: etf.name,
    weight: roundWeight(weight),
    role: etf.role,
    why: lineWhy(etf, profile),
    expenseRatio: etf.expenseRatio
  };
}

function lineWhy(etf: EtfDefinition, profile: ClientProfile) {
  if (etf.ticker === "QQQ") {
    return "Adds deliberate US growth exposure without turning the whole portfolio into a tech bet.";
  }
  if (etf.ticker === "SCHD") {
    return "Helps support cash-flow quality and keeps the income sleeve easy to explain.";
  }
  if (etf.ticker === "VXUS" || etf.ticker === "IEFA") {
    return "Prevents the portfolio from becoming a pure US large-cap story.";
  }
  if (etf.ticker === "BND" || etf.ticker === "SGOV") {
    return profile.horizon === "1-3y"
      ? "Adds short-horizon stability so the client does not take more risk than the mandate requires."
      : "Acts as ballast when equity markets become the whole conversation.";
  }
  if (etf.ticker === "TIP" || etf.ticker === "GLD") {
    return "Provides a visible inflation and stress hedge instead of pretending diversification alone solves every macro risk.";
  }
  return "Serves as a low-cost anchor so the rest of the portfolio can stay selective rather than cluttered.";
}

export function parseHoldings(text: string): PortfolioLine[] {
  const rawLines = text
    .split(/\n|,/)
    .map((line) => line.trim())
    .filter(Boolean);

  const parsed = rawLines
    .map((line) => {
      const match = line.match(/^([A-Za-z]{2,5})\s+(\d+(?:\.\d+)?)%?$/);
      if (!match) return null;

      const ticker = normalizeHoldingTicker(match[1].toUpperCase());
      const weight = Number(match[2]);
      const etf = ETF_UNIVERSE[ticker] ?? createGenericEtf(ticker);

      return {
        ticker: etf.ticker,
        name: etf.name,
        weight,
        role: etf.role,
        why: "Existing client holding.",
        expenseRatio: etf.expenseRatio
      };
    })
    .filter((line): line is PortfolioLine => line !== null);

  const total = parsed.reduce((sum, line) => sum + line.weight, 0);
  if (total <= 0) return [];

  return parsed.map((line) => ({
    ...line,
    weight: roundWeight((line.weight / total) * 100)
  }));
}

function normalizeHoldingTicker(ticker: string) {
  if (ticker === "CASH") return "SGOV";
  return ticker;
}

function createGenericEtf(ticker: string): EtfDefinition {
  return {
    ticker,
    name: `${ticker} ETF`,
    role: "Client-selected ETF outside the curated universe",
    assetClass: "equity",
    region: "US",
    style: "blend",
    expenseRatio: 0.45,
    incomeLevel: 1,
    riskLevel: 8,
    tags: ["custom"],
    recommendable: false
  };
}

function analyzePortfolio(portfolio: PortfolioLine[], profile: ClientProfile): Diagnostics {
  const definitions = portfolio.map((line) => ({
    line,
    etf: ETF_UNIVERSE[line.ticker] ?? createGenericEtf(line.ticker)
  }));

  const tickers = definitions.map((item) => item.etf.ticker);

  const weightedExpense = roundNumber(
    definitions.reduce((sum, item) => sum + (item.line.weight * item.etf.expenseRatio) / 100, 0),
    2
  );
  const equityWeight = roundWeight(
    definitions
      .filter((item) => item.etf.assetClass === "equity")
      .reduce((sum, item) => sum + item.line.weight, 0)
  );
  const defensiveWeight = roundWeight(
    definitions
      .filter((item) => item.etf.assetClass !== "equity")
      .reduce((sum, item) => sum + item.line.weight, 0)
  );
  const incomeWeight = roundWeight(
    definitions
      .filter((item) => item.etf.style === "income")
      .reduce((sum, item) => sum + item.line.weight, 0)
  );
  const maxHolding = Math.max(...definitions.map((item) => item.line.weight), 0);
  const usLargeCapGrowth = roundWeight(
    definitions
      .filter((item) => ["VOO", "VTI", "QQQ", "SCHG", "XLK", "ARKK"].includes(item.etf.ticker))
      .reduce((sum, item) => sum + item.line.weight, 0)
  );
  const diversificationScore = clamp(
    100 - Math.max(0, maxHolding - 30) * 2 - Math.max(0, usLargeCapGrowth - 65),
    45,
    95
  );
  const costScore = clamp(100 - weightedExpense * 140, 30, 97);
  const simplicityScore = clamp(100 - Math.max(0, portfolio.length - 4) * 12, 40, 98);
  const fitScore = goalFitScore(profile, equityWeight, defensiveWeight, incomeWeight);
  const suitabilityScore = roundNumber(
    (diversificationScore + costScore + simplicityScore + fitScore) / 4,
    0
  );
  const duplicationSignals = detectDuplicationSignals(tickers);

  return {
    suitabilityScore,
    weightedExpense,
    numberOfFunds: portfolio.length,
    equityWeight,
    defensiveWeight,
    incomeWeight,
    concentrationRisk:
      maxHolding > 35
        ? "High single-position concentration"
        : usLargeCapGrowth > 70
          ? "Hidden US large-cap overlap"
          : "Within a reasonable retail range",
    feeComment:
      weightedExpense > 0.25
        ? "Costs are elevated for a simple ETF portfolio."
        : "Costs are efficient for a retail-friendly ETF mix.",
    overlapComment:
      duplicationSignals.length > 0
        ? duplicationSignals[0]
        : usLargeCapGrowth > 70
          ? "Several holdings point at the same US growth engine."
          : "Each holding does a more distinct job.",
    regionComment:
      tickers.some((ticker) => ["VXUS", "IEFA", "IEMG"].includes(ticker))
        ? "The portfolio has visible non-US diversification."
        : "The portfolio still leans heavily on the United States.",
    clientFitComment:
      profile.goal === "income"
        ? "The mix tries to balance income generation with capital preservation."
        : profile.goal === "retirement"
          ? "The mix is calibrated for steadier decision-making, not just raw upside."
          : "The mix emphasizes compounding potential without letting one theme dominate the mandate.",
    duplicationSignals
  };
}

function goalFitScore(
  profile: ClientProfile,
  equityWeight: number,
  defensiveWeight: number,
  incomeWeight: number
) {
  switch (profile.goal) {
    case "growth":
      return clamp(55 + equityWeight / 2 - defensiveWeight / 4, 50, 96);
    case "income":
      return clamp(50 + incomeWeight + defensiveWeight / 3, 50, 94);
    case "retirement":
      return clamp(55 + defensiveWeight / 2 + incomeWeight / 3, 50, 95);
    case "inflation":
      return clamp(60 + defensiveWeight / 4, 50, 92);
    default:
      return clamp(60 + equityWeight / 5 + defensiveWeight / 5, 50, 93);
  }
}

function buildMetrics(
  profile: ClientProfile,
  proposed: PortfolioLine[],
  current: PortfolioLine[]
): MetricPoint[] {
  const proposedBreakdown = scoreBreakdown(proposed, profile);
  const currentBreakdown = current.length > 0 ? scoreBreakdown(current, profile) : null;

  return [
    {
      metric: "Diversification",
      proposed: proposedBreakdown.diversification,
      current: currentBreakdown?.diversification
    },
    {
      metric: "Cost Efficiency",
      proposed: proposedBreakdown.costEfficiency,
      current: currentBreakdown?.costEfficiency
    },
    {
      metric: "Simplicity",
      proposed: proposedBreakdown.simplicity,
      current: currentBreakdown?.simplicity
    },
    {
      metric: profile.goal === "income" ? "Income Fit" : "Suitability",
      proposed: proposedBreakdown.goalFit,
      current: currentBreakdown?.goalFit
    }
  ];
}

function scoreBreakdown(portfolio: PortfolioLine[], profile: ClientProfile) {
  const diagnostics = analyzePortfolio(portfolio, profile);
  const maxHolding = Math.max(...portfolio.map((line) => line.weight), 0);
  const diversification = clamp(
    100 - Math.max(0, maxHolding - 30) * 2 - Math.max(0, diagnostics.equityWeight - 85),
    40,
    96
  );
  const costEfficiency = clamp(100 - diagnostics.weightedExpense * 140, 30, 97);
  const simplicity = clamp(100 - Math.max(0, portfolio.length - 4) * 12, 40, 98);
  const goalFit = goalFitScore(
    profile,
    diagnostics.equityWeight,
    diagnostics.defensiveWeight,
    diagnostics.incomeWeight
  );

  return { diversification, costEfficiency, simplicity, goalFit };
}

function buildReviewObservations(
  current: PortfolioLine[],
  diagnostics: Diagnostics | null
) {
  if (!diagnostics) return [];

  const notes = [...diagnostics.duplicationSignals];
  if (diagnostics.concentrationRisk !== "Within a reasonable retail range") {
    notes.push(`Current portfolio flag: ${diagnostics.concentrationRisk}.`);
  }
  if (diagnostics.weightedExpense > 0.25) {
    notes.push(
      `Weighted expense ratio is roughly ${diagnostics.weightedExpense}%, which is high for a small ETF portfolio.`
    );
  }
  if (current.length > 4) {
    notes.push("There are more funds than needed for the jobs this portfolio is trying to do.");
  }
  notes.push(diagnostics.regionComment);
  notes.push(diagnostics.clientFitComment);
  notes.push(diagnostics.overlapComment);

  return [...new Set(notes)];
}

function buildBuildObservations(profile: ClientProfile, portfolio: PortfolioLine[]) {
  const primaryGrowth = portfolio.find((line) => line.ticker === "QQQ" || line.ticker === "SCHG");
  const notes = [
    `Designed for a ${describeClient(profile)} mandate.`,
    "Uses a curated ETF shelf rather than trying to optimize across hundreds of nearly identical products."
  ];

  if (primaryGrowth) {
    notes.push(
      `${primaryGrowth.ticker} provides the deliberate growth tilt, but it is not allowed to dominate the entire allocation.`
    );
  }

  return notes;
}

function describeClient(profile: ClientProfile) {
  const mappedGoal = {
    growth: "long-term growth",
    balanced: "balanced accumulation",
    income: "cash-flow aware investing",
    retirement: "retirement-minded stability",
    inflation: "inflation-aware capital preservation"
  }[profile.goal];

  const objective = profile.investment_objective || mappedGoal;
  return `${profile.risk} risk, ${objective}, ${profile.horizon} horizon`;
}

function buildTradeoffs(profile: ClientProfile) {
  const common = [
    "A simpler ETF lineup improves explainability, but it will never express every possible market view at once.",
    "Using broad ETFs reduces accidental overlap, but it can feel less exciting than concentrated thematic products.",
    "A retail portfolio should optimize for staying invested, not for sounding maximally sophisticated."
  ];

  if (profile.preference === "technology") {
    common[1] =
      "Keeping a growth sleeve is intentional, but the portfolio avoids turning one sector preference into the whole risk budget.";
  }

  return common;
}

function buildRisks(profile: ClientProfile) {
  const base = [
    "Even diversified ETF portfolios still carry market risk and can draw down meaningfully in equity selloffs.",
    "International and defensive sleeves can lag US growth markets for long periods, even when they improve portfolio quality.",
    "Suitability depends on the client actually holding through the intended horizon."
  ];

  if (profile.goal === "income") {
    base[1] =
      "Income-focused ETFs can still behave like equities, so yield should not be mistaken for capital protection.";
  }

  return base;
}

function buildVoiceBrief(
  profile: ClientProfile,
  portfolio: PortfolioLine[],
  currentDiagnostics: Diagnostics | null
) {
  const topTwo = portfolio
    .slice(0, 2)
    .map((line) => `${line.ticker} at ${line.weight}%`)
    .join(", ");

  const opening =
    currentDiagnostics !== null
      ? "Here is your portfolio second opinion."
      : "Here is your ETF private banker brief.";

  return `${opening} For a ${describeClient(profile)} investor, the proposed ETF mix centers on ${topTwo}. The portfolio keeps product count low, weighted expenses disciplined, and diversification more intentional. The main trade-off is that cleaner portfolios often look less exciting, but they are usually easier to stay invested in.`;
}

function detectDuplicationSignals(tickers: string[]) {
  const notes: string[] = [];
  const hasGrowthStack =
    tickers.filter((ticker) => ["QQQ", "VOO", "VTI", "XLK", "ARKK", "SCHG"].includes(ticker)).length >= 3;
  const hasSectorStack =
    tickers.some((ticker) => ["XLK", "ARKK"].includes(ticker)) &&
    tickers.some((ticker) => ["QQQ", "VOO", "VTI", "SCHG"].includes(ticker));

  if (hasGrowthStack) {
    notes.push("Hidden overlap: several holdings still lead back to the same US mega-cap growth complex.");
  }

  if (hasSectorStack) {
    notes.push("Theme duplication: sector and thematic ETFs are layering on top of broad US equity rather than adding a new job.");
  }

  return notes;
}

function shiftFromDefensiveToRisk(sleeves: Sleeves, amount: number) {
  const move = Math.min(amount, sleeves.bonds + sleeves.cash);
  const fromBonds = Math.min(sleeves.bonds, move * 0.7);
  const fromCash = move - fromBonds;
  sleeves.bonds -= fromBonds;
  sleeves.cash -= fromCash;
  sleeves.usCore += move * 0.55;
  sleeves.usGrowth += move * 0.45;
}

function shiftFromRiskToDefensive(sleeves: Sleeves, amount: number) {
  const move = Math.min(amount, sleeves.usCore + sleeves.usGrowth + sleeves.international);
  const fromGrowth = Math.min(sleeves.usGrowth, move * 0.4);
  const fromIntl = Math.min(sleeves.international, move * 0.2);
  const fromCore = move - fromGrowth - fromIntl;
  sleeves.usGrowth -= fromGrowth;
  sleeves.international -= fromIntl;
  sleeves.usCore -= fromCore;
  sleeves.bonds += move * 0.65;
  sleeves.cash += move * 0.35;
}

function transferWeight(sleeves: Sleeves, from: keyof Sleeves, to: keyof Sleeves, amount: number) {
  const actual = Math.min(sleeves[from], amount);
  sleeves[from] -= actual;
  sleeves[to] += actual;
}

function roundWeight(value: number) {
  return Math.round(value * 10) / 10;
}

function roundNumber(value: number, digits: number) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
