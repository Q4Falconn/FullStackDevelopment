import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { User } from "./models/user.js";
import { Game } from "./models/game.js";
import { connectToDB } from "./db.js";
import mongoose from "mongoose";

const typeDefs = `#graphql

    type User {
        id: String
        username: String
    }

    type Game {
        id: String
        amountOfPlayers: Int
        players: [User]
        scores: [Int]
        targetScore: Int
        cardsPerPlayer: Int
        createdBy: User
        createdAt: String
    }


    type Query {
        users: [User]
        games: [Game]
    }

    type Mutation {
      createUser(username: String, password: String): User
      createGame(amountOfPlayers: Int, targetScore: Int, cardsPerPlayer: Int): Game
    }

`;

const resolvers = {
  Query: {
    users: async () => {
      const users = await User.find().lean();
      return users.map((user) => ({
        id: user._id.toString(),
        username: user.username,
      }));
    },
    games: async () => {
      const games = await Game.find().lean();
      return games.map((game) => ({ ...game, id: game._id.toString() }));
    },
  },

  Mutation: {
    createUser: async (
      _: unknown,
      args: { username: string; password: string }
    ) => {
      const updatedArgs = {
        username: args.username,
        passwordHash: args.password + "verySecret",
        passwordSalt: args.password + "withALittleBitMore",
      };
      const newUser = await User.create(updatedArgs);
      return { id: newUser._id.toString(), username: newUser.username };
    },
    createGame: async (
      _: unknown,
      args: {
        amountOfPlayers: number;
        targetScore: number;
        cardsPerPlayer: number;
      }
    ) => {
      const newGame = await Game.create({ ...args, createdAt: new Date() });
      return {
        id: newGame._id.toString(),
        amountOfPlayers: newGame.amountOfPlayers,
      };
    },
  },
};

async function main() {
  await connectToDB(
    "mongodb+srv://sebastianoerndrup_db_user:QqMd6ADeSPx0DSAv@uno-db.zcbtce6.mongodb.net/"
  );
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
  });

  process.on("SIGINT", async () => {
    await mongoose.disconnect();
    process.exit(0);
  });

  console.log(`🚀  Server ready at: ${url}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
