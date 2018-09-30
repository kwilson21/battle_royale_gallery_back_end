const morgan = require("morgan");

module.exports = function(app) {
  app.use(morgan("tiny"));
  console.log("Morgan enabled...");
};
