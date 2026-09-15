import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders });

const menuColumns =
  "id,category_id,name,description,price,image_url,ingredients,preparation_time,rating,review_count,available";

interface MenuItem {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number | string;
  image_url: string | null;
  ingredients: string[] | null;
  preparation_time: number | string | null;
  rating: number | string | null;
  review_count: number | string | null;
  available: boolean;
}

interface ScanAnswer {
  is_food: boolean;
  identified_food: string | null;
  confidence: number;
  message: string;
  menu_match: unknown;
  recommendations: unknown;
}

function serviceClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Server configuration is incomplete.");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function requireUser(request: Request) {
  const authorization = request.headers.get("Authorization");
  const url = Deno.env.get("SUPABASE_URL");
  const key =
    Deno.env.get("SUPABASE_ANON_KEY") ??
    Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  if (!authorization?.startsWith("Bearer ") || !url || !key) return false;
  const client = createClient(url, key, {
    global: { headers: { Authorization: authorization } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await client.auth.getUser(authorization.slice(7));
  return !error && Boolean(data.user);
}

function parseAnswer(text: string): ScanAnswer {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/\s*```$/i, "");
  const parsed = JSON.parse(cleaned) as Partial<ScanAnswer>;
  return {
    is_food: parsed.is_food === true,
    identified_food:
      typeof parsed.identified_food === "string"
        ? parsed.identified_food
        : null,
    confidence: Number.isFinite(Number(parsed.confidence))
      ? Math.max(0, Math.min(1, Number(parsed.confidence)))
      : 0,
    message:
      typeof parsed.message === "string"
        ? parsed.message
        : "We couldn't understand the scan result. Please try again.",
    menu_match: parsed.menu_match ?? null,
    recommendations: parsed.recommendations ?? [],
  };
}

function menuPayload(item: MenuItem) {
  return {
    menu_item_id: item.id,
    name: item.name,
    description: item.description,
    price: Number(item.price),
    image_url: item.image_url,
    ingredients: item.ingredients ?? [],
    preparation_time:
      item.preparation_time === null ? null : Number(item.preparation_time),
    rating: item.rating === null ? null : Number(item.rating),
  };
}

function validateMatch(value: unknown, menu: MenuItem[]) {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  const menuItem = menu.find((item) => item.id === candidate.menu_item_id);
  return menuItem ? menuPayload(menuItem) : null;
}

function validateRecommendations(value: unknown, menu: MenuItem[]) {
  if (!Array.isArray(value)) return [];
  const ids = new Set(menu.map((item) => item.id));
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const id = (entry as Record<string, unknown>).menu_item_id;
    if (typeof id !== "string" || !ids.has(id)) return [];
    const item = menu.find((candidate) => candidate.id === id);
    return item ? [menuPayload(item)] : [];
  });
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST")
    return json({ error: "Method not allowed." }, 405);

  try {
    if (!(await requireUser(request)))
      return json({ error: "Authentication is required." }, 401);
    const body = (await request.json()) as {
      image?: { base64?: unknown; mime_type?: unknown };
    };
    const base64 = body.image?.base64;
    const mimeType =
      typeof body.image?.mime_type === "string"
        ? body.image.mime_type
        : "image/jpeg";
    if (typeof base64 !== "string" || !base64)
      return json({ error: "An image is required." }, 400);
    if (!mimeType.startsWith("image/"))
      return json({ error: "Only image files are supported." }, 400);
    if (base64.length > 12_000_000)
      return json(
        { error: "Image is too large. Please choose a smaller image." },
        413,
      );

    const client = serviceClient();
    const { data: menu, error: menuError } = await client
      .from("menu_items")
      .select(menuColumns)
      .eq("available", true)
      .order("name", { ascending: true });
    if (menuError) throw menuError;
    const availableMenu = (menu ?? []) as MenuItem[];
    const menuContext = availableMenu
      .map((item) => JSON.stringify(menuPayload(item)))
      .join("\n");
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) throw new Error("Server configuration is incomplete.");
    const model = Deno.env.get("GEMINI_MODEL") ?? "gemini-2.0-flash";
    const prompt = `You are the food recognition system for Shamsiya Special Food. First determine whether the image contains food. Reject people, animals, objects, documents, screenshots, blank images, and ambiguous images where food cannot reasonably be identified. If it is not food, identified_food must be null, confidence must be 0, menu_match must be null, recommendations must be [], and message must be exactly: This image is not food. Please scan a food item. If it is food, identify it, compare it only with the available menu below, and never invent a menu item. A menu match must use the exact menu_item_id from the supplied menu. If no reasonable match exists, menu_match must be null and message must explain that this is food but no matching Shamsiya menu item was found. Return JSON only. AVAILABLE MENU ITEMS:\n${menuContext || "No menu items are available."}`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: prompt },
                { inline_data: { mime_type: mimeType, data: base64 } },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                is_food: { type: "BOOLEAN" },
                identified_food: { type: "STRING", nullable: true },
                confidence: { type: "NUMBER" },
                message: { type: "STRING" },
                menu_match: { type: "OBJECT", nullable: true },
                recommendations: { type: "ARRAY", items: { type: "OBJECT" } },
              },
              required: [
                "is_food",
                "identified_food",
                "confidence",
                "message",
                "menu_match",
                "recommendations",
              ],
            },
          },
        }),
      },
    );
    if (!geminiResponse.ok) {
      console.error(
        "Gemini food scan failed:",
        geminiResponse.status,
        await geminiResponse.text(),
      );
      throw new Error("AI service unavailable.");
    }
    const payload = (await geminiResponse.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = payload.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("");
    if (!text) throw new Error("Empty AI response.");
    const answer = parseAnswer(text);
    if (!answer.is_food)
      return json({
        ...answer,
        identified_food: null,
        confidence: 0,
        menu_match: null,
        recommendations: [],
      });
    return json({
      ...answer,
      menu_match: validateMatch(answer.menu_match, availableMenu),
      recommendations: validateRecommendations(
        answer.recommendations,
        availableMenu,
      ),
    });
  } catch (error) {
    console.error("Food scan request failed:", error);
    return json(
      { error: "We couldn't analyze the image right now. Please try again." },
      500,
    );
  }
});
