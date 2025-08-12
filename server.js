// server.js
const jsonServer = require("json-server");
const crypto = require("crypto");
const server = jsonServer.create();
const router = jsonServer.router("db.json");
const middlewares = jsonServer.defaults();

server.use(jsonServer.bodyParser);
server.use(middlewares);

// Middleware para gerar o hash antes de salvar
server.use((req, res, next) => {
  if (req.method === "POST" && req.path === "/glucoseReadings") {
    const reading = {
      value: req.body.value,
      timestamp: req.body.timestamp,
    };
    const dataString = JSON.stringify(reading);
    const hash = crypto.createHash("sha256").update(dataString).digest("hex");

    req.body.dataHash = hash;
  }
  next();
});

server.use(router);
server.listen(3001, () => {
  console.log(
    "JSON Server with custom hash middleware is running on port 3001"
  );
});
