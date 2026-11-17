import http from "node:http";
import { createAppHandler } from "./server.ts";

const port = Number(process.env.PORT || 3000);
const handler = createAppHandler();

const server = http.createServer(async (req, res) => {
  const url = `http://${req.headers.host || `localhost:${port}`}${req.url || "/"}`;
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const body = chunks.length > 0 && req.method !== "GET" && req.method !== "HEAD"
    ? Buffer.concat(chunks)
    : undefined;

  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (Array.isArray(v)) headers.set(k, v.join(", "));
    else if (typeof v === "string") headers.set(k, v);
  }

  const webReq = new Request(url, {
    method: req.method,
    headers,
    body,
  });

  const webRes = await handler(webReq);
  res.statusCode = webRes.status;
  webRes.headers.forEach((value, key) => res.setHeader(key, value));
  const buf = Buffer.from(await webRes.arrayBuffer());
  res.end(buf);
});

server.listen(port, () => {
  console.log(`InboxProof running locally at http://localhost:${port}`);
});
