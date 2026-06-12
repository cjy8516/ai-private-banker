"use client"

import { useState } from "react"
import { ArrowRight, ArrowLeft, Check } from "lucide-react"
import { questions, useApp } from "@/lib/store"

export function Questionnaire({ onDone }: { onDone: () => void }) {
  const { profile, setField } = useApp()
  const [step, setStep] = useState(0)
  const q = questions[step]
  const isLast = step === questions.length - 1
  const value = profile[q.key]

  function next() {
    if (isLast) {
      onDone()
      return
    }
    setStep((s) => s + 1)
  }

  function back() {
    setStep((s) => Math.max(0, s - 1))
  }

  return (
    <div className="flex flex-1 flex-col px-6 py-8 md:px-12">
      {/* progress */}
      <div className="mx-auto w-full max-w-xl">
        <div className="flex items-center gap-1.5">
          {questions.map((_, i) => (
            <span
              key={i}
              className={`h-0.5 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-accent" : "bg-border"
              }`}
            />
          ))}
        </div>
        <p className="mt-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {String(step + 1).padStart(2, "0")} / {String(questions.length).padStart(2, "0")}
          {"  ·  "}
          {q.label}
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center">
        <div key={q.key} className="w-full max-w-xl animate-in fade-in slide-in-from-bottom-2 duration-500">
          <h2 className="text-balance font-serif text-3xl font-light leading-tight text-foreground md:text-4xl">
            {q.prompt}
          </h2>
          {q.helper && (
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              {q.helper}
            </p>
          )}

          <div className="mt-9">
            {q.type === "options" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {q.options?.map((opt) => {
                  const selected = value === opt
                  return (
                    <button
                      key={opt}
                      onClick={() => setField(q.key, selected ? "" : opt)}
                      className={`flex items-center justify-between rounded-lg border px-5 py-4 text-left text-[15px] transition-all ${
                        selected
                          ? "border-accent bg-accent/5 text-foreground"
                          : "border-border bg-card text-foreground hover:border-foreground/30"
                      }`}
                    >
                      {opt}
                      {selected && <Check className="h-4 w-4 text-accent" />}
                    </button>
                  )
                })}
              </div>
            ) : (
              <textarea
                value={value}
                onChange={(e) => setField(q.key, e.target.value)}
                placeholder={q.placeholder}
                rows={4}
                className="w-full resize-none rounded-lg border border-border bg-card px-5 py-4 text-[15px] leading-relaxed text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-accent"
              />
            )}
          </div>

          <div className="mt-10 flex items-center justify-between">
            <button
              onClick={back}
              disabled={step === 0}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-0"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <div className="flex items-center gap-5">
              <button
                onClick={next}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Skip
              </button>
              <button
                onClick={next}
                className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                {isLast ? "Enter Méridian" : "Continue"}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
