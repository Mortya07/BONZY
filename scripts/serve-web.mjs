import http from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import staff from "../server/staff.cjs";
const api = staff.createStaffApi();
const root = path.resolve("dist");
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml",
};
const server = http.createServer(async (req, res) => {
  if (req.url?.startsWith("/bonzy-api/"))
    return api(req, res, () => res.writeHead(404).end());
  if (!["GET", "HEAD"].includes(req.method)) {
    res.writeHead(405).end();
    return;
  }
  try {
    const route = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    const file = path.resolve(
      root,
      "." + (route === "/" ? "/index.html" : route),
    );
    if (!file.startsWith(root + path.sep)) {
      res.writeHead(403).end();
      return;
    }
    const info = await stat(file);
    if (!info.isFile()) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, {
      "Content-Type": types[path.extname(file)] || "application/octet-stream",
      "Content-Length": info.size,
      "X-Content-Type-Options": "nosniff",
    });
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    const stream = createReadStream(file);
    stream.on("error", () => res.destroy());
    stream.pipe(res);
  } catch {
    res.writeHead(404).end("Not found. Run pnpm export:web first.");
  }
});
server.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
server.listen(4173, "127.0.0.1", () =>
  console.log("BONZY: http://localhost:4173"),
);
