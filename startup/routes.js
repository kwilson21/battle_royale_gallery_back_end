// Libraries
const bodyParser = require("body-parser");

const morgan = require("morgan");

// Middleware
const error = require("../middleware/error");

// Routes
const games = require("../routes/games");
const users = require("../routes/users");
const auth = require("../routes/auth");


  app.use(function(req, res, next) {
    // Website you wish to allow to connect
    res.setHeader("Access-Control-Allow-Origin", "*");

    // Request methods you wish to allow
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, OPTIONS, PUT, PATCH, DELETE"
    );

    // Request headers you wish to allow
    res.setHeader(
      "Access-Control-Allow-Headers",
      "X-Requested-With,content-type,x-auth-token"
    );

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader("Access-Control-Allow-Credentials", true);

    // Pass to next layer of middleware
    next();
  });
  app.use(bodyParser.urlencoded({ extended: false }, { limit: "16mb" }));
  app.use(bodyParser.json({ limit: "16mb" }));
  app.use("/api/games", games);
  app.use("/api/users", users);
  app.use("/api/auth", auth);
  app.use(error);
};
