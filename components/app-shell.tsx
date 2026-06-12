"use client"

import { useState } from "react"
import {
  UserRound,
  Stethoscope,
  Sparkles,
  CloudLightning,
  Menu,
  X,
} from "lucide-react"
import type { AppView } from "@/lib/store"
import { Wordmark } from "@/components/wordmark"
import { ClientPage } from "@/components/pages/client-page"
import { DiagnosisPage } from "@/components/pages/diagnosis-page"
import { RecommendationPage } from "@/components/pages/recommendation-page"
import { ScenarioPage } from "@/components/pages/scenario-page"

const nav: { key: AppView; label: string; icon: typeof UserRound; desc: string }[] = [
  { key: "client", label: "Client", icon: UserRound, desc: "Profile & intake" },
  { key: "diagnosis", label: "Diagnosis", icon: Stethoscope, desc: "Current portfolio" },
  { key: "recommendation", label: "Recommendation", icon: Sparkles, desc: "Cleaner lineup" },
  { key: "scenario", label: "Scenario", icon: CloudLightning, desc: "Macro questions" },
]

export function AppShell() {
  const [view, setView] = useState<AppView>("client")
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform md:static md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-6">
          <Wordmark />
          <button
            className="text-sidebar-foreground md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3">
          {nav.map((item) => {
            const active = view === item.key
            const Icon = item.icon
            return (
              <button
                key={item.key}
                onClick={() => {
                  setView(item.key)
                  setMobileOpen(false)
                }}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                }`}
              >
                <Icon
                  className={`h-[18px] w-[18px] shrink-0 ${active ? "text-accent" : "text-muted-foreground"}`}
                />
                <span className="flex flex-col">
                  <span className="text-sm font-medium leading-tight">{item.label}</span>
                  <span className="text-[11px] leading-tight text-muted-foreground">
                    {item.desc}
                  </span>
                </span>
              </button>
            )
          })}
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
              AM
            </span>
            <span className="flex flex-col">
              <span className="text-sm font-medium text-sidebar-foreground">
                Private client
              </span>
              <span className="text-[11px] text-muted-foreground">Méridian Advisory</span>
            </span>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-foreground/20 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-3 border-b border-border px-6 py-4 md:hidden">
          <button onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5 text-foreground" />
          </button>
          <Wordmark />
        </div>

        <main className="flex-1">
          {view === "client" && <ClientPage onContinue={() => setView("diagnosis")} />}
          {view === "diagnosis" && <DiagnosisPage onContinue={() => setView("recommendation")} />}
          {view === "recommendation" && <RecommendationPage onContinue={() => setView("scenario")} />}
          {view === "scenario" && <ScenarioPage />}
        </main>
      </div>
    </div>
  )
}
