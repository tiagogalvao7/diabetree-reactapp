// server.js
const jsonServer = require("json-server");
const server = jsonServer.create();
const router = jsonServer.router("db.json");
const middlewares = jsonServer.defaults();

server.use(jsonServer.bodyParser);
server.use(middlewares);

server.use(router);
server.listen(3000, () => {
  // Changed port to 3000 for consistency
  console.log("JSON Server is running on port 3000"); // Updated log message
});
