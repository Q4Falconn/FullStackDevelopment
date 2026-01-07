import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { User } from "./models/user.js";
import { Game, GameDocument } from "./models/game.js";
import { connectToDB } from "./db.js";
import mongoose from "mongoose";
import { GraphQLError } from "graphql";
import { createPasswordHash, verifyPassword } from "./auth/password.js";
import { generateToken } from "./auth/jwt.js";
import { requireAuth } from "./auth/requireAuth.js";
import { buildContext } from "./auth/context.js";

const typeDefs = `#graphql
  type User {
    id: String
    username: String
  }

  type AuthPayload {
    token: String!
    user: User!
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
    me: User
  }

  type Mutation {
    createUser(username: String!, password: String!): User
    login(username: String!, password: String!): AuthPayload
    createGame(amountOfPlayers: Int!, targetScore: Int!, cardsPerPlayer: Int!): Game
    joinGame(gameId: String!): Int
  }
`;

const resolvers = {
  Query: {
    me: async (
      _p: unknown,
      _a: unknown,
      ctx: { currentUser: { id: string; username: string } | null }
    ) => ctx.currentUser,

    users: async () => {
      const users = await User.find().lean();
      return users.map((u) => ({ id: u._id.toString(), username: u.username }));
    },

    games: async () => {
      const games = await Game.find().lean();
      return games.map((g, i) => ({
        ...g,
        id: g._id.toString(),
      }));
    },
  },

  Game: {
    players: async (parent: GameDocument) => {
      if (parent.players.length === 0) {
        return [];
      }

      const users = await User.find({ _id: { $in: parent.players } });

      return parent.players.map((p) => {
        const matchingPlayer = users.filter(
          (u) => u._id.toString() === p._id.toString()
        )[0];
        return {
          id: matchingPlayer._id.toString(),
          username: matchingPlayer.username,
        };
      });
    },

    createdBy: async (parent: GameDocument) => {
      const user = await User.findById(parent.createdBy._id.toString());

      return {
        id: user._id.toString(),
        username: user.username,
      };
    },
  },

  Mutation: {
    createUser: async (_p, { username, password }) => {
      const existing = await User.findOne({ username }).lean();
      if (existing) {
        throw new GraphQLError("Username already taken", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      const { salt, hash } = createPasswordHash(password);

      const user = await User.create({
        username,
        passwordSalt: salt,
        passwordHash: hash,
      });

      return { id: user._id.toString(), username: user.username };
    },

    login: async (_p, { username, password }) => {
      const user = await User.findOne({ username }).lean();
      if (!user) {
        throw new GraphQLError("Invalid username or password", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const ok = verifyPassword(password, user.passwordSalt, user.passwordHash);
      if (!ok) {
        throw new GraphQLError("Invalid username or password", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const safeUser = { id: user._id.toString(), username: user.username };
      const token = generateToken(safeUser);

      return { token, user: safeUser };
    },

    createGame: async (
      _p: unknown,
      args: {
        amountOfPlayers: number;
        targetScore: number;
        cardsPerPlayer: number;
      },
      ctx: { currentUser: { id: string; username: string } | null }
    ) => {
      const currentUser = requireAuth(ctx);

      const game = await Game.create({
        ...args,
        createdBy: currentUser.id,
        players: [currentUser.id as any],
        createdAt: new Date(),
        scores: [],
      });

      return {
        id: game._id.toString(),
        amountOfPlayers: game.amountOfPlayers,
        targetScore: game.targetScore,
        cardsPerPlayer: game.cardsPerPlayer,
        createdAt: game.createdAt.toISOString(),
      };
    },

    joinGame: async (
      _p: unknown,
      args: {
        gameId: string;
      },
      ctx: { currentUser: { id: string; username: string } | null }
    ) => {
      // Game Exists, If Max amount of players is reached, If User is already in
      const user = requireAuth(ctx);
      const game = await Game.findById(args.gameId);

      if (!game) {
        throw new GraphQLError("Game not found");
      }

      if (game.amountOfPlayers <= game.players.length) {
        throw new GraphQLError("Max amount of players is reached");
      }

      if (
        game.players.map((player) => player._id.toString()).includes(user.id)
      ) {
        throw new GraphQLError("Player is already connected");
      }

      await Game.updateOne(
        { _id: game._id },
        { $addToSet: { players: user.id } }
      );

      return game.players.length + 1;
    },
  },
};

export default resolvers;

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
    context: buildContext,
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
