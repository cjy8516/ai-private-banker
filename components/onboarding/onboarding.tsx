"use client"

import { useState } from "react"
import { ArrowRight } from "lucide-react"
import { Wordmark } from "@/components/wordmark"
import { Questionnaire } from "@/components/onboarding/questionnaire"

export function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [stage, setStage] = useState<"intro" | "questions">("intro")

  return (
    <main className="relative flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-6 md:px-12">
        <Wordmark />
        {stage === "intro" ? (
          <button
            onClick={onComplete}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Skip intro
          </button>
        ) : (
          <span className="text-sm text-muted-foreground">Client intake</span>
        )}
      </header>

      {stage === "intro" ? (
        <Intro onBegin={() => setStage("questions")} onSkip={onComplete} />
      ) : (
        <Questionnaire onDone={onComplete} />
      )}
    </main>
  )
}

function Intro({ onBegin, onSkip }: { onBegin: () => void; onSkip: () => void }) {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-12 md:px-12">
      <div className="w-full max-w-2xl text-center">
        <p className="mb-6 text-xs uppercase tracking-[0.28em] text-muted-foreground">
          An AI private banker
        </p>
        <h1 className="text-balance font-serif text-4xl font-light leading-[1.1] text-foreground md:text-6xl">
          For ETF investors who want
          <span className="italic"> intention</span>, not noise.
        </h1>
        <p className="mx-auto mt-7 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
          Méridian turns messy portfolios into cleaner, more deliberate
          allocations — diagnosing overlap and fee drag, then proposing a
          lineup built around your goals.
        </p>

        <div className="mx-auto mt-12 grid max-w-xl gap-px overflow-hidden rounded-xl border border-border bg-border text-left md:grid-cols-3">
          {[
            {
              t: "Diagnose",
              d: "See overlap, concentration, and hidden fee drag in seconds.",
            },
            {
              t: "Reallocate",
              d: "A high-conviction lineup matched to your profile.",
            },
            {
              t: "Stress-test",
              d: "Ask one macro question and understand your exposure.",
            },
          ].map((x) => (
            <div key={x.t} className="bg-card p-5">
              <p className="font-serif text-base text-foreground">{x.t}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {x.d}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button
            onClick={onBegin}
            className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Begin your intake
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
          <button
            onClick={onSkip}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Explore the app first
          </button>
        </div>
      </div>
    </div>
  )
}
