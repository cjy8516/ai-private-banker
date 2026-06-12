"use client"

import { useEffect } from "react"
import { ArrowUp } from "lucide-react"
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { PageShell, PageHeader } from "@/components/pages/page-shell"
import { useApp } from "@/lib/store"
import {
  buildScenarioBacktest,
  portfolioColors,
  portfolioSummaryStats,
} from "@/lib/portfolio-visuals"

const prompts = [
  "What if the AI bubble unwinds?",
  "What if inflation accelerates again?",
  "What if Trump raises tariffs again?",
  "What if the US falls into recession?",
]

export function ScenarioPage() {
  const {
    scenarioQuestion,
    setScenarioQuestion,
    scenario,
    runScenario,
    activePortfolio,
    result,
    generateRecommendation,
    isPending,
    lastAnalysisMode,
  } = useApp()

  useEffect(() => {
    if (!result && !isPending) {
      void generateRecommendation()
    }
  }, [generateRecommendation, isPending, result])

  const stats = portfolioSummaryStats(activePortfolio)
  const scenarioPath = buildScenarioBacktest(activePortfolio, scenario)
  const sourceLabel =
    lastAnalysisMode === "review"
      ? "Diagnosis-informed portfolio"
      : "Recommended portfolio"

  return (
    <PageShell>
      <PageHeader
        eyebrow="Scenario"
        title="Stress-test the active portfolio."
        intro={`Using ${sourceLabel.toLowerCase()}: diagnosed holdings take priority; otherwise Méridian uses the recommendation page allocation.`}
      />

      <div className="rounded-lg border border-border bg-card p-2">
        <div className="flex items-end gap-2">
          <textarea
            value={scenarioQuestion}
            onChange={(e) => setScenarioQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                runScenario()
              }
            }}
            rows={2}
            placeholder="What if the AI bubble unwinds?"
            className="flex-1 resize-none bg-transparent px-4 py-3 text-[15px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={() => runScenario()}
            disabled={!scenarioQuestion.trim()}
            aria-label="Ask"
            className="mb-1 mr-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {prompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => runScenario(prompt)}
            className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
          >
            {prompt}
          </button>
        ))}
      </div>

      <section className="mt-12 grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Active portfolio
          </p>
          <div className="mt-5 divide-y divide-border border-y border-border">
            {activePortfolio.slice(0, 6).map((line, index) => (
              <div key={line.ticker} className="flex items-center justify-between gap-4 py-3">
                <span className="inline-flex items-center gap-3">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: portfolioColors[index % portfolioColors.length] }}
                  />
                  <span className="font-medium text-foreground">{line.ticker}</span>
                </span>
                <span className="text-sm tabular-nums text-muted-foreground">
                  {line.weight.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border text-sm">
            <Stat label="Equity" value={`${stats.equity}%`} />
            <Stat label="Defensive" value={`${stats.defensive}%`} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Scenario path
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#c8c0b4]" />
                Baseline
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#8f6a3a]" />
                Best
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#3a3128]" />
                Worst
              </span>
            </div>
          </div>
          <div className="mt-5 h-72 border-y border-border py-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={scenarioPath}>
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis
                  domain={["dataMin - 2", "dataMax + 2"]}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                  width={34}
                />
                <Tooltip
                  formatter={(value: number) => value.toFixed(1)}
                  contentStyle={{
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    background: "var(--card)",
                    color: "var(--foreground)",
                  }}
                />
                <Line type="monotone" dataKey="baseline" dot={false} stroke="#c8c0b4" strokeWidth={2} />
                <Line type="monotone" dataKey="best" dot={false} stroke="#8f6a3a" strokeWidth={2.5} />
                <Line type="monotone" dataKey="worst" dot={false} stroke="#3a3128" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {scenario ? (
        <article className="mt-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <h2 className="font-serif text-2xl font-light leading-snug text-foreground">
            {scenario.title}
          </h2>

          <div className="mt-6 grid gap-8 border-y border-border py-6 md:grid-cols-3">
            <ScenarioStat label="Impact" value={scenario.impact} />
            <ScenarioStat label="Affected" value={scenario.affectedHoldings.join(", ") || "Broad portfolio"} />
            <ScenarioStat label="Question" value={scenarioQuestion} />
          </div>

          <div className="mt-8 grid gap-10 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Main risk
              </p>
              <p className="mt-3 text-[15px] leading-relaxed text-foreground">
                {scenario.risks[0]}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Suggested action
              </p>
              <p className="mt-3 text-[15px] leading-relaxed text-foreground">
                {scenario.suggestedActions[0]}
              </p>
            </div>
          </div>
        </article>
      ) : null}
    </PageShell>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 font-serif text-xl text-foreground">{value}</p>
    </div>
  )
}

function ScenarioStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-[15px] leading-relaxed text-foreground">{value}</p>
    </div>
  )
}
