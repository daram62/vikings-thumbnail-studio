import { getBindings, jsonError } from "../../storage";

export const runtime = "edge";

export async function GET(_request: Request, context: { params: Promise<{ key: string[] }> }) {
  const { BUCKET } = getBindings();
  if (!BUCKET) return jsonError("R2 binding BUCKET is unavailable.", 503);
  const { key } = await context.params;
  const objectKey = key.join("/");
  const object = await BUCKET.get(objectKey);
  if (!object) return jsonError("Asset not found.", 404);

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");
  return new Response(object.body, { headers });
}
