import { createAppHandler } from "./server.ts";

declare const Bun: {
  env: Record<string, string | undefined>;
  serve(opts: { port: number; fetch: (req: Request) => Promise<Response> }): unknown;
};

const handleRequest = createAppHandler();
const port = Number(Bun.env.PORT || 3000);

Bun.serve({
  port,
  fetch: handleRequest,
});

console.log(`InboxProof listening on port ${port}`);
