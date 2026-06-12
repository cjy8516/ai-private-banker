import type { PortfolioLine, ScenarioAnalysis } from "@/lib/etf-banker"

export type PortfolioChartPoint = {
  date: string
  base: number
  adjusted: number
  benchmark: number
}

export type ScenarioChartPoint = {
  date: string
  baseline: number
  best: number
  worst: number
}

export type BreakdownPoint = {
  name: string
  weight: number
  fill: string
}

export const portfolioColors = [
  "#3a3128",
  "#8f6a3a",
  "#66705d",
  "#b9a37f",
  "#7f8588",
  "#c8c0b4",
  "#a56b55",
  "#5f6f88",
]

export function normalizePortfolio(lines: PortfolioLine[]) {
  const total = lines.reduce((sum, line) => sum + line.weight, 0)
  if (total <= 0) return lines

  return lines.map((line) => ({
    ...line,
    weight: round((line.weight / total) * 100, 1),
  }))
}

export function updatePortfolioWeight(
  lines: PortfolioLine[],
  ticker: string,
  nextWeight: number,
) {
  const clampedWeight = Math.max(0, Math.min(100, nextWeight))
  const otherLines = lines.filter((line) => line.ticker !== ticker)
  const otherTotal = otherLines.reduce((sum, line) => sum + line.weight, 0)
  const remainingWeight = Math.max(0, 100 - clampedWeight)

  if (otherTotal <= 0) {
    return lines.map((line) => ({
      ...line,
      weight: line.ticker === ticker ? clampedWeight : 0,
    }))
  }

  return lines.map((line) => {
    if (line.ticker === ticker) {
      return { ...line, weight: round(clampedWeight, 1) }
    }

    return {
      ...line,
      weight: round((line.weight / otherTotal) * remainingWeight, 1),
    }
  })
}

export function buildPortfolioBacktest(
  basePortfolio: PortfolioLine[],
  adjustedPortfolio: PortfolioLine[],
) {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ]
  let base = 100
  let adjusted = 100
  let benchmark = 100

  return months.map((date, index) => {
    if (index > 0) {
      base *= 1 + monthlyReturn(basePortfolio, index)
      adjusted *= 1 + monthlyReturn(adjustedPortfolio, index)
      benchmark *= 1 + benchmarkReturn(index)
    }

    return {
      date,
      base: round(base, 1),
      adjusted: round(adjusted, 1),
      benchmark: round(benchmark, 1),
    }
  }) satisfies PortfolioChartPoint[]
}

export function buildScenarioBacktest(
  portfolio: PortfolioLine[],
  scenario: ScenarioAnalysis | null,
) {
  const dates = ["Now", "+1m", "+2m", "+3m", "+4m", "+5m", "+6m"]
  let baseline = 100
  let best = 100
  let worst = 100
  const shock = scenarioShock(portfolio, scenario)
  const hedge = hedgeScore(portfolio)

  return dates.map((date, index) => {
    if (index > 0) {
      const normalReturn = monthlyReturn(portfolio, index)
      baseline *= 1 + normalReturn

      const shockDecay = index === 1 ? shock : shock * Math.max(0.1, 1 - index * 0.18)
      const bestTailwind = Math.abs(shock) * 0.25 + hedge * 0.0009
      const worstShock = shockDecay * 1.35 - Math.max(0, 60 - hedge) * 0.00008

      best *= 1 + normalReturn + bestTailwind
      worst *= 1 + normalReturn + worstShock
    }

    return {
      date,
      baseline: round(baseline, 1),
      best: round(best, 1),
      worst: round(worst, 1),
    }
  }) satisfies ScenarioChartPoint[]
}

export function buildPortfolioBreakdown(
  lines: PortfolioLine[],
  dimension: "assetClass" | "region" | "style",
) {
  const buckets = new Map<string, number>()

  for (const line of lines) {
    const traits = tickerTraits[line.ticker] ?? tickerTraits.DEFAULT
    const name = traits[dimension]
    buckets.set(name, (buckets.get(name) ?? 0) + line.weight)
  }

  return [...buckets.entries()]
    .map(([name, weight], index) => ({
      name,
      weight: round(weight, 1),
      fill: portfolioColors[index % portfolioColors.length],
    }))
    .sort((a, b) => b.weight - a.weight) satisfies BreakdownPoint[]
}

export function portfolioSummaryStats(lines: PortfolioLine[]) {
  const equityTickers = new Set(["VOO", "VTI", "QQQ", "SCHG", "SCHD", "VXUS", "IEFA", "IEMG", "XLK", "ARKK"])
  const defensiveTickers = new Set(["BND", "SGOV", "TIP", "GLD"])
  const equity = lines
    .filter((line) => equityTickers.has(line.ticker))
    .reduce((sum, line) => sum + line.weight, 0)
  const defensive = lines
    .filter((line) => defensiveTickers.has(line.ticker))
    .reduce((sum, line) => sum + line.weight, 0)
  const fee = lines.reduce((sum, line) => sum + (line.weight * line.expenseRatio) / 100, 0)

  return {
    equity: round(equity, 1),
    defensive: round(defensive, 1),
    funds: lines.length,
    fee: round(fee, 2),
  }
}

function monthlyReturn(lines: PortfolioLine[], monthIndex: number) {
  const signature = lines.reduce((sum, line) => sum + tickerScore(line.ticker) * line.weight, 0)
  const equityTilt = lines
    .filter((line) => ["VOO", "VTI", "QQQ", "SCHG", "SCHD", "VXUS", "IEFA", "IEMG", "XLK", "ARKK"].includes(line.ticker))
    .reduce((sum, line) => sum + line.weight, 0)
  const defensiveTilt = Math.max(0, 100 - equityTilt)
  const trend = 0.004 + equityTilt * 0.00008 + defensiveTilt * 0.00002
  const cycle = Math.sin(monthIndex * 1.25 + signature / 400) * 0.012
  const drawdown = monthIndex === 5 && equityTilt > 70 ? -0.025 : 0

  return trend + cycle + drawdown
}

function benchmarkReturn(monthIndex: number) {
  const trend = 0.006
  const cycle = Math.sin(monthIndex * 0.92 + 0.4) * 0.007
  const mildDrawdown = monthIndex === 5 ? -0.012 : 0

  return trend + cycle + mildDrawdown
}

function scenarioShock(lines: PortfolioLine[], scenario: ScenarioAnalysis | null) {
  const text = `${scenario?.title ?? ""} ${scenario?.summary ?? ""}`.toLowerCase()
  const growthExposure = lines
    .filter((line) => ["QQQ", "SCHG", "XLK", "ARKK", "VOO", "VTI"].includes(line.ticker))
    .reduce((sum, line) => sum + line.weight, 0)
  const defensiveExposure = lines
    .filter((line) => ["BND", "SGOV", "TIP", "GLD"].includes(line.ticker))
    .reduce((sum, line) => sum + line.weight, 0)

  if (text.includes("ai") || text.includes("bubble") || text.includes("tech")) {
    return -0.002 - growthExposure * 0.00045 + defensiveExposure * 0.00012
  }

  if (text.includes("recession")) {
    return -0.004 - growthExposure * 0.00028 + defensiveExposure * 0.00022
  }

  if (text.includes("inflation")) {
    return -0.006 + lines.filter((line) => ["TIP", "GLD", "SGOV"].includes(line.ticker)).reduce((sum, line) => sum + line.weight, 0) * 0.00032
  }

  if (text.includes("tariff")) {
    return -0.006 - growthExposure * 0.00022
  }

  return -0.01
}

function hedgeScore(lines: PortfolioLine[]) {
  return lines
    .filter((line) => ["BND", "SGOV", "TIP", "GLD", "VXUS", "IEFA"].includes(line.ticker))
    .reduce((sum, line) => sum + line.weight, 0)
}

const tickerTraits: Record<string, { assetClass: string; region: string; style: string }> = {
  VOO: { assetClass: "Equity", region: "United States", style: "Core equity" },
  VTI: { assetClass: "Equity", region: "United States", style: "Core equity" },
  QQQ: { assetClass: "Equity", region: "United States", style: "Growth / technology" },
  SCHG: { assetClass: "Equity", region: "United States", style: "Growth" },
  SCHD: { assetClass: "Equity", region: "United States", style: "Dividend quality" },
  VXUS: { assetClass: "Equity", region: "Global ex-US", style: "International equity" },
  IEFA: { assetClass: "Equity", region: "Developed ex-US", style: "International equity" },
  IEMG: { assetClass: "Equity", region: "Emerging markets", style: "Emerging equity" },
  BND: { assetClass: "Bond", region: "Defensive", style: "Core bonds" },
  SGOV: { assetClass: "Cash", region: "Defensive", style: "Treasury bills" },
  TIP: { assetClass: "Bond", region: "Defensive", style: "Inflation hedge" },
  GLD: { assetClass: "Real asset", region: "Global", style: "Gold hedge" },
  XLK: { assetClass: "Equity", region: "United States", style: "Technology sector" },
  ARKK: { assetClass: "Equity", region: "United States", style: "Thematic growth" },
  DEFAULT: { assetClass: "Equity", region: "Global", style: "Broad exposure" },
}

function tickerScore(ticker: string) {
  return ticker.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0)
}

function round(value: number, decimals: number) {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}
