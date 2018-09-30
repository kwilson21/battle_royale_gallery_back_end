// Libraries
const bodyParser = require("body-parser");

const morgan = require("morgan");

// Middleware
const error = require("../middleware/error");

// Routes
const games = require("../routes/games");
const users = require("../routes/users");
const auth = require("../routes/auth");

module.exports = function(app) {
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use("/api/games", games);
  app.use("/api/users", users);
  app.use("/api/auth", auth);
  app.use(error);
};
