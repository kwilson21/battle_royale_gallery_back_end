const request = require("supertest");
const gameData = require("./gametestdata");
const { Game } = require("../../models/game");
const { User } = require("../../models/user");
const mongoose = require("mongoose");

let server;

describe("/api/games", () => {
  beforeEach(() => {
    server = require("../../index");
  });
  afterEach(async () => {
    server.close();
    await Game.remove({});
  });

  describe("GET /", () => {
    it("should return all games", async () => {
      await Game.collection.insertMany(gameData);
      const res = await request(server).get("/api/games");
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(gameData.length);
      expect(res.body.some(g => g.name === gameData[0].name)).toBeTruthy();
      expect(res.body.some(g => g.name === gameData[1].name)).toBeTruthy();
      expect(res.body.some(g => g.name === gameData[2].name)).toBeTruthy();
    });
  });

  describe("GET /:id", () => {
    it("should return a game if valid id is passed", async () => {
      const game = new Game(gameData[0]);
      await game.save();
      const res = await request(server).get("/api/games/" + game._id);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("name", game.name);
    });
    it("should return 404 if invalid id is passed", async () => {
      const res = await request(server).get("/api/games/1");
      expect(res.status).toBe(404);
    });
    it("should return 404 if no game with the given id exists", async () => {
      const id = mongoose.Types.ObjectId();
      const res = await request(server).get("/api/games/" + id);
      expect(res.status).toBe(404);
    });
  });

  let token;
  let user = new User();
  user.isAdmin = true;

  beforeEach(() => {
    token = user.generateAuthToken();
  });

  describe("POST /", () => {
    let tempGame = JSON.parse(JSON.stringify(gameData[0]));

    const exec = async body => {
      return await request(server)
        .post("/api/games")
        .set("x-auth-token", token)
        .send(body);
    };

    it("should return a 401 if client is not logged in", async () => {
      token = "";

      const res = await exec();

      expect(res.status).toBe(401);
    });
    it("should return a 400 if game name is less than 3 characters", async () => {
      tempGame.name = "A";

      const res = exec(tempGame);

      // Wait for post to complete.
      setTimeout(function() {
        expect(res.status).toBe(400);
      }, 3000);
    });
    it("should return a 400 if game name is more than 50 characters", async () => {
      tempGame.name = new Array(55).join("a");

      const res = await exec(tempGame);

      expect(res.status).toBe(400);
    });
    it("should save the game if it is valid", async () => {
      await exec(gameData[0]);

      const game = await Game.find({ name: gameData[0].name });
      expect(game).not.toBeNull();
    });
    it("should return the game if it is valid", async () => {
      const res = await exec(gameData[0]);

      // Wait for post to complete.
      setTimeout(function() {
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("_id");
        expect(res.body).toHaveProperty("name", gameData[0].name);
      }, 3000);
    });
  });

  describe("PUT /", () => {
    let gameId;

    const exec = async (ext = "", body) => {
      if (body) {
        return await request(server)
          .put("/api/games/" + ext + gameId)
          .set("x-auth-token", token)
          .send(body);
      } else {
        return await request(server)
          .put("/api/games/" + ext + gameId)
          .set("x-auth-token", token);
      }
    };

    beforeEach(async () => {
      const game = new Game(gameData[0]);
      await game.save();
      gameId = game._id;
    });

    it("should update an element of the game if it is valid", async () => {
      const res = await exec({ name: "new game", released: "true" });

      // Wait for put to complete.
      setTimeout(() => {
        expect(res.body.name).toBe("new game");
      }, 3000);
    });

    it("should add a comment to the game if it is valid", async () => {
      const res = await exec("comment", {
        name: "user1",
        text: "very good game"
      });

      // Wait for put to complete.
      setTimeout(() => {
        expect(res.body.comments.name).toBe("user1");
        expect(res.body.comments.text).toBe("very good game");
      }, 3000);
    });

    // it("should return a 400 status error if request params are not valid", async () => {
    //   const res = await exec({ name: "a", released: "true" });

    //   expect(res.status).toBe(400);
    // });

    it("should like the game if it is valid", async () => {
      const res = await exec("like/");

      expect(res.status).toBe(200);
      expect(res.body.likecount).toBe(1);
    });

    it("should return 400 if user already liked the game", async () => {
      let res = await exec("like/");

      expect(res.status).toBe(200);
      expect(res.body.likecount).toBe(1);

      res = await exec("like/");

      expect(res.status).toBe(400);
    });

    it("should unlike the game if it is valid", async () => {
      let res = await exec("like/");

      expect(res.status).toBe(200);
      expect(res.body.likecount).toBe(1);

      res = await exec("unlike/");

      expect(res.status).toBe(200);
      expect(res.body.likecount).toBe(0);
    });

    it("should dislike the game if it is valid", async () => {
      const res = await exec("dislike/");

      expect(res.status).toBe(200);
      expect(res.body.dislikecount).toBe(1);
    });

    it("should return 400 if user already disliked the game", async () => {
      let res = await exec("dislike/");

      expect(res.status).toBe(200);
      expect(res.body.dislikecount).toBe(1);

      res = await exec("dislike/");

      expect(res.status).toBe(400);
    });

    it("should undislike the game if it is valid", async () => {
      let res = await exec("dislike/");

      expect(res.status).toBe(200);
      expect(res.body.dislikecount).toBe(1);

      res = await exec("undislike/");

      expect(res.status).toBe(200);
      expect(res.body.dislikecount).toBe(0);
    });
  });

  describe("DELETE /", () => {
    let addedGame;
    beforeEach(async () => {
      addedGame = new Game(gameData[0]);
      await addedGame.save();
    });

    it("should remove the game from the database", async () => {
      await request(server)
        .delete("/api/games/" + addedGame._id)
        .set("x-auth-token", token);

      setTimeout(async () => {
        game = await Game.find({ name: gameData[0].name });
        expect(game).toBeNull();
      }, 3000);
    });

    it("should remove a comment from a game", async () => {
      // Add comment to game
      let comment = { name: "user1", text: "very good game" };

      await request(server)
        .put("/api/games/comment" + addedGame._id)
        .set("x-auth-token", token)
        .send(comment);

      // Remove comment
      setTimeout(async () => {
        await request(server)
          .delete("/api/games/comment/" + addedGame._id)
          .set("x-auth-token", token);
      }, 3000);

      setTimeout(async () => {
        game = await Game.find({ name: gameData[0].name });
        expect(game).toBeNull();
        expect(game.comments).not.toContain(comment);
      }, 3000);
    });

    it("should return 404 if no game with the given id exists", async () => {
      const id = mongoose.Types.ObjectId();
      const res = await request(server)
        .delete("/api/games/" + id)
        .set("x-auth-token", token);
      expect(res.status).toBe(404);
    });
  });
});
