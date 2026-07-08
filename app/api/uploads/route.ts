import { createId, getBindings, jsonError } from "../storage";

export const runtime = "edge";

const allowedFolders = new Set(["project-logos", "opponent-logos"]);

export async function POST(request: Request) {
  const { BUCKET } = getBindings();
  if (!BUCKET) return jsonError("R2 binding BUCKET is unavailable.", 503);

  const form = await request.formData();
  const file = form.get("file");
  const folder = String(form.get("folder") ?? "uploads");
  if (!(file instanceof File)) return jsonError("file is required.", 400);
  if (!allowedFolders.has(folder)) return jsonError("folder is not allowed.", 400);
  if (!file.type.startsWith("image/")) return jsonError("Only image uploads are allowed.", 400);

  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
  const key = `${folder}/${createId("image")}.${extension}`;
  await BUCKET.put(key, file.stream(), {
    httpMetadata: { contentType: file.type || "application/octet-stream" },
    customMetadata: { originalName: file.name },
  });
  return Response.json({ key, url: `/api/assets/${key}` }, { status: 201 });
}
