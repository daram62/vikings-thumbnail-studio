import { createId, ensureSchema, getBindings, jsonError, normalizeOpponent } from "../storage";

export const runtime = "edge";

export async function GET() {
  const { DB } = getBindings();
  if (!DB) return Response.json({ opponents: [] });
  await ensureSchema(DB);
  const result = await DB.prepare(`SELECT id, name, logo_url, circular_frame
    FROM opponents ORDER BY updated_at DESC, created_at DESC`).all<{
    id: string;
    name: string;
    logo_url: string;
    circular_frame: number;
  }>();
  return Response.json({ opponents: result.results.map(normalizeOpponent) });
}

export async function POST(request: Request) {
  const { DB } = getBindings();
  if (!DB) return jsonError("D1 binding DB is unavailable.", 503);
  const payload = (await request.json()) as {
    name?: string;
    logoUrl?: string;
    circularFrame?: boolean;
  };
  const name = payload.name?.trim();
  const logoUrl = payload.logoUrl?.trim();
  if (!name || !logoUrl) return jsonError("name and logoUrl are required.", 400);

  await ensureSchema(DB);
  const id = createId("opponent");
  const circularFrame = payload.circularFrame === false ? 0 : 1;
  await DB.prepare(`INSERT INTO opponents (id, name, logo_url, circular_frame)
    VALUES (?, ?, ?, ?)`).bind(id, name, logoUrl, circularFrame).run();
  return Response.json({
    opponent: { id, name, logoUrl, circularFrame: Boolean(circularFrame) },
  }, { status: 201 });
}
