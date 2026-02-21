const http = require("node:http");
const path = require("node:path");
const fs = require("node:fs");
const { URL } = require("node:url");

const { gruposArticulo, centros, almacenes, monedas, indicesCatalogo } = require("./data");
const { consultarBDPR } = require("./services/bdprService");

const port = process.env.PORT || 3000;
const exportJobs = new Map();
const publicDir = path.join(__dirname, "..", "public");

function sendJson(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
  });
}

function serveStatic(req, res, pathname) {
  const file = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.join(publicDir, file);
  if (!filePath.startsWith(publicDir) || !fs.existsSync(filePath)) return false;

  const ext = path.extname(filePath);
  const type =
    ext === ".html"
      ? "text/html"
      : ext === ".css"
        ? "text/css"
        : ext === ".js"
          ? "application/javascript"
          : "text/plain";
  res.writeHead(200, { "Content-Type": `${type}; charset=utf-8` });
  fs.createReadStream(filePath).pipe(res);
  return true;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const { pathname } = url;

  if (req.method === "OPTIONS") return sendJson(res, 204, {});

  if (req.method === "GET" && pathname === "/catalogos/grupo-articulo") return sendJson(res, 200, gruposArticulo);
  if (req.method === "GET" && pathname === "/catalogos/centros") return sendJson(res, 200, centros);
  if (req.method === "GET" && pathname === "/catalogos/almacenes") return sendJson(res, 200, almacenes);
  if (req.method === "GET" && pathname === "/catalogos/monedas") return sendJson(res, 200, monedas);
  if (req.method === "GET" && pathname === "/catalogos/indices") return sendJson(res, 200, indicesCatalogo);

  if (req.method === "POST" && pathname === "/bdpr/consulta") {
    const payload = await parseBody(req);
    return sendJson(res, 200, consultarBDPR(payload));
  }

  if (req.method === "POST" && pathname === "/bdpr/cambiar-indice") {
    const payload = await parseBody(req);
    return sendJson(res, 200, consultarBDPR({ ...payload, overrideIndice: payload.overrideIndice }));
  }

  if (req.method === "POST" && pathname === "/bdpr/export") {
    const { mode = "csv_limited", limit = 50000 } = await parseBody(req);
    if (mode === "csv_limited") {
      return sendJson(res, 200, {
        mode,
        limit,
        download_url: `/exports/bdpr_consulta_${limit}.csv`,
        status: "ready"
      });
    }

    const jobId = `job_${Date.now()}`;
    exportJobs.set(jobId, {
      job_id: jobId,
      status: "processing",
      created_at: new Date().toISOString(),
      mode
    });
    setTimeout(() => {
      exportJobs.set(jobId, {
        ...exportJobs.get(jobId),
        status: "ready",
        download_url: `/exports/${jobId}.zip`
      });
    }, 1500);
    return sendJson(res, 202, { job_id: jobId, status: "processing" });
  }

  if (req.method === "GET" && pathname.startsWith("/bdpr/export/status/")) {
    const jobId = pathname.split("/").pop();
    const job = exportJobs.get(jobId);
    if (!job) return sendJson(res, 404, { message: "job_id no encontrado" });
    return sendJson(res, 200, job);
  }

  if (req.method === "GET" && serveStatic(req, res, pathname)) return;

  sendJson(res, 404, { message: "Not Found" });
});

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`BDPR app escuchando en http://localhost:${port}`);
});
