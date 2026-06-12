import OpenAI from "openai";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { applyLiveProfiles, buildMarketIntel } from "@/lib/alpha-vantage";
import {
  buildRecommendation,
  EXPLANATION_PROMPT,
  mergeExplanation,
  parseExplanation,
  requestSchema
} from "@/lib/etf-banker";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const payload = requestSchema.parse(json);

    let result = buildRecommendation(payload);
    const marketIntel = await buildMarketIntel(result);
    result = applyLiveProfiles(result, marketIntel);
    let source: "rules" | "rules+openai" = "rules";

    if (process.env.OPENAI_API_KEY) {
      try {
        const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const response = await client.responses.create({
          model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
          input: [
            {
              role: "system",
              content: [{ type: "input_text", text: EXPLANATION_PROMPT }]
            },
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: JSON.stringify(
                    {
                      clientProfile: payload.profile,
                      mode: payload.mode,
                      currentHoldings: result.currentHoldings,
                      proposedPortfolio: result.portfolio,
                      diagnostics: result.diagnostics,
                      observations: result.observations
                    },
                    null,
                    2
                  )
                }
              ]
            }
          ]
        });

        result = mergeExplanation(result, parseExplanation(response.output_text));
        source = "rules+openai";
      } catch {
        source = "rules";
      }
    }

    return NextResponse.json({ source, marketIntel, ...result });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Please complete the client profile before generating a recommendation." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Something went wrong while building the portfolio recommendation." },
      { status: 500 }
    );
  }
}
