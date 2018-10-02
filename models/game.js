const mongoose = require("mongoose");
const Joi = require("joi");

// const games = [
//   {
//     id: 1,
//     name: "Game Title",
//     developer: "Game dev",
//     description: "Cool game",
//     genre: {
//       perspective: ["First-Person", "Third-Person"],
//       style: ["Shooter", "Melee"]
//     },
//     playernumber: "100",
//     released: true,
//     releasedate: "05-19-2017", // MM/DD/YYYY
//     platform: [
//       "Xbox One",
//       "PlayStation 4",
//       "PC",
//       "Linux"
//     ],
//     rating: { likes: 0, dislikes: 0 }
//   }
// ];

const gameSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 50
  },
  developer: {
    type: String,
    minlength: 3,
    maxlength: 50
  },
  description: {
    type: String,
    minlength: 5,
    maxlength: 750
  },
  genre: {
    perspective: [
      {
        type: String,
        minlength: 5,
        maxlength: 50
      }
    ],
    style: [
      {
        type: String,
        minlength: 5,
        maxlength: 50
      }
    ]
  },
  playernumber: {
    type: Number,
    min: 0,
    max: 1000
  },
  released: {
    type: Boolean,
    required: true
  },
  releasedate: {
    type: Date
  },
  platform: [
    {
      type: String,
      minlength: 2,
      maxlength: 50
    }
  ],
  rating: {
    likecount: {
      type: Number,
      default: 0,
      min: 0,
      max: 999999
    },
    dislikecount: {
      type: Number,
      default: 0,
      min: 0,
      max: 999999
    },

    likes: [
      {
        type: String,
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        sparse: true
      }
    ],
    dislikes: [
      {
        type: String,
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        sparse: true
      }
    ]
  },
  price: {
    type: Number,
    min: 0,
    max: 999,
    default: 0
  },
  image: {
    data: Buffer,
    contentType: String
  },
  comments: [
    {
      name: {
        type: String,
        min: 3,
        max: 50
      },
      text: {
        type: String,
        min: 5,
        max: 140
      }
    }
  ]
});

const Game = mongoose.model("Game", gameSchema);

function validateGame(game) {
  const schema = {
    name: Joi.string()
      .min(3)
      .max(50)
      .required(),
    developer: Joi.string()
      .min(3)
      .max(50),
    description: Joi.string()
      .min(5)
      .max(750),
    genre: {
      perspective: Joi.array().items(
        Joi.string()
          .min(3)
          .max(50)
      ),
      style: Joi.array().items(
        Joi.string()
          .min(3)
          .max(50)
      )
    },
    playernumber: Joi.number()
      .min(0)
      .max(1000),
    released: Joi.boolean().required(),
    releasedate: Joi.date()
      .min("1-1-1970")
      .max("12-31-2025"),
    platform: Joi.array().items(
      Joi.string()
        .min(2)
        .max(50)
    ),
    price: Joi.number()
      .min(0)
      .max(999)
  };

  return Joi.validate(game, schema);
}

exports.Game = Game;
exports.validateGame = validateGame;
