// server.js
const jsonServer = require("json-server");
<<<<<<< HEAD
=======
const crypto = require("crypto");
>>>>>>> e31865ac6ee283c8fdd812f88b02059f1c2c18b4
const server = jsonServer.create();
const router = jsonServer.router("db.json");
const middlewares = jsonServer.defaults();

server.use(jsonServer.bodyParser);
server.use(middlewares);

<<<<<<< HEAD
server.use(router);
server.listen(3000, () => {
  // Changed port to 3000 for consistency
  console.log("JSON Server is running on port 3000"); // Updated log message
=======
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
>>>>>>> e31865ac6ee283c8fdd812f88b02059f1c2c18b4
});
