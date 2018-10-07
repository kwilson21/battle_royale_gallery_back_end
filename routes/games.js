// Middleware
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const cache = require("../middleware/cache");
const validateObjectId = require("../middleware/validateObjectId");
// Models
const { Game, validateGame } = require("../models/game");
// Libraries
const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer();
const _ = require("lodash");

// Create a game
router.post("/", [auth, admin, upload.single("image")], async (req, res) => {
  if (req.body.released) {
    req.body.released = Boolean(Number(req.body.released));
  }
  if (req.body.image !== undefined) {
    req.body.image.data = Buffer.from(req.body.image.data);
  }

  const { error } = validateGame(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  gameExists = await Game.findOne({ name: req.body.name });

  if (gameExists) {
    res.status(400).send(`${req.body.name} already exists!`);
  } else {
    let game = updateGame(new Game({}), req.body, req.file);

    game = await game.save();

    res.send(game);
  }
});

// Read all games
router.get("/", cache(30), async (req, res) => {
  const games = await Game.find();
  res.send(games);
});

// Read single game
router.get("/:id", [validateObjectId, cache(30)], async (req, res) => {
  const game = await Game.findById(req.params.id);
  if (!game) {
    return res.status(404).send("Game not found.");
  }
  res.send(game);
});

// Update a game
router.put(
  "/:id",
  [auth, admin, validateObjectId, upload.single("image")],
  async (req, res) => {
    if (req.body.released) {
      req.body.released = Boolean(Number(req.body.released));
    }
    if (req.body.image !== undefined) {
      req.body.image.data = Buffer.from(req.body.image.data);
    }

    const { error } = validateGame(req.body);
    if (error) {
      return res.status(400).send(error.details[0].message);
    }
    Game.findById(req.params.id, (err, game) => {
      if (req.body.image !== undefined) {
        game = updateGame(game, req.body);
      }

      if (req.file !== undefined) {
        game = updateGame(game, req.body, req.file);
      }

      game.save((e, updatedGame) => {
        if (err) {
          res.status(400).send(e);
        } else {
          res.send(updatedGame);
        }
      });
    });
  }
);

// Comment on a game
router.put("/comment/:id", validateObjectId, async (req, res) => {
  // const { error } = validateGame(req.body);
  // if (error) {
  //   return res.status(400).send(error.details[0].message);
  // }

  Game.findById(req.params.id, (err, game) => {
    const comment = { name: req.body.name, text: req.body.text };

    if (req.body !== undefined) {
      game.comments.push(comment);
    }
    game.save((e, updatedGame) => {
      if (err) {
        res.status(400).send(e);
      } else {
        res.send(updatedGame.comments);
      }
    });
  });
});

// Like a game
router.put("/like/:id", [auth, validateObjectId], async (req, res) => {
  Game.findById(req.params.id, (err, game) => {
    game = likeGame(game, req.user);
    if (game) {
      game.save((e, updatedGame) => {
        if (err) {
          res.status(400).send(e);
        } else {
          res.send(updatedGame.rating);
        }
      });
    } else {
      res.status(400).send("User already liked the game.");
    }
  });
});

// Unlike a game
router.put("/unlike/:id", [auth, validateObjectId], async (req, res) => {
  Game.findById(req.params.id, (err, game) => {
    game = unlikeGame(game, req.user);
    if (game) {
      game.save((e, updatedGame) => {
        if (err) {
          res.status(400).send(e);
        } else {
          res.send(updatedGame.rating);
        }
      });
    } else {
      res.status(400).send("User already unliked the game.");
    }
  });
});

// Dislike a game
router.put("/dislike/:id", [auth, validateObjectId], async (req, res) => {
  Game.findById(req.params.id, (err, game) => {
    game = dislikeGame(game, req.user);
    if (game) {
      game.save((e, updatedGame) => {
        if (err) {
          res.status(400).send(e);
        } else {
          res.send(updatedGame.rating);
        }
      });
    } else {
      res.status(400).send("User already disliked the game.");
    }
  });
});

// Undislike a game
router.put("/undislike/:id", [auth, validateObjectId], async (req, res) => {
  Game.findById(req.params.id, (err, game) => {
    game = undislikeGame(game, req.user);
    if (game) {
      game.save((e, updatedGame) => {
        if (err) {
          res.status(400).send(e);
        } else {
          res.send(updatedGame.rating);
        }
      });
    } else {
      res.status(400).send("User already undisliked the game.");
    }
  });
});

// Delete
router.delete("/:id", [auth, admin, validateObjectId], async (req, res) => {
  const game = await Game.findByIdAndRemove(req.params.id);

  if (!game) {
    return res.status(404).send("Game not found");
  }

  res.send(game);
});

// Remove comment from game
router.delete("/comment/:id", validateObjectId, async (req, res) => {
  Game.findById(req.params.id, (err, game) => {
    const comment = { name: req.body.name, text: req.body.text };
    const index = game.comments.indexOf(comment);
    if (req.body !== undefined) {
      game.comments.splice(index, 1);
    }
    game.save((e, updatedGame) => {
      if (err) {
        res.status(400).send(e);
      } else {
        res.send(updatedGame.comments);
      }
    });
  });
});

function likeGame(game, user) {
  if (game.rating.dislikes.includes(user._id)) {
    undislikeGame(game, user);
  }
  if (!game.rating.likes.includes(user._id)) {
    game.rating.likecount++;
    game.rating.likes.push(user._id);
    return game;
  } else {
    return null;
  }
}

function dislikeGame(game, user) {
  if (game.rating.likes.includes(user._id)) {
    unlikeGame(game, user);
  }
  if (!game.rating.dislikes.includes(user._id)) {
    game.rating.dislikecount++;
    game.rating.dislikes.push(user._id);
    return game;
  } else {
    return null;
  }
}

function unlikeGame(game, user) {
  if (game.rating.likes.includes(user._id)) {
    const index = game.rating.likes.indexOf(user._id);
    game.rating.likecount--;
    game.rating.likes.splice(index, 1);
    return game;
  } else {
    return null;
  }
}

function undislikeGame(game, user) {
  if (game.rating.dislikes.includes(user._id)) {
    const index = game.rating.dislikes.indexOf(user._id);
    game.rating.dislikecount--;
    game.rating.dislikes.splice(index, 1);
    return game;
  } else {
    return null;
  }
}

function updateGame(game, reqBody = undefined, reqFile = undefined) {
  if (reqBody.name !== undefined) {
    game.name = reqBody.name;
  }
  if (reqBody.developer !== undefined) {
    game.developer = reqBody.developer;
  }
  if (reqBody.description !== undefined) {
    game.description = reqBody.description;
  }
  if (reqBody.genre !== undefined) {
    game.genre = reqBody.genre;
  }
  if (reqBody.playernumber !== undefined) {
    game.playernumber = reqBody.playernumber;
  }
  if (reqBody.released !== undefined) {
    game.released = reqBody.released;
  }
  if (reqBody.releasedate !== undefined) {
    game.releasedate = reqBody.releasedate;
  }
  if (reqBody.platform !== undefined) {
    game.platform = reqBody.platform;
  }
  if (reqBody.price !== undefined) {
    game.price = reqBody.price;
  }
  if (reqBody.image !== undefined) {
    if (reqBody.image.data !== undefined) {
      game.image.data = reqBody.image.data;
    }
    if (reqBody.image.contentType !== undefined) {
      game.image.contentType = reqBody.image.contentType;
    }
  }
  if (reqFile !== undefined) {
    if (reqFile.buffer !== undefined) {
      game.image.data = reqFile.buffer;
    }
    if (reqFile.mimetype !== undefined) {
      game.image.contentType = reqFile.mimetype;
    }
  }

  return game;
}

module.exports = router;
