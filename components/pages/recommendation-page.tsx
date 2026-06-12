"use client"

import { ArrowRight, Minus, Plus, RefreshCw } from "lucide-react"
import { PageShell, PageHeader } from "@/components/pages/page-shell"

type Action = "keep" | "reduce" | "replace"

const moves: {
  action: Action
  ticker: string
  name: string
  from: string
  to: string
  note: string
}[] = [
  {
    action: "keep",
    ticker: "VTI",
    name: "Total US Market",
    from: "15%",
    to: "30%",
    note: "Your cleanest, lowest-cost core. We let it carry the US sleeve outright.",
  },
  {
    action: "reduce",
    ticker: "VOO / QQQ",
    name: "S&P 500 + Nasdaq",
    from: "60%",
    to: "0%",
    note: "Folded into VTI. Holding all three was paying three times for one exposure.",
  },
  {
    action: "replace",
    ticker: "ARKK",
    name: "Active innovation",
    from: "9%",
    to: "0%",
    note: "High fee, high turnover, and concentrated in bets you already hold indirectly.",
  },
  {
    action: "replace",
    ticker: "AAPL",
    name: "Single stock",
    from: "8%",
    to: "0%",
    note: "Idiosyncratic risk with no diversification benefit inside an ETF portfolio.",
  },
  {
    action: "keep",
    ticker: "VXUS",
    name: "Total International",
    from: "0%",
    to: "25%",
    note: "Adds the ex-US half of the world your portfolio was missing entirely.",
  },
  {
    action: "keep",
    ticker: "BND",
    name: "Total Bond Market",
    from: "0%",
    to: "12%",
    note: "A ballast sized to your balanced risk tolerance and horizon.",
  },
]

const actionMeta: Record<Action, { label: string; icon: typeof Plus; cls: string }> = {
  keep: { label: "Keep", icon: Plus, cls: "text-accent" },
  reduce: { label: "Reduce", icon: Minus, cls: "text-muted-foreground" },
  replace: { label: "Replace", icon: RefreshCw, cls: "text-destructive" },
}

const alternatives = [
  {
    q: "Why not just hold VOO and call it done?",
    a: "It is excellent — and entirely US large-cap. On its own it leaves you exposed to a single market's valuation cycle, with no international or fixed-income offset.",
  },
  {
    q: "Why not a target-date or all-in-one fund?",
    a: "Convenient, but opaque and slightly pricier. With three or four index funds you keep the same simplicity while seeing — and controlling — exactly what you own.",
  },
  {
    q: "Why not chase the high-growth sleeve?",
    a: "You already hold the winners through the broad index. Layering ARKK on top concentrates risk without adding genuinely new exposure.",
  },
]

export function RecommendationPage({ onContinue }: { onContinue: () => void }) {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Recommendation"
        title="A cleaner, more intentional lineup"
        intro="Four funds doing four distinct jobs — broad US, international, bonds, and ballast — matched to your balanced, long-horizon profile."
      />

      <div className="divide-y divide-border border-y border-border">
        {moves.map((m) => {
          const meta = actionMeta[m.action]
          const Icon = meta.icon
          return (
            <div key={m.ticker} className="flex items-start gap-5 py-5">
              <span className={`mt-0.5 inline-flex items-center gap-1.5 text-xs uppercase tracking-wider ${meta.cls} w-24 shrink-0`}>
                <Icon className="h-3.5 w-3.5" />
                {meta.label}
              </span>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-medium text-foreground">{m.ticker}</span>
                  <span className="text-sm text-muted-foreground">{m.name}</span>
                </div>
                <p className="mt-1 text-[15px] leading-relaxed text-muted-foreground">
                  {m.note}
                </p>
              </div>
              <div className="hidden shrink-0 items-center gap-2 pt-0.5 text-sm tabular-nums sm:flex">
                <span className="text-muted-foreground line-through">{m.from}</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium text-foreground">{m.to}</span>
              </div>
            </div>
          )
        })}
      </div>

      <section className="mt-12">
        <h2 className="font-serif text-2xl font-light text-foreground">
          Why this is better
        </h2>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          You move from seven overlapping positions to four deliberate ones.
          Blended fees fall from roughly 0.38% to under 0.05%, single-name risk
          disappears, and for the first time the portfolio holds the whole world
          and a genuine bond ballast — without giving up a basis point of the
          US growth you came for.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-2xl font-light text-foreground">
          Why not the obvious alternatives
        </h2>
        <div className="mt-6 divide-y divide-border border-y border-border">
          {alternatives.map((x) => (
            <div key={x.q} className="py-5">
              <p className="font-serif text-base italic text-foreground">{x.q}</p>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                {x.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-8 flex justify-end">
        <button
          onClick={onContinue}
          className="group inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-accent"
        >
          Stress-test a scenario
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </PageShell>
  )
}
