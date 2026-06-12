import type { PortfolioLine, RecommendationResult } from "@/lib/etf-banker";

const ALPHA_VANTAGE_BASE_URL = "https://www.alphavantage.co/query";
const PROFILE_REVALIDATE_SECONDS = 60 * 60 * 12;
const SERIES_REVALIDATE_SECONDS = 60 * 60 * 6;
const FREE_PROFILE_LIMIT = 3;
const PREMIUM_PROFILE_LIMIT = 6;

type AlphaVantageResponse = Record<string, unknown>;
type NamedWeight = {
  name: string;
  weight: number;
};

type PricePoint = {
  date: string;
  close: number;
};

type PathPoint = {
  date: string;
  value: number;
};

export type FundInsight = {
  ticker: string;
  name: string;
  description: string | null;
  expenseRatio: number | null;
  netAssets: string | null;
  assetAllocation: NamedWeight[];
  sectors: NamedWeight[];
  topHoldings: NamedWeight[];
};

export type BacktestPoint = {
  date: string;
  current?: number;
  proposed: number;
};

export type BacktestSummary = {
  timeframe: "1Y";
  currentReturn: number | null;
  proposedReturn: number;
  coveredTickers: string[];
  points: BacktestPoint[];
};

export type MarketIntel = {
  status: "live" | "unavailable";
  note: string;
  currentFunds: FundInsight[];
  proposedFunds: FundInsight[];
  overlapHighlights: string[];
  backtest: BacktestSummary | null;
};

export async function buildMarketIntel(
  result: RecommendationResult
): Promise<MarketIntel> {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  const isPremiumPlan = process.env.ALPHA_VANTAGE_TIER === "premium";

  if (!apiKey) {
    return {
      status: "unavailable",
      note: "Add ALPHA_VANTAGE_API_KEY to load live ETF profile data and the 1Y portfolio path.",
      currentFunds: [],
      proposedFunds: [],
      overlapHighlights: [],
      backtest: null
    };
  }

  const currentTickers = prioritizeCurrentTickers(result.currentHoldings);
  const proposedTickers = prioritizeProposedTickers(
    result.portfolio,
    currentTickers,
    isPremiumPlan ? PREMIUM_PROFILE_LIMIT : FREE_PROFILE_LIMIT
  );
  const profileTickers = [
    ...new Set([...currentTickers, ...proposedTickers].slice(0, isPremiumPlan ? PREMIUM_PROFILE_LIMIT : FREE_PROFILE_LIMIT))
  ];

  const profileEntries = await Promise.all(
    profileTickers.map(async (ticker) => [ticker, await fetchEtfProfile(ticker, apiKey)] as const)
  );

  const profileMap = new Map(
    profileEntries.filter((entry): entry is readonly [string, FundInsight] => entry[1] !== null)
  );

  const currentFunds = currentTickers
    .map((ticker) => profileMap.get(ticker))
    .filter((fund): fund is FundInsight => Boolean(fund));
  const proposedFunds = proposedTickers
    .map((ticker) => profileMap.get(ticker))
    .filter((fund): fund is FundInsight => Boolean(fund));

  const backtest = isPremiumPlan
    ? await buildBacktest(result.currentHoldings, result.portfolio, apiKey)
    : null;
  const overlapHighlights = buildOverlapHighlights(
    currentFunds.length > 0 ? currentFunds : proposedFunds
  );

  return {
    status: currentFunds.length > 0 || proposedFunds.length > 0 || backtest ? "live" : "unavailable",
    note:
      currentFunds.length > 0 || proposedFunds.length > 0 || backtest
        ? isPremiumPlan
          ? "Live ETF fund data and the 1Y weekly portfolio path are powered by Alpha Vantage."
          : "Live ETF fund data is powered by Alpha Vantage free tier. The app keeps requests light and prioritizes diagnosis over auto-backtesting."
        : "Alpha Vantage did not return ETF profile data for the current tickers.",
    currentFunds,
    proposedFunds,
    overlapHighlights,
    backtest
  };
}

export function applyLiveProfiles(
  result: RecommendationResult,
  intel: MarketIntel | null
): RecommendationResult {
  if (!intel) return result;

  const profileMap = new Map(
    [...intel.currentFunds, ...intel.proposedFunds].map((fund) => [fund.ticker, fund] as const)
  );

  return {
    ...result,
    portfolio: result.portfolio.map((line) => applyProfileToLine(line, profileMap.get(line.ticker))),
    currentHoldings: result.currentHoldings.map((line) =>
      applyProfileToLine(line, profileMap.get(line.ticker))
    )
  };
}

async function fetchEtfProfile(ticker: string, apiKey: string) {
  const data = await fetchAlphaVantage(
    {
      function: "ETF_PROFILE",
      symbol: ticker,
      apikey: apiKey
    },
    PROFILE_REVALIDATE_SECONDS
  );

  if (!data) return null;

  return parseEtfProfile(ticker, data);
}

async function buildBacktest(
  current: PortfolioLine[],
  proposed: PortfolioLine[],
  apiKey: string
): Promise<BacktestSummary | null> {
  const currentCore = topWeightedLines(current, 4);
  const proposedCore = topWeightedLines(proposed, 4);
  const tickers = [...new Set([...currentCore, ...proposedCore].map((line) => line.ticker))];

  if (tickers.length === 0) return null;

  const seriesEntries = await Promise.all(
    tickers.map(async (ticker) => [ticker, await fetchWeeklySeries(ticker, apiKey)] as const)
  );

  const priceMap = new Map(
    seriesEntries.filter((entry): entry is readonly [string, PricePoint[]] => entry[1] !== null)
  );

  const proposedPath = buildPortfolioPath(proposedCore, priceMap);
  if (!proposedPath) return null;

  const currentPath = currentCore.length > 0 ? buildPortfolioPath(currentCore, priceMap) : null;
  const dates = currentPath
    ? intersectDates(currentPath.map((point) => point.date), proposedPath.map((point) => point.date))
    : proposedPath.map((point) => point.date);

  if (dates.length < 8) return null;

  const trimmedDates = dates.slice(-52);
  const currentMap = currentPath ? new Map(currentPath.map((point) => [point.date, point.value])) : null;
  const proposedMap = new Map(proposedPath.map((point) => [point.date, point.value]));

  const points = trimmedDates
    .map((date) => {
      const proposedValue = proposedMap.get(date);
      if (proposedValue === undefined) return null;

      return {
        date,
        current: currentMap?.get(date),
        proposed: proposedValue
      };
    })
    .filter(
      (
        point
      ): point is { date: string; current: number | undefined; proposed: number } => point !== null
    );

  if (points.length < 8) return null;

  const currentValues = points.map((point) => point.current).filter((value): value is number => value !== undefined);
  const proposedValues = points.map((point) => point.proposed);

  return {
    timeframe: "1Y",
    currentReturn: currentValues.length > 1 ? toReturnPercentage(currentValues) : null,
    proposedReturn: toReturnPercentage(proposedValues),
    coveredTickers: [...priceMap.keys()],
    points: points.map((point) => ({
      date: point.date,
      current: point.current !== undefined ? roundNumber(point.current, 1) : undefined,
      proposed: roundNumber(point.proposed, 1)
    }))
  };
}

async function fetchWeeklySeries(ticker: string, apiKey: string) {
  const data = await fetchAlphaVantage(
    {
      function: "TIME_SERIES_WEEKLY",
      symbol: ticker,
      apikey: apiKey
    },
    SERIES_REVALIDATE_SECONDS
  );

  if (!data) return null;

  const seriesObject =
    getRecord(data["Weekly Time Series"]) ??
    getRecord(data["Weekly Adjusted Time Series"]);

  if (!seriesObject) return null;

  return Object.entries(seriesObject)
    .map(([date, rawPoint]) => {
      const point = getRecord(rawPoint);
      const close =
        parseNumberish(point?.["4. close"]) ??
        parseNumberish(point?.["5. adjusted close"]) ??
        parseNumberish(point?.close);

      if (!close) return null;

      return { date, close };
    })
    .filter((point): point is PricePoint => point !== null)
    .sort((left, right) => left.date.localeCompare(right.date));
}

async function fetchAlphaVantage(
  params: Record<string, string>,
  revalidate: number
): Promise<AlphaVantageResponse | null> {
  const url = new URL(ALPHA_VANTAGE_BASE_URL);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  try {
    const response = await fetch(url, {
      next: { revalidate }
    });

    if (!response.ok) return null;

    const json = (await response.json()) as AlphaVantageResponse;
    if (!json || typeof json !== "object") return null;

    if ("Information" in json || "Note" in json || "Error Message" in json) {
      return null;
    }

    return json;
  } catch {
    return null;
  }
}

function parseEtfProfile(ticker: string, data: AlphaVantageResponse): FundInsight {
  return {
    ticker,
    name:
      pickString(data, ["fundname", "etfname", "name", "title", "symbol"]) ??
      `${ticker} ETF`,
    description: pickString(data, ["description", "overview", "summary", "objective", "investmentobjective"]),
    expenseRatio: parseExpenseRatio(
      pickValue(data, ["netexpenseratio", "expenseratio", "expense", "managementfee"])
    ),
    netAssets: formatAssets(pickValue(data, ["netassets", "aum", "totalnetassets", "assetundermanagement"])),
    assetAllocation: extractNamedWeights(
      data,
      ["assetallocation", "assetmix", "allocation"],
      ["assetclass", "name", "label", "class"],
      ["weight", "percentage", "allocation"]
    ).slice(0, 4),
    sectors: extractNamedWeights(
      data,
      ["sector", "industry"],
      ["sector", "name", "label"],
      ["weight", "percentage", "allocation"]
    ).slice(0, 5),
    topHoldings: extractNamedWeights(
      data,
      ["holding", "constituent", "topholding"],
      ["holding", "name", "company", "symbol", "ticker", "asset"],
      ["weight", "percentage", "allocation"]
    ).slice(0, 5)
  };
}

function extractNamedWeights(
  data: AlphaVantageResponse,
  collectionHints: string[],
  nameHints: string[],
  weightHints: string[]
) {
  const candidates = findCollectionCandidates(data, collectionHints);

  for (const candidate of candidates) {
    const parsed = toNamedWeights(candidate, nameHints, weightHints);
    if (parsed.length > 0) {
      return parsed.sort((left, right) => right.weight - left.weight);
    }
  }

  return [] as NamedWeight[];
}

function findCollectionCandidates(
  data: AlphaVantageResponse,
  collectionHints: string[]
) {
  const topLevel = Object.entries(data)
    .filter(([key]) => matchesAny(key, collectionHints))
    .map(([, value]) => value);

  const nested = Object.values(data)
    .flatMap((value) => {
      const record = getRecord(value);
      if (!record) return [];

      return Object.entries(record)
        .filter(([key]) => matchesAny(key, collectionHints))
        .map(([, nestedValue]) => nestedValue);
    });

  return [...topLevel, ...nested];
}

function toNamedWeights(
  candidate: unknown,
  nameHints: string[],
  weightHints: string[]
) {
  if (Array.isArray(candidate)) {
    return candidate
      .map((item) => {
        const record = getRecord(item);
        if (!record) return null;

        const name = pickString(record, nameHints);
        const weight = pickNumber(record, weightHints);

        if (!name || weight === null) return null;
        return { name, weight };
      })
      .filter((item): item is NamedWeight => item !== null);
  }

  const record = getRecord(candidate);
  if (!record) return [];

  return Object.entries(record)
    .map(([key, value]) => {
      const weight = parseNumberish(value);
      if (weight === null) return null;

      return {
        name: humanizeKey(key),
        weight
      };
    })
    .filter((item): item is NamedWeight => item !== null);
}

function buildOverlapHighlights(funds: FundInsight[]) {
  const overlapMap = new Map<
    string,
    { name: string; tickers: Set<string>; averageWeight: number; count: number }
  >();

  for (const fund of funds) {
    for (const holding of fund.topHoldings) {
      const key = normalizeToken(holding.name);
      if (!key) continue;

      const current = overlapMap.get(key) ?? {
        name: holding.name,
        tickers: new Set<string>(),
        averageWeight: 0,
        count: 0
      };

      current.tickers.add(fund.ticker);
      current.averageWeight += holding.weight;
      current.count += 1;
      overlapMap.set(key, current);
    }
  }

  return [...overlapMap.values()]
    .filter((entry) => entry.tickers.size > 1)
    .sort((left, right) => {
      if (right.tickers.size !== left.tickers.size) {
        return right.tickers.size - left.tickers.size;
      }

      return right.averageWeight / right.count - left.averageWeight / left.count;
    })
    .slice(0, 3)
    .map((entry) => {
      const fundsList = [...entry.tickers].join(", ");
      return `${entry.name} appears across ${fundsList}, so multiple ETF labels may still point back to the same underlying company risk.`;
    });
}

function buildPortfolioPath(
  lines: PortfolioLine[],
  priceMap: Map<string, PricePoint[]>
) {
  const covered = lines.filter((line) => (priceMap.get(line.ticker)?.length ?? 0) >= 20);
  if (covered.length === 0) return null;

  const normalizedWeight = covered.reduce((sum, line) => sum + line.weight, 0);
  if (normalizedWeight <= 0) return null;

  const dates = intersectDates(
    ...covered.map((line) => (priceMap.get(line.ticker) ?? []).map((point) => point.date))
  );

  const trimmedDates = dates.slice(-52);
  if (trimmedDates.length < 8) return null;

  return trimmedDates.map((date, index) => {
    let value = 0;

    for (const line of covered) {
      const series = priceMap.get(line.ticker) ?? [];
      const startClose = series.find((point) => point.date === trimmedDates[0])?.close;
      const currentClose = series.find((point) => point.date === date)?.close;

      if (!startClose || !currentClose) continue;

      value += (line.weight / normalizedWeight) * ((currentClose / startClose) * 100);
    }

    return {
      date: trimmedDates[index],
      value
    };
  });
}

function intersectDates(...dateSets: string[][]) {
  if (dateSets.length === 0) return [];

  return dateSets.reduce<string[]>((shared, nextSet) => {
    const available = new Set(nextSet);
    return shared.filter((date) => available.has(date));
  }, [...dateSets[0]]);
}

function applyProfileToLine(line: PortfolioLine, profile: FundInsight | undefined): PortfolioLine {
  if (!profile) return line;

  return {
    ...line,
    name: profile.name || line.name,
    expenseRatio: profile.expenseRatio ?? line.expenseRatio
  };
}

function topWeightedTickers(lines: PortfolioLine[], limit: number) {
  return topWeightedLines(lines, limit).map((line) => line.ticker);
}

function topWeightedLines(lines: PortfolioLine[], limit: number) {
  return [...lines]
    .sort((left, right) => right.weight - left.weight)
    .slice(0, limit);
}

function prioritizeCurrentTickers(lines: PortfolioLine[]) {
  return topWeightedTickers(lines, 2);
}

function prioritizeProposedTickers(
  lines: PortfolioLine[],
  currentTickers: string[],
  totalLimit: number
) {
  const uniqueCurrent = new Set(currentTickers);
  const remainingSlots = Math.max(totalLimit - uniqueCurrent.size, 1);

  return topWeightedTickers(lines, 6)
    .filter((ticker) => !uniqueCurrent.has(ticker))
    .slice(0, remainingSlots);
}

function toReturnPercentage(values: number[]) {
  if (values.length < 2 || values[0] === 0) return 0;
  return roundNumber(((values[values.length - 1] / values[0]) - 1) * 100, 1);
}

function parseExpenseRatio(value: unknown) {
  const parsed = parseNumberish(value);
  if (parsed === null) return null;

  return parsed > 5 ? roundNumber(parsed / 100, 2) : roundNumber(parsed, 2);
}

function formatAssets(value: unknown) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const numeric = Number(trimmed.replace(/[^0-9.-]/g, ""));
    if (!Number.isNaN(numeric) && numeric > 1_000_000) {
      return formatLargeCurrency(numeric);
    }

    return trimmed;
  }

  const numeric = parseNumberish(value);
  if (numeric === null) return null;

  return numeric > 1_000_000 ? formatLargeCurrency(numeric) : `$${roundNumber(numeric, 0)}`;
}

function formatLargeCurrency(value: number) {
  if (value >= 1_000_000_000_000) {
    return `$${roundNumber(value / 1_000_000_000_000, 1)}tn`;
  }
  if (value >= 1_000_000_000) {
    return `$${roundNumber(value / 1_000_000_000, 1)}bn`;
  }
  if (value >= 1_000_000) {
    return `$${roundNumber(value / 1_000_000, 0)}m`;
  }
  return `$${roundNumber(value, 0)}`;
}

function pickValue(record: Record<string, unknown>, keys: string[]) {
  const entry = Object.entries(record).find(([key]) => matchesAny(key, keys));
  return entry?.[1];
}

function pickString(record: Record<string, unknown>, keys: string[]) {
  const value = pickValue(record, keys);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function pickNumber(record: Record<string, unknown>, keys: string[]) {
  const value = pickValue(record, keys);
  return parseNumberish(value);
}

function parseNumberish(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") return null;

  const normalized = value.replace(/[%,$\s]/g, "");
  if (!normalized) return null;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function getRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function matchesAny(value: string, keys: string[]) {
  const normalizedValue = normalizeToken(value);
  return keys.some((key) => normalizedValue.includes(normalizeToken(key)));
}

function humanizeKey(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function normalizeToken(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function roundNumber(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
