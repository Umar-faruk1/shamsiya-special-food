// Small client for the app's own backend, which proxies to Gemini.
// Per project setup, AI calls are routed through a backend endpoint
// rather than calling the Gemini API directly from the client.
// Point API_BASE_URL at your deployed backend (e.g. an Appwrite Function
// or your own server) before shipping.
const API_BASE_URL = "https://your-backend.example.com";

export async function sendAIChatMessage(
  message: string,
  dietaryPreferences: string[]
): Promise<{ reply: string }> {
  const res = await fetch(`${API_BASE_URL}/api/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, dietaryPreferences }),
  });
  if (!res.ok) throw new Error(`AI chat request failed: ${res.status}`);
  return res.json();
}

export async function sendAIFoodScan(
  imageUri: string,
  hint?: string
): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/ai/scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageUri, hint }),
  });
  if (!res.ok) throw new Error(`AI scan request failed: ${res.status}`);
  return res.json();
}
