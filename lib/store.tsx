"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  buildRecommendation,
  generateScenarioAnalysis,
  type ClientProfile as BankerProfile,
  type PortfolioLine,
  type RecommendationResult,
  type ScenarioAnalysis,
} from "@/lib/etf-banker"
import type { MarketIntel } from "@/lib/alpha-vantage"
import {
  normalizePortfolio,
  updatePortfolioWeight,
} from "@/lib/portfolio-visuals"

export type ClientProfile = {
  age: string
  assets: string
  goal: string
  risk: string
  horizon: string
  region: string
  exclusions: string
  esg: string
  notes: string
}

export const emptyProfile: ClientProfile = {
  age: "",
  assets: "",
  goal: "",
  risk: "",
  horizon: "",
  region: "",
  exclusions: "",
  esg: "",
  notes: "",
}

type ApiResponse = RecommendationResult & {
  marketIntel?: MarketIntel | null
  source: "rules" | "rules+openai"
  error?: string
}

export type AppView = "client" | "diagnosis" | "recommendation" | "scenario"

type AppState = {
  profile: ClientProfile
  setField: (key: keyof ClientProfile, value: string) => void
  resetProfile: () => void
  onboarded: boolean
  setOnboarded: (v: boolean) => void
  portfolioText: string
  setPortfolioText: (v: string) => void
  uploadedFileName: string | null
  setUploadedFileName: (v: string | null) => void
  lastAnalysisMode: "build" | "review" | null
  result: ApiResponse | null
  scenarioQuestion: string
  setScenarioQuestion: (v: string) => void
  scenario: ScenarioAnalysis | null
  adjustedPortfolio: PortfolioLine[]
  activePortfolio: PortfolioLine[]
  error: string | null
  isPending: boolean
  hasDiagnosis: boolean
  isDemoMode: boolean
  updateRecommendedWeight: (ticker: string, weight: number) => void
  resetRecommendedPortfolio: () => void
  loadDemo: () => void
  generateRecommendation: () => Promise<boolean>
  runDiagnosis: () => Promise<boolean>
  runScenario: (questionOverride?: string) => void
}

const defaultScenarioQuestion = "What if the AI bubble unwinds?"

const initialResult = buildRecommendation({
  mode: "review",
  profile: toBankerProfile({
    ...emptyProfile,
    age: "45 – 60",
    assets: "€250k – €1M",
    goal: "Long-term growth",
    risk: "Balanced",
    horizon: "7 – 15 years",
    region: "US-focused",
    exclusions: "Single stock concentration",
    esg: "Nice to have",
    notes: "I want a cleaner portfolio with less overlap."
  }),
  holdingsText: "QQQ 40\nVOO 30\nARKK 20\nCash 10"
})

const initialScenario = generateScenarioAnalysis(
  defaultScenarioQuestion,
  toBankerProfile(emptyProfile),
  initialResult.portfolio
)

const Ctx = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<ClientProfile>(emptyProfile)
  const [onboarded, setOnboarded] = useState(false)
  const [portfolioText, setPortfolioText] = useState("")
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const [lastAnalysisMode, setLastAnalysisMode] = useState<"build" | "review" | null>(null)
  const [result, setResult] = useState<ApiResponse | null>(null)
  const [adjustedPortfolio, setAdjustedPortfolio] = useState<PortfolioLine[]>([])
  const [scenarioQuestion, setScenarioQuestion] = useState(defaultScenarioQuestion)
  const [scenario, setScenario] = useState<ScenarioAnalysis | null>(initialScenario)
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [isDemoMode, setIsDemoMode] = useState(false)

  const setField = useCallback((key: keyof ClientProfile, value: string) => {
    setProfile((p) => ({ ...p, [key]: value }))
  }, [])

  const resetProfile = useCallback(() => setProfile(emptyProfile), [])

  const generateRecommendation = useCallback(async () => {
    setIsPending(true)
    setError(null)

    try {
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "build",
          profile: toBankerProfile(profile),
          holdingsText: "",
        }),
      })

      const data = (await response.json()) as ApiResponse
      if (!response.ok || data.error) {
        setError(data.error ?? "Unable to generate a recommendation right now.")
        return false
      }

      setResult(data)
      setAdjustedPortfolio(normalizePortfolio(data.portfolio))
      setLastAnalysisMode("build")
      setScenario(generateScenarioAnalysis(scenarioQuestion, toBankerProfile(profile), data.portfolio))
      return true
    } catch {
      const fallback = buildRecommendation({
        mode: "build",
        profile: toBankerProfile(profile),
        holdingsText: "",
      }) as ApiResponse

      fallback.source = "rules"
      fallback.marketIntel = {
        status: "unavailable",
        note: "Demo fallback is using local portfolio logic.",
        currentFunds: [],
        proposedFunds: [],
        overlapHighlights: [],
        backtest: null,
      }

      setResult(fallback)
      setAdjustedPortfolio(normalizePortfolio(fallback.portfolio))
      setLastAnalysisMode("build")
      setScenario(generateScenarioAnalysis(scenarioQuestion, toBankerProfile(profile), fallback.portfolio))
      setIsDemoMode(true)
      return true
    } finally {
      setIsPending(false)
    }
  }, [profile, scenarioQuestion])

  const runDiagnosis = useCallback(async () => {
    setIsPending(true)
    setError(null)

    try {
      const holdings = portfolioText.trim()
      if (!holdings) {
        setError("Paste holdings or upload a text or CSV file before running diagnosis.")
        return false
      }

      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "review",
          profile: toBankerProfile(profile),
          holdingsText: holdings,
        }),
      })

      const data = (await response.json()) as ApiResponse
      if (!response.ok || data.error) {
        setError(data.error ?? "Unable to diagnose the portfolio right now.")
        return false
      }

      setResult(data)
      setAdjustedPortfolio(normalizePortfolio(data.portfolio))
      setLastAnalysisMode("review")
      setScenario(generateScenarioAnalysis(scenarioQuestion, toBankerProfile(profile), data.portfolio))
      return true
    } catch {
      setError("Unable to diagnose the portfolio right now.")
      return false
    } finally {
      setIsPending(false)
    }
  }, [portfolioText, profile, scenarioQuestion])

  const runScenario = useCallback((questionOverride?: string) => {
    const activeQuestion = questionOverride ?? scenarioQuestion
    const fallbackPortfolio = buildRecommendation({
        mode: "build",
        profile: toBankerProfile(profile),
        holdingsText: "",
      }).portfolio
    const portfolio =
      adjustedPortfolio.length > 0 ? adjustedPortfolio : result?.portfolio ?? fallbackPortfolio

    if (questionOverride) {
      setScenarioQuestion(questionOverride)
    }

    setScenario(generateScenarioAnalysis(activeQuestion, toBankerProfile(profile), portfolio))
  }, [adjustedPortfolio, profile, result, scenarioQuestion])

  const updateRecommendedWeight = useCallback((ticker: string, weight: number) => {
    setAdjustedPortfolio((current) => updatePortfolioWeight(current, ticker, weight))
  }, [])

  const resetRecommendedPortfolio = useCallback(() => {
    if (!result) return
    setAdjustedPortfolio(normalizePortfolio(result.portfolio))
  }, [result])

  const loadDemo = useCallback(() => {
    const demoProfile: ClientProfile = {
      age: "45 – 60",
      assets: "Over €1M",
      goal: "Long-term growth",
      risk: "Balanced",
      horizon: "7 – 15 years",
      region: "US-focused",
      exclusions: "China, single stock concentration",
      esg: "Nice to have",
      notes: "I like AI, but I do not want hidden overlap or too many funds.",
    }
    const demoHoldings = "QQQ 40\nVOO 30\nARKK 20\nCash 10"
    const demoResult = buildRecommendation({
      mode: "review",
      profile: toBankerProfile(demoProfile),
      holdingsText: demoHoldings,
    }) as ApiResponse

    demoResult.source = "rules"
    demoResult.marketIntel = {
      status: "unavailable",
      note: "Demo mode uses local portfolio logic so the presentation still works without API credits.",
      currentFunds: [],
      proposedFunds: [],
      overlapHighlights: [],
      backtest: null,
    }

    setProfile(demoProfile)
    setPortfolioText(demoHoldings)
    setResult(demoResult)
    setAdjustedPortfolio(normalizePortfolio(demoResult.portfolio))
    setLastAnalysisMode("review")
    setScenarioQuestion(defaultScenarioQuestion)
    setScenario(generateScenarioAnalysis(defaultScenarioQuestion, toBankerProfile(demoProfile), demoResult.portfolio))
    setError(null)
    setIsDemoMode(true)
    setOnboarded(true)
  }, [])

  const activePortfolio = useMemo(() => {
    if (adjustedPortfolio.length > 0) return adjustedPortfolio
    if (result?.portfolio.length) return result.portfolio
    return initialResult.portfolio
  }, [adjustedPortfolio, result])

  const value = useMemo(
    () => ({
      profile,
      setField,
      resetProfile,
      onboarded,
      setOnboarded,
      portfolioText,
      setPortfolioText,
      uploadedFileName,
      setUploadedFileName,
      lastAnalysisMode,
      result,
      scenarioQuestion,
      setScenarioQuestion,
      scenario,
      adjustedPortfolio,
      activePortfolio,
      error,
      isPending,
      hasDiagnosis: lastAnalysisMode === "review" && result !== null,
      isDemoMode,
      updateRecommendedWeight,
      resetRecommendedPortfolio,
      loadDemo,
      generateRecommendation,
      runDiagnosis,
      runScenario,
    }),
    [
      error,
      generateRecommendation,
      activePortfolio,
      adjustedPortfolio,
      isPending,
      isDemoMode,
      lastAnalysisMode,
      loadDemo,
      onboarded,
      portfolioText,
      profile,
      resetProfile,
      result,
      runDiagnosis,
      runScenario,
      scenario,
      scenarioQuestion,
      setField,
      resetRecommendedPortfolio,
      updateRecommendedWeight,
      uploadedFileName,
    ],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useApp must be used within AppProvider")
  return ctx
}

export type Question = {
  key: keyof ClientProfile
  label: string
  prompt: string
  helper?: string
  type: "options" | "text"
  options?: string[]
  placeholder?: string
}

export const questions: Question[] = [
  {
    key: "age",
    label: "Age",
    prompt: "How old are you?",
    helper: "This helps us frame your time horizon and capacity for risk.",
    type: "options",
    options: ["Under 30", "30 – 45", "45 – 60", "60 +"],
  },
  {
    key: "assets",
    label: "Investable assets",
    prompt: "Roughly how much are you investing?",
    helper: "An approximate range is perfectly fine.",
    type: "options",
    options: ["Under €50k", "€50k – €250k", "€250k – €1M", "Over €1M"],
  },
  {
    key: "goal",
    label: "Primary goal",
    prompt: "What is this portfolio for?",
    helper: "Your intent shapes everything that follows.",
    type: "options",
    options: ["Long-term growth", "Balanced accumulation", "Steady income", "Retirement"],
  },
  {
    key: "risk",
    label: "Risk tolerance",
    prompt: "How would you describe your appetite for risk?",
    helper: "There is no right answer — only what lets you sleep at night.",
    type: "options",
    options: ["Conservative", "Balanced", "Growth", "Aggressive"],
  },
  {
    key: "horizon",
    label: "Time horizon",
    prompt: "When might you need this money?",
    type: "options",
    options: ["Under 3 years", "3 – 7 years", "7 – 15 years", "15 + years"],
  },
  {
    key: "region",
    label: "Region preference",
    prompt: "Any regions you lean toward?",
    helper: "We will weight your allocation accordingly.",
    type: "options",
    options: ["Global", "US-focused", "Europe", "Emerging markets"],
  },
  {
    key: "exclusions",
    label: "Exclusions",
    prompt: "Anything you would rather avoid?",
    helper: "Sectors, regions, or themes you would prefer to exclude.",
    type: "text",
    placeholder: "e.g. China, single-stock bets, leveraged products",
  },
  {
    key: "esg",
    label: "ESG preference",
    prompt: "How important is sustainability to you?",
    type: "options",
    options: ["Not a priority", "Nice to have", "Important", "Essential"],
  },
  {
    key: "notes",
    label: "Notes",
    prompt: "Anything else we should know?",
    helper: "Context, concerns, or constraints — in your own words.",
    type: "text",
    placeholder: "Optional notes for your private banker…",
  },
]

function toBankerProfile(profile: ClientProfile): BankerProfile {
  const goal = mapGoal(profile.goal)
  const risk = mapRisk(profile.risk)
  const horizon = mapHorizon(profile.horizon)
  const preference = mapPreference(profile.region, profile.notes)
  const style: BankerProfile["style"] =
    goal === "income" ? "income" : goal === "balanced" ? "balanced" : "growth"

  return {
    client_name: "Private client",
    age: profile.age || "55",
    investable_assets: profile.assets || "€250k – €1M",
    investment_objective: profile.goal || "Long-term growth with controlled concentration",
    preferred_regions: profile.region || "Global",
    excluded_regions: profile.exclusions || "",
    esg_preference: profile.esg || "Neutral",
    goal,
    risk,
    horizon,
    style,
    preference,
    note: profile.notes || "",
  }
}

function mapGoal(goal: string) {
  switch (goal) {
    case "Steady income":
      return "income" as const
    case "Retirement":
      return "retirement" as const
    case "Balanced accumulation":
      return "balanced" as const
    default:
      return "growth" as const
  }
}

function mapRisk(risk: string) {
  switch (risk) {
    case "Conservative":
      return "conservative" as const
    case "Aggressive":
      return "aggressive" as const
    default:
      return "moderate" as const
  }
}

function mapHorizon(horizon: string) {
  switch (horizon) {
    case "Under 3 years":
      return "1-3y" as const
    case "3 – 7 years":
      return "3-7y" as const
    default:
      return "7y+" as const
  }
}

function mapPreference(region: string, notes: string) {
  const loweredNotes = notes.toLowerCase()
  if (loweredNotes.includes("inflation")) return "inflation-hedge" as const
  if (loweredNotes.includes("dividend") || loweredNotes.includes("income")) return "dividend" as const
  if (loweredNotes.includes("tech") || loweredNotes.includes("ai")) return "technology" as const

  switch (region) {
    case "Global":
      return "global" as const
    case "US-focused":
      return "us-core" as const
    default:
      return "global" as const
  }
}
