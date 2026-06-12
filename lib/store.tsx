"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

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

export type AppView = "client" | "diagnosis" | "recommendation" | "scenario"

type AppState = {
  profile: ClientProfile
  setField: (key: keyof ClientProfile, value: string) => void
  resetProfile: () => void
  onboarded: boolean
  setOnboarded: (v: boolean) => void
  portfolioText: string
  setPortfolioText: (v: string) => void
  hasDiagnosis: boolean
  setHasDiagnosis: (v: boolean) => void
}

const Ctx = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<ClientProfile>(emptyProfile)
  const [onboarded, setOnboarded] = useState(false)
  const [portfolioText, setPortfolioText] = useState("")
  const [hasDiagnosis, setHasDiagnosis] = useState(false)

  const setField = useCallback((key: keyof ClientProfile, value: string) => {
    setProfile((p) => ({ ...p, [key]: value }))
  }, [])

  const resetProfile = useCallback(() => setProfile(emptyProfile), [])

  const value = useMemo(
    () => ({
      profile,
      setField,
      resetProfile,
      onboarded,
      setOnboarded,
      portfolioText,
      setPortfolioText,
      hasDiagnosis,
      setHasDiagnosis,
    }),
    [profile, setField, resetProfile, onboarded, portfolioText, hasDiagnosis],
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
    options: ["Long-term growth", "Steady income", "Capital preservation", "Retirement"],
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
    placeholder: "e.g. tobacco, single-country concentration, leveraged products",
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
