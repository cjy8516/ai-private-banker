"use client"

import { useState } from "react"
import { ArrowRight, Pencil, Check } from "lucide-react"
import { questions, useApp } from "@/lib/store"
import { PageShell, PageHeader } from "@/components/pages/page-shell"

export function ClientPage({
  onDiagnose,
  onRecommend,
}: {
  onDiagnose: () => void
  onRecommend: () => void
}) {
  const { profile, setField, generateRecommendation, isPending, error } = useApp()
  const answered = questions.filter((q) => profile[q.key].trim() !== "").length
  const [editing, setEditing] = useState<string | null>(null)

  return (
    <PageShell>
      <PageHeader
        eyebrow="Client"
        title="Your profile"
        intro="The context that shapes every recommendation. Refine any answer at any time — nothing here is fixed."
      />

      <div className="mb-8 flex items-center justify-between border-b border-border pb-5">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{answered}</span> of{" "}
          {questions.length} answered
        </p>
        <div className="flex items-center gap-5">
          <button
            onClick={onDiagnose}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            I already have a portfolio
          </button>
          <button
            onClick={async () => {
              const ok = await generateRecommendation()
              if (ok) onRecommend()
            }}
            disabled={isPending}
            className="group inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-accent disabled:opacity-50"
          >
            {isPending ? "Preparing recommendation" : "Generate recommendation"}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>

      <dl className="divide-y divide-border">
        {questions.map((q) => {
          const value = profile[q.key]
          const isEditing = editing === q.key
          return (
            <div key={q.key} className="group py-5">
              <div className="flex items-start justify-between gap-6">
                <dt className="w-40 shrink-0 pt-0.5 text-sm text-muted-foreground">
                  {q.label}
                </dt>
                <dd className="flex-1">
                  {isEditing ? (
                    q.type === "options" ? (
                      <div className="flex flex-wrap gap-2">
                        {q.options?.map((opt) => {
                          const selected = value === opt
                          return (
                            <button
                              key={opt}
                              onClick={() => {
                                setField(q.key, selected ? "" : opt)
                              }}
                              className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                                selected
                                  ? "border-accent bg-accent/5 text-foreground"
                                  : "border-border text-foreground hover:border-foreground/30"
                              }`}
                            >
                              {opt}
                            </button>
                          )
                        })}
                      </div>
                    ) : (
                      <textarea
                        autoFocus
                        value={value}
                        onChange={(e) => setField(q.key, e.target.value)}
                        placeholder={q.placeholder}
                        rows={3}
                        className="w-full resize-none rounded-lg border border-border bg-card px-4 py-3 text-sm leading-relaxed text-foreground outline-none focus:border-accent"
                      />
                    )
                  ) : (
                    <p
                      className={`text-[15px] ${
                        value ? "text-foreground" : "italic text-muted-foreground"
                      }`}
                    >
                      {value || "Not provided"}
                    </p>
                  )}
                </dd>
                <button
                  onClick={() => setEditing(isEditing ? null : q.key)}
                  className="shrink-0 pt-0.5 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={isEditing ? "Save" : "Edit"}
                >
                  {isEditing ? (
                    <Check className="h-4 w-4 text-accent" />
                  ) : (
                    <Pencil className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </dl>

      {error ? (
        <p className="mt-6 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </PageShell>
  )
}
