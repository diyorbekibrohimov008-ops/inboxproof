import { createAppHandler } from "../../src/server.ts";

const handleRequest = createAppHandler();

export default async (req: Request) => {
  return handleRequest(req);
};

export const config = {
  path: "/*",
};
