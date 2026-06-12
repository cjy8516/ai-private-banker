"use client"

import { useRef, useState } from "react"
import {
  ArrowRight,
  FileText,
  ImageIcon,
  Loader2,
  Sparkles,
  Type,
  Upload,
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

const severityClass: Record<string, string> = {
  High: "text-destructive",
  Moderate: "text-accent",
  Low: "text-muted-foreground",
}

export function DiagnosisPage({ onContinue }: { onContinue: () => void }) {
  const {
    portfolioText,
    setPortfolioText,
    uploadedFileName,
    setUploadedFileName,
    hasDiagnosis,
    result,
    runDiagnosis,
    isPending,
    error,
  } = useApp()
  const [method, setMethod] = useState<Method>("text")
  const [uploadMessage, setUploadMessage] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const resultRef = useRef<HTMLElement>(null)

  const currentDiagnostics = result?.currentDiagnostics

  const findings = currentDiagnostics
    ? [
        {
          label: "Overlap",
          severity: currentDiagnostics.duplicationSignals.length > 0 ? "High" : "Low",
          body:
            currentDiagnostics.duplicationSignals[0] ??
            currentDiagnostics.overlapComment,
        },
        {
          label: "Concentration",
          severity:
            currentDiagnostics.concentrationRisk === "Within a reasonable retail range"
              ? "Low"
              : "High",
          body: currentDiagnostics.concentrationRisk,
        },
        {
          label: "Fee drag",
          severity: currentDiagnostics.weightedExpense > 0.25 ? "Moderate" : "Low",
          body: currentDiagnostics.feeComment,
        },
        {
          label: "Mandate fit",
          severity: currentDiagnostics.suitabilityScore >= 75 ? "Low" : "Moderate",
          body: currentDiagnostics.clientFitComment,
        },
        {
          label: "Region mix",
          severity:
            currentDiagnostics.regionComment.includes("heavily") ? "Moderate" : "Low",
          body: currentDiagnostics.regionComment,
        },
      ]
    : []

  async function handleUpload(file: File) {
    setUploadedFileName(file.name)
    setUploadMessage(null)

    if (
      file.type.startsWith("text/") ||
      file.name.endsWith(".csv") ||
      file.name.endsWith(".txt")
    ) {
      const text = await file.text()
      setPortfolioText(text.trim())
      return
    }

    if (file.type.startsWith("image/")) {
      setUploadMessage(
        "Image upload is in the flow, but OCR parsing is not wired yet. For the demo, paste holdings or upload a text or CSV file.",
      )
      return
    }

    setUploadMessage(
      "For now, upload a text or CSV file if you want the portfolio parsed automatically.",
    )
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Diagnosis"
        title="What is your portfolio holding today?"
        intro="Paste your holdings, upload a statement, or drop in a screenshot. Méridian diagnoses overlap, concentration, fee drag, and false diversification."
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

      {method === "text" ? (
        <div>
          <textarea
            value={portfolioText}
            onChange={(e) => setPortfolioText(e.target.value)}
            placeholder={`Paste holdings, one per line…\n\n${sample}`}
            rows={8}
            className="w-full resize-none rounded-xl border border-border bg-card px-5 py-4 font-mono text-sm leading-relaxed text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-accent"
          />
        </div>
      ) : (
        <div>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept={method === "image" ? "image/*" : ".pdf,.csv,.xlsx,.txt"}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (!file) return
              void handleUpload(file)
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center transition-colors hover:border-accent"
          >
            <Upload className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm text-foreground">
              {uploadedFileName
                ? uploadedFileName
                : method === "image"
                  ? "Drop a screenshot or click to upload"
                  : "Drop a statement (PDF, CSV) or click to upload"}
            </span>
            <span className="text-xs text-muted-foreground">
              Méridian will read the holdings and weights automatically where text is available.
            </span>
          </button>
        </div>
      )}

      {uploadMessage ? (
        <p className="mt-4 text-sm text-muted-foreground">{uploadMessage}</p>
      ) : null}

      <div className="mt-6 flex justify-end">
        <button
          onClick={async () => {
            const ok = await runDiagnosis()
            if (!ok) return
            window.setTimeout(() => {
              resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
            }, 50)
          }}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Diagnosing
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Diagnose portfolio
            </>
          )}
        </button>
      </div>

      {error ? <p className="mt-5 text-sm text-destructive">{error}</p> : null}

      {hasDiagnosis && result && currentDiagnostics ? (
        <section
          ref={resultRef}
          className="mt-14 scroll-mt-8 animate-in fade-in slide-in-from-bottom-2 duration-500"
        >
          <div className="mb-8 grid gap-3 border-y border-border py-5 text-sm text-muted-foreground sm:grid-cols-3">
            <p>
              <span className="block text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Status
              </span>
              <span className="mt-1 block text-foreground">Analysis complete</span>
            </p>
            <p>
              <span className="block text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Parsed holdings
              </span>
              <span className="mt-1 block text-foreground">
                {result.currentHoldings.length} positions
              </span>
            </p>
            <p>
              <span className="block text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Suitability
              </span>
              <span className="mt-1 block text-foreground">
                {currentDiagnostics.suitabilityScore}/100
              </span>
            </p>
          </div>

          <h2 className="font-serif text-2xl font-light text-foreground">
            What we found
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            {result.clientSummary}
          </p>

          <div className="mt-8 divide-y divide-border border-y border-border">
            {findings.map((f) => (
              <div key={f.label} className="flex gap-6 py-5">
                <div className="w-36 shrink-0">
                  <p className="font-serif text-base text-foreground">{f.label}</p>
                  <p
                    className={`mt-1 text-xs uppercase tracking-wider ${severityClass[f.severity]}`}
                  >
                    {f.severity}
                  </p>
                </div>
                <p className="text-[15px] leading-relaxed text-muted-foreground">
                  {f.body}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Portfolio observations
            </p>
            <ul className="mt-4 space-y-3">
              {result.observations.map((item) => (
                <li key={item} className="text-[15px] leading-relaxed text-foreground">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {result.marketIntel?.currentFunds.length ? (
            <div className="mt-10">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Live ETF intelligence
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {result.marketIntel.note}
              </p>

              <div className="mt-4 divide-y divide-border border-y border-border">
                {result.marketIntel.currentFunds.map((fund) => (
                  <div key={fund.ticker} className="flex gap-6 py-4">
                    <div className="w-36 shrink-0">
                      <p className="font-serif text-base text-foreground">{fund.ticker}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {fund.expenseRatio !== null ? `${fund.expenseRatio}% fee` : "Fee n/a"}
                      </p>
                    </div>
                    <div className="space-y-2 text-[15px] leading-relaxed text-muted-foreground">
                      <p>{fund.name}</p>
                      <p>{compactList(fund.topHoldings, "Top holdings unavailable.")}</p>
                      <p>{compactList(fund.sectors, "Sector mix unavailable.")}</p>
                    </div>
                  </div>
                ))}
              </div>

              {result.marketIntel.overlapHighlights.length ? (
                <ul className="mt-4 space-y-3">
                  {result.marketIntel.overlapHighlights.map((item) => (
                    <li key={item} className="text-[15px] leading-relaxed text-foreground">
                      {item}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

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
      ) : null}
    </PageShell>
  )
}

function compactList(
  items: Array<{ name: string; weight: number }>,
  fallback: string,
) {
  if (!items.length) return fallback

  return items
    .slice(0, 3)
    .map((item) => `${item.name} ${item.weight}%`)
    .join(" · ")
}
