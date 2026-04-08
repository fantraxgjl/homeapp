import { NextRequest, NextResponse } from "next/server";
import { extractRecipeFromUrl, extractRecipeFromPdf } from "@/lib/recipe-extract";

// POST /api/recipes/extract
// Body: { url: string } OR { pdfBase64: string, mimeType?: string }
export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Recipe extraction not configured (missing ANTHROPIC_API_KEY)" },
      { status: 503 }
    );
  }

  let body: { url?: string; pdfBase64?: string; mimeType?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    if (body.url) {
      const recipe = await extractRecipeFromUrl(body.url);
      return NextResponse.json(recipe);
    }

    if (body.pdfBase64) {
      const mimeType = (body.mimeType as "application/pdf" | "image/jpeg" | "image/png") ?? "application/pdf";
      const recipe = await extractRecipeFromPdf(body.pdfBase64, mimeType);
      return NextResponse.json(recipe);
    }

    return NextResponse.json(
      { error: "Provide either url or pdfBase64" },
      { status: 400 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[recipe-extract]", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
