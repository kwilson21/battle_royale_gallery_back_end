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
  app.use(bodyParser.urlencoded({ extended: false }, { limit: "16mb" }));
  app.use(bodyParser.json({ limit: "16mb" }));
  app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
  });
  app.use("/api/games", games);
  app.use("/api/users", users);
  app.use("/api/auth", auth);
  app.use(error);
};
