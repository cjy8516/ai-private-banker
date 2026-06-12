"use client"

import { useRef, useState } from "react"
import {
  ArrowRight,
  FileText,
  ImageIcon,
  Type,
  Upload,
  Sparkles,
} from "lucide-react"
import { useApp } from "@/lib/store"
import { PageShell, PageHeader } from "@/components/pages/page-shell"

type Method = "text" | "file" | "image"

const sample = `VOO   38%
QQQ   22%
VTI   15%
ARKK   9%
AAPL   8%
SCHD   5%
Cash   3%`

const findings = [
  {
    label: "Overlap",
    severity: "High",
    body: "VOO, VTI and QQQ share the same mega-cap US core. An estimated 64% of holdings are duplicated across funds.",
  },
  {
    label: "Concentration",
    severity: "High",
    body: "The top 7 names — led by Apple and the QQQ tech weighting — represent roughly 41% of the portfolio.",
  },
  {
    label: "Fee drag",
    severity: "Moderate",
    body: "ARKK and a handful of active sleeves lift the blended expense ratio to ~0.38%, well above a clean index baseline.",
  },
  {
    label: "Redundancy",
    severity: "Moderate",
    body: "SCHD and VTI both deliver broad US exposure with overlapping dividend tilt — one role, two products.",
  },
  {
    label: "Diversification",
    severity: "Low",
    body: "Almost no ex-US, fixed income, or real-asset exposure. The portfolio is effectively a single US-equity bet.",
  },
]

const sevColor: Record<string, string> = {
  High: "text-destructive",
  Moderate: "text-accent",
  Low: "text-muted-foreground",
}

export function DiagnosisPage({ onContinue }: { onContinue: () => void }) {
  const { portfolioText, setPortfolioText, hasDiagnosis, setHasDiagnosis } = useApp()
  const [method, setMethod] = useState<Method>("text")
  const [fileName, setFileName] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function run() {
    if (method === "text" && !portfolioText.trim()) {
      setPortfolioText(sample)
    }
    setHasDiagnosis(true)
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Diagnosis"
        title="What is your portfolio holding today?"
        intro="Paste your holdings, upload a statement, or drop in a screenshot. Méridian parses tickers and weights from text, files, or images."
      />

      <div className="mb-6 flex gap-2">
        {([
          { k: "text", label: "Paste text", icon: Type },
          { k: "file", label: "Upload file", icon: FileText },
          { k: "image", label: "Upload image", icon: ImageIcon },
        ] as const).map((m) => {
          const Icon = m.icon
          const active = method === m.k
          return (
            <button
              key={m.k}
              onClick={() => setMethod(m.k)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors ${
                active
                  ? "border-foreground/30 bg-secondary text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {m.label}
            </button>
          )
        })}
      </div>

      {method === "text" && (
        <div>
          <textarea
            value={portfolioText}
            onChange={(e) => setPortfolioText(e.target.value)}
            placeholder={`Paste holdings, one per line…\n\n${sample}`}
            rows={8}
            className="w-full resize-none rounded-xl border border-border bg-card px-5 py-4 font-mono text-sm leading-relaxed text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-accent"
          />
        </div>
      )}

      {(method === "file" || method === "image") && (
        <div>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept={method === "image" ? "image/*" : ".pdf,.csv,.xlsx,.txt"}
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center transition-colors hover:border-accent"
          >
            <Upload className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm text-foreground">
              {fileName
                ? fileName
                : method === "image"
                  ? "Drop a screenshot or click to upload"
                  : "Drop a statement (PDF, CSV) or click to upload"}
            </span>
            <span className="text-xs text-muted-foreground">
              Méridian will read the holdings and weights automatically.
            </span>
          </button>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          onClick={run}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Sparkles className="h-4 w-4" />
          Diagnose portfolio
        </button>
      </div>

      {hasDiagnosis && (
        <section className="mt-14 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <h2 className="font-serif text-2xl font-light text-foreground">
            What we found
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            A single US-equity bet wearing the costume of a diversified
            portfolio. The issues below compound one another.
          </p>

          <div className="mt-8 divide-y divide-border border-y border-border">
            {findings.map((f) => (
              <div key={f.label} className="flex gap-6 py-5">
                <div className="w-36 shrink-0">
                  <p className="font-serif text-base text-foreground">{f.label}</p>
                  <p className={`mt-1 text-xs uppercase tracking-wider ${sevColor[f.severity]}`}>
                    {f.severity}
                  </p>
                </div>
                <p className="text-[15px] leading-relaxed text-muted-foreground">
                  {f.body}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={onContinue}
              className="group inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-accent"
            >
              See the recommendation
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </section>
      )}
    </PageShell>
  )
}
