"use client"

import { useEffect } from "react"
import { ArrowRight, RotateCcw } from "lucide-react"
import {
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { PageShell, PageHeader } from "@/components/pages/page-shell"
import { useApp } from "@/lib/store"
import {
  buildPortfolioBreakdown,
  buildPortfolioBacktest,
  type BreakdownPoint,
  portfolioColors,
  portfolioSummaryStats,
} from "@/lib/portfolio-visuals"

export function RecommendationPage({ onContinue }: { onContinue: () => void }) {
  const {
    result,
    adjustedPortfolio,
    activePortfolio,
    updateRecommendedWeight,
    resetRecommendedPortfolio,
    generateRecommendation,
    isPending,
    lastAnalysisMode,
    isDemoMode,
  } = useApp()

  useEffect(() => {
    if (!result && !isPending) {
      void generateRecommendation()
    }
  }, [generateRecommendation, isPending, result])

  if (!result) {
    return (
      <PageShell>
        <PageHeader
          eyebrow="Recommendation"
          title="Building your ETF lineup."
          intro="Méridian is turning the client profile into a clean allocation. If you have current holdings, run diagnosis first and this page will compare against them."
        />
        <div className="mt-14 h-1 overflow-hidden rounded-full bg-border">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-primary" />
        </div>
      </PageShell>
    )
  }

  const basePortfolio = result.currentHoldings.length > 0 ? result.currentHoldings : result.portfolio
  const portfolio = adjustedPortfolio.length > 0 ? adjustedPortfolio : activePortfolio
  const chartData = portfolio.map((line, index) => ({
    ...line,
    fill: portfolioColors[index % portfolioColors.length],
  }))
  const stats = portfolioSummaryStats(portfolio)
  const backtest = buildPortfolioBacktest(basePortfolio, portfolio)
  const assetBreakdown = buildPortfolioBreakdown(portfolio, "assetClass")
  const regionBreakdown = buildPortfolioBreakdown(portfolio, "region")
  const styleBreakdown = buildPortfolioBreakdown(portfolio, "style")

  return (
    <PageShell>
      <PageHeader
        eyebrow="Recommendation"
        title={result.headline}
        intro={result.clientSummary}
      />

      {isDemoMode ? (
        <p className="mb-8 border-y border-border py-3 text-sm text-muted-foreground">
          Demo mode is using local portfolio logic, so this screen remains presentable even without API credits.
        </p>
      ) : null}

      <section className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Allocation
          </p>
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="weight"
                  nameKey="ticker"
                  innerRadius={72}
                  outerRadius={118}
                  paddingAngle={2}
                  stroke="var(--background)"
                  strokeWidth={3}
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.ticker} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, _name, item) => [
                    `${value.toFixed(1)}%`,
                    item.payload.ticker,
                  ]}
                  contentStyle={{
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    background: "var(--card)",
                    color: "var(--foreground)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border text-sm">
            <Stat label="Equity" value={`${stats.equity}%`} />
            <Stat label="Defensive" value={`${stats.defensive}%`} />
            <Stat label="Funds" value={String(stats.funds)} />
            <Stat label="Blended fee" value={`${stats.fee}%`} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Backtest path
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#c8c0b4]" />
                {lastAnalysisMode === "review" ? "Current" : "Proposal"}
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#3a3128]" />
                Adjusted
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#66705d]" />
                Benchmark
              </span>
            </div>
          </div>
          <div className="mt-5 h-72 border-y border-border py-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={backtest}>
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
                <Line type="monotone" dataKey="base" dot={false} stroke="#c8c0b4" strokeWidth={2} />
                <Line type="monotone" dataKey="adjusted" dot={false} stroke="#3a3128" strokeWidth={2.5} />
                <Line
                  type="monotone"
                  dataKey="benchmark"
                  dot={false}
                  stroke="#66705d"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="mt-14 grid gap-8 border-y border-border py-8 lg:grid-cols-3">
        <Breakdown title="Asset class" data={assetBreakdown} />
        <Breakdown title="Region" data={regionBreakdown} />
        <Breakdown title="Role" data={styleBreakdown} />
      </section>

      <section className="mt-14">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-serif text-2xl font-light text-foreground">
            Adjust the proposal
          </h2>
          <button
            onClick={resetRecommendedPortfolio}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
        </div>

        <div className="mt-6 divide-y divide-border border-y border-border">
          {portfolio.map((line, index) => (
            <div key={line.ticker} className="grid gap-4 py-5 md:grid-cols-[1fr_220px] md:items-center">
              <div className="flex items-start gap-4">
                <span
                  className="mt-1 h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: portfolioColors[index % portfolioColors.length] }}
                />
                <div>
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-medium text-foreground">{line.ticker}</span>
                    <span className="text-sm text-muted-foreground">{line.name}</span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {line.why}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="1"
                  value={line.weight}
                  onChange={(event) => updateRecommendedWeight(line.ticker, Number(event.target.value))}
                  className="w-full accent-[#3a3128]"
                  aria-label={`${line.ticker} allocation`}
                />
                <span className="w-14 text-right text-sm tabular-nums text-foreground">
                  {line.weight.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-8 border-y border-border py-8 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Why this
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-foreground">
            {result.whyThisPortfolio}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Watch-outs
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-foreground">
            {result.risks[0]}
          </p>
        </div>
      </section>

      <div className="mt-8 flex justify-end">
        <button
          onClick={onContinue}
          className="group inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-accent"
        >
          Stress-test this portfolio
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
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

function Breakdown({ title, data }: { title: string; data: BreakdownPoint[] }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        {title}
      </p>
      <div className="mt-5 space-y-4">
        {data.map((item) => (
          <div key={item.name}>
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-foreground">{item.name}</span>
              <span className="tabular-nums text-muted-foreground">
                {item.weight.toFixed(1)}%
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full"
                style={{ width: `${item.weight}%`, backgroundColor: item.fill }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
