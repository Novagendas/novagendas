const META_API_VERSION = Deno.env.get("META_API_VERSION") ?? "v18.0";
const GRAPH_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

export async function sendMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  message: Record<string, unknown>
): Promise<void> {
  const res = await fetch(`${GRAPH_BASE}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messaging_product: "whatsapp", to, ...message }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Meta API ${res.status}: ${JSON.stringify(err)}`);
  }
}
