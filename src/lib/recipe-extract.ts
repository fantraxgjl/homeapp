import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface ExtractedIngredient {
  name: string;
  quantity: string | null;
  unit: string | null;
}

export interface ExtractedRecipe {
  title: string;
  cuisine: string | null;
  mealType: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK" | null;
  servings: number | null;
  cookTime: number | null;
  sourceUrl: string | null;
  allergens: string[];
  nutritionInfo: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  } | null;
  ingredients: ExtractedIngredient[];
  steps: string[];
}

const EXTRACTION_PROMPT = `Extract the recipe from the provided content and return a JSON object with this exact structure:
{
  "title": "Recipe name",
  "cuisine": "Italian" | null,
  "mealType": "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK" | null,
  "servings": 4,
  "cookTime": 30,
  "allergens": ["gluten", "dairy"],
  "nutritionInfo": { "calories": 350, "protein": 20, "carbs": 40, "fat": 12 } | null,
  "ingredients": [
    { "name": "flour", "quantity": "2", "unit": "cups" },
    { "name": "salt", "quantity": "1", "unit": "tsp" }
  ],
  "steps": [
    "Preheat oven to 180°C.",
    "Mix the flour and salt."
  ]
}

Rules:
- cookTime is total time in minutes (prep + cook)
- allergens are lowercase strings from: gluten, dairy, nuts, shellfish, eggs, soy, fish, vegan, vegetarian
- All fields are required except cuisine, mealType, nutritionInfo (use null if unknown)
- quantity and unit can be null if not specified
- Return ONLY valid JSON, no markdown, no explanation`;

/**
 * Fetch a URL and extract any JSON-LD Recipe schema, falling back to raw HTML for Claude.
 */
async function fetchPageContent(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { "User-Agent": "FamilyDashboard/1.0 RecipeImporter" },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch URL (${response.status}): ${url}`);
  }
  const html = await response.text();

  // Try to extract JSON-LD first (much cleaner input for Claude)
  const jsonLdMatches = html.match(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );
  if (jsonLdMatches) {
    for (const match of jsonLdMatches) {
      const content = match.replace(/<\/?script[^>]*>/gi, "");
      try {
        const parsed = JSON.parse(content);
        const entries = Array.isArray(parsed) ? parsed : [parsed];
        for (const entry of entries) {
          if (entry["@type"] === "Recipe") {
            return `JSON-LD Recipe schema:\n${JSON.stringify(entry, null, 2)}`;
          }
        }
      } catch {
        // continue
      }
    }
  }

  // Strip HTML tags and truncate for Claude
  const text = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s{3,}/g, "\n")
    .trim()
    .slice(0, 20000);

  return `Page content from ${url}:\n${text}`;
}

/**
 * Extract a structured recipe from a URL.
 */
export async function extractRecipeFromUrl(url: string): Promise<ExtractedRecipe> {
  const pageContent = await fetchPageContent(url);

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `${EXTRACTION_PROMPT}\n\n---\n\n${pageContent}`,
      },
    ],
  });

  const text = message.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");

  const parsed = JSON.parse(text) as ExtractedRecipe & { sourceUrl?: string };
  parsed.sourceUrl = url;
  return parsed;
}

/**
 * Extract a structured recipe from a base64-encoded PDF.
 */
export async function extractRecipeFromPdf(
  base64: string,
  mimeType: "application/pdf" | "image/jpeg" | "image/png" = "application/pdf"
): Promise<ExtractedRecipe> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const message = await (client.messages.create as any)({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: mimeType,
              data: base64,
            },
          },
          {
            type: "text",
            text: EXTRACTION_PROMPT,
          },
        ],
      },
    ],
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const text = (message as any).content
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((b: any) => b.type === "text")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((b: any) => b.text as string)
    .join("");

  const parsed = JSON.parse(text) as ExtractedRecipe;
  parsed.sourceUrl = null;
  return parsed;
}
