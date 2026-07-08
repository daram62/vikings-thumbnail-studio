import { createId, ensureSchema, getBindings, jsonError, normalizeProject } from "../storage";

export const runtime = "edge";

export async function GET() {
  const { DB } = getBindings();
  if (!DB) return Response.json({ projects: [] });
  await ensureSchema(DB);
  const result = await DB.prepare(`SELECT id, name, logo_url, tournament_line_1, tournament_line_2
    FROM projects ORDER BY updated_at DESC, created_at DESC`).all<{
    id: string;
    name: string;
    logo_url: string;
    tournament_line_1: string;
    tournament_line_2: string;
  }>();
  return Response.json({ projects: result.results.map(normalizeProject) });
}

export async function POST(request: Request) {
  const { DB } = getBindings();
  if (!DB) return jsonError("D1 binding DB is unavailable.", 503);
  const payload = (await request.json()) as {
    name?: string;
    logoUrl?: string;
    tournamentLine1?: string;
    tournamentLine2?: string;
  };
  const name = payload.name?.trim();
  const logoUrl = payload.logoUrl?.trim();
  const tournamentLine1 = payload.tournamentLine1?.trim() || "대전광역시 플로어볼";
  const tournamentLine2 = payload.tournamentLine2?.trim() || "챌린지컵 대회";
  if (!name || !logoUrl) return jsonError("name and logoUrl are required.", 400);

  await ensureSchema(DB);
  const id = createId("project");
  await DB.prepare(`INSERT INTO projects (id, name, logo_url, tournament_line_1, tournament_line_2)
    VALUES (?, ?, ?, ?, ?)`).bind(id, name, logoUrl, tournamentLine1, tournamentLine2).run();
  return Response.json({
    project: { id, name, logoUrl, tournamentLine1, tournamentLine2 },
  }, { status: 201 });
}
