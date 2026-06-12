"use client"

import { useState } from "react"
import { ArrowUp } from "lucide-react"
import { PageShell, PageHeader } from "@/components/pages/page-shell"

const prompts = [
  "What if the AI bubble unwinds?",
  "What if inflation stays high?",
  "What if the dollar weakens?",
  "What if rates stay higher for longer?",
]

type Answer = {
  whatHappens: string
  exposure: { label: string; body: string }[]
  actions: string[]
}

const aiAnswer: Answer = {
  whatHappens:
    "A meaningful de-rating of the mega-cap technology and AI-adjacent names that have led the market. Expect a sharp drawdown concentrated in growth, with broad indices dragged down by their top weightings before the rest of the market stabilises.",
  exposure: [
    {
      label: "Most exposed",
      body: "Your US core (VTI) carries the AI leaders by market weight — roughly a fifth of it sits in the names most at risk. This is unavoidable in any broad index, and it is the price of owning the upside too.",
    },
    {
      label: "Partly insulated",
      body: "International equity (VXUS) is far less concentrated in AI, so it would likely fall less and recover on a different timeline.",
    },
    {
      label: "Ballast",
      body: "Your bond sleeve (BND) is the deliberate counterweight — it should hold or rise as capital rotates toward safety.",
    },
  ],
  actions: [
    "Resist the urge to sell the core. The index already self-corrects as weights fall; selling locks in the drawdown.",
    "Rebalance into weakness — trimming bonds to top up equities restores your target mix at better prices.",
    "Treat it as confirmation of the plan: diversification across the world and across assets is precisely what cushions a single-theme unwind.",
  ],
}

export function ScenarioPage() {
  const [question, setQuestion] = useState("")
  const [asked, setAsked] = useState<string | null>(null)

  function ask(q: string) {
    const text = q.trim()
    if (!text) return
    setAsked(text)
    setQuestion("")
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Scenario"
        title="Ask one question. Think it through together."
        intro="A considered, private-banker view on a single macro question — what could happen, what it touches in your portfolio, and what may make sense."
      />

      <div className="rounded-2xl border border-border bg-card p-2">
        <div className="flex items-end gap-2">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                ask(question)
              }
            }}
            rows={2}
            placeholder="What if the AI bubble unwinds?"
            className="flex-1 resize-none bg-transparent px-4 py-3 text-[15px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={() => ask(question)}
            disabled={!question.trim()}
            aria-label="Ask"
            className="mb-1 mr-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!asked && (
        <div className="mt-5 flex flex-wrap gap-2">
          {prompts.map((p) => (
            <button
              key={p}
              onClick={() => ask(p)}
              className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {asked && (
        <article className="mt-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <h2 className="font-serif text-2xl font-light leading-snug text-foreground">
            {asked}
          </h2>

          <div className="mt-8">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              What could happen
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-foreground">
              {aiAnswer.whatHappens}
            </p>
          </div>

          <div className="mt-10">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              What is exposed
            </p>
            <div className="mt-4 divide-y divide-border border-y border-border">
              {aiAnswer.exposure.map((e) => (
                <div key={e.label} className="flex gap-6 py-4">
                  <p className="w-36 shrink-0 font-serif text-base text-foreground">
                    {e.label}
                  </p>
                  <p className="text-[15px] leading-relaxed text-muted-foreground">
                    {e.body}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              What may make sense
            </p>
            <ul className="mt-4 space-y-4">
              {aiAnswer.actions.map((a, i) => (
                <li key={i} className="flex gap-4">
                  <span className="font-serif text-base text-accent">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[15px] leading-relaxed text-foreground">
                    {a}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-12 border-t border-border pt-6 text-sm leading-relaxed text-muted-foreground">
            This is guidance for reflection, not personalised financial advice.
            Consider your full circumstances before acting.
          </p>
        </article>
      )}
    </PageShell>
  )
}
