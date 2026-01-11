import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { User } from "./db-models/user.js";
import { Game, GameDocument } from "./db-models/game.js";
import { connectToDB } from "./db.js";
import mongoose from "mongoose";
import { GraphQLError } from "graphql";
import { createPasswordHash, verifyPassword } from "./auth/password.js";
import { generateToken } from "./auth/jwt.js";
import { requireAuth } from "./auth/requireAuth.js";
import { buildContext } from "./auth/context.js";
import { GAME_UPDATED, pubsub } from "./pubsub.js";
import { Game as DomainGame } from "./models/game.js";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { WebSocketServer } from "ws";
import express from "express";
import http from "node:http";
import { useServer } from "graphql-ws/use/ws";
import cors from "cors";
import bodyParser from "body-parser";
import { expressMiddleware } from "@as-integrations/express5";
import { GraphQLJSON } from "graphql-scalars";

const typeDefs = `#graphql
  scalar JSON

  type User {
    id: String
    username: String
  }

  enum GameStatus {
    WAITING
    IN_PROGRESS
    FINISHED
  }

  enum Color {
    BLUE
    GREEN
    RED
    YELLOW
  }

  enum CardType {
    NUMBERED
    SKIP
    REVERSE
    DRAW
    WILD
    WILD_DRAW
  }

  type Card {
    type: CardType!
    color: Color
    number: Int
  }

  type RoundState {
    players: [String!]!
    hands: [[Card!]!]!
    drawPile: [Card!]!
    discardPile: [Card!]!
    currentColor: Color!
    currentDirection: String!
    dealer: Int!
    playerInTurn: Int
  }

  type GameState {
    players: [String!]!
    targetScore: Int!
    scores: [Int!]!
    cardsPerPlayer: Int!
    currentRound: RoundState
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
    status: GameStatus
    state: JSON
  }

  type Query {
    users: [User]
    games: [Game]
    game(gameId: String!): Game
    me: User
  }

  type Mutation {
    createUser(username: String!, password: String!): User
    login(username: String!, password: String!): AuthPayload

    createGame(amountOfPlayers: Int!, targetScore: Int!, cardsPerPlayer: Int!): Game
    joinGame(gameId: String!): Int

    startGame(gameId: String!): Game
      
    drawCard(gameId: String!): Game
    playCard(gameId: String!, cardIndex: Int!, nextColor: Color): Game
  }

  type Subscription {
    gameUpdated(gameId: String!): Game!
  }
`;

const resolvers = {
  JSON: GraphQLJSON,
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

    game: async (_p, { gameId }) => {
      const g = await Game.findById(gameId).lean();
      if (!g) return null;
      return { ...g, id: g._id.toString() };
    },
  },

  Game: {
    players: async (parent: any) => {
      const rawPlayers = parent.players ?? [];
      if (rawPlayers.length === 0) return [];

      // normalize to string ids no matter if ObjectId, populated doc, or string
      const ids = rawPlayers
        .map((p: any) => {
          if (!p) return "";
          if (typeof p === "string") return p;
          if (p._id) return p._id.toString();
          // mongoose ObjectId
          if (p instanceof mongoose.Types.ObjectId) return p.toString();
          // fallback
          return p.toString();
        })
        .filter(Boolean);

      const users = await User.find({ _id: { $in: ids } }).lean();
      const byId = new Map(users.map((u) => [u._id.toString(), u]));

      return ids.map((id: string) => {
        const u = byId.get(id);
        return u ? { id, username: u.username } : { id, username: "Unknown" };
      });
    },

    createdBy: async (parent: any) => {
      const raw = parent.createdBy;
      const id =
        typeof raw === "string"
          ? raw
          : raw?._id
          ? raw._id.toString()
          : raw?.toString();

      if (!id) return null;

      const user = await User.findById(id).lean();
      if (!user) return { id, username: "Unknown" };

      return { id: user._id.toString(), username: user.username };
    },

    state: async (parent: any) => parent.gameState ?? null,
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
        status: "WAITING",
      });

      return {
        id: game._id.toString(),
        amountOfPlayers: game.amountOfPlayers,
        targetScore: game.targetScore,
        cardsPerPlayer: game.cardsPerPlayer,
        createdAt: game.createdAt.toISOString(),
        createdBy: currentUser,
        players: [currentUser],
        scores: game.scores,
        status: game.status,
      };
    },

    joinGame: async (_p, args: { gameId: string }, ctx) => {
      const user = requireAuth(ctx);
      const game = await Game.findById(args.gameId);

      if (!game) throw new GraphQLError("Game not found");

      if (game.amountOfPlayers <= game.players.length) {
        throw new GraphQLError("Max amount of players is reached");
      }

      if (game.players.map((p) => p._id.toString()).includes(user.id)) {
        throw new GraphQLError("Player is already connected");
      }

      if (game.status !== "WAITING") {
        throw new GraphQLError("Game already started", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      await Game.updateOne(
        { _id: game._id },
        { $addToSet: { players: user.id } }
      );

      pubsub.emit(GAME_UPDATED, { gameId: game._id.toString() });

      return game.players.length + 1;
    },

    startGame: async (_p, { gameId }, ctx) => {
      const user = requireAuth(ctx);
      const g = await Game.findById(gameId);
      if (!g) throw new GraphQLError("Game not found");

      if (g.status !== "WAITING")
        throw new GraphQLError("Game already started");
      if (g.createdBy._id.toString() !== user.id)
        throw new GraphQLError("Only host can start", {
          extensions: { code: "FORBIDDEN" },
        });

      if (g.players.length < 2)
        throw new GraphQLError("Need at least 2 players");

      // players become usernames in your domain model:
      const users = await User.find({ _id: { $in: g.players } }).lean();
      const orderedNames = g.players.map((pid) => {
        const u = users.find((x) => x._id.toString() === pid._id.toString());
        return u?.username ?? "Unknown";
      });

      const domainGame = new DomainGame({
        players: orderedNames,
        targetScore: g.targetScore,
        cardsPerPlayer: g.cardsPerPlayer,
      });

      g.gameState = domainGame.toMemento();
      g.status = "IN_PROGRESS";
      await g.save();

      pubsub.emit(GAME_UPDATED, { gameId: g._id.toString() });

      return { ...g.toObject(), id: g._id.toString() };
    },

    playCard: async (_p, { gameId, cardIndex, nextColor }, ctx) => {
      const user = requireAuth(ctx);
      const g = await Game.findById(gameId);
      if (!g) throw new GraphQLError("Game not found");

      if (g.status !== "IN_PROGRESS")
        throw new GraphQLError("Game not in progress");
      if (!g.gameState) throw new GraphQLError("Game state missing");

      // map current user to username (domain uses usernames)
      const me = await User.findById(user.id).lean();
      if (!me) throw new GraphQLError("User not found");

      const domainGame = DomainGame.createFromMemento(g.gameState);
      const round = domainGame.currentRound();
      if (!round) throw new GraphQLError("No active round");

      const myIndex = domainGame.toMemento().players.indexOf(me.username);
      if (myIndex < 0) throw new GraphQLError("You are not part of this game");

      if (round.playerInTurn() !== myIndex) {
        throw new GraphQLError("Not your turn", {
          extensions: { code: "FORBIDDEN" },
        });
      }

      // nextColor is Color enum or null
      const mappedNextColor = nextColor ?? undefined;

      round.play(cardIndex, mappedNextColor);

      g.gameState = domainGame.toMemento();

      // if winner exists -> FINISHED
      if (domainGame.winner() !== undefined) {
        g.status = "FINISHED";
      }

      await g.save();
      pubsub.emit(GAME_UPDATED, { gameId: g._id.toString() });

      return { ...g.toObject(), id: g._id.toString() };
    },

    drawCard: async (_p, { gameId }, ctx) => {
      const user = requireAuth(ctx);
      const g = await Game.findById(gameId);
      if (!g) throw new GraphQLError("Game not found");

      if (g.status !== "IN_PROGRESS")
        throw new GraphQLError("Game not in progress");
      if (!g.gameState) throw new GraphQLError("Game state missing");

      const me = await User.findById(user.id).lean();
      if (!me) throw new GraphQLError("User not found");

      const domainGame = DomainGame.createFromMemento(g.gameState);
      const round = domainGame.currentRound();
      if (!round) throw new GraphQLError("No active round");

      const myIndex = domainGame.toMemento().players.indexOf(me.username);
      if (myIndex < 0) throw new GraphQLError("You are not part of this game");

      if (round.playerInTurn() !== myIndex) {
        throw new GraphQLError("Not your turn", {
          extensions: { code: "FORBIDDEN" },
        });
      }

      round.draw();

      g.gameState = domainGame.toMemento();
      if (domainGame.winner() !== undefined) g.status = "FINISHED";

      await g.save();
      pubsub.emit(GAME_UPDATED, { gameId: g._id.toString() });

      return { ...g.toObject(), id: g._id.toString() };
    },
  },

  Subscription: {
    gameUpdated: {
      subscribe: async (_p, { gameId }) => {
        const iterator = (async function* () {
          const handler = (payload: any) => {
            if (payload.gameId === gameId) {
              queue.push(payload);
              notify?.();
            }
          };

          const queue: any[] = [];
          let notify: (() => void) | null = null;

          pubsub.on(GAME_UPDATED, handler);

          try {
            while (true) {
              if (queue.length === 0) {
                await new Promise<void>((r) => (notify = r));
                notify = null;
              }
              yield queue.shift();
            }
          } finally {
            pubsub.off(GAME_UPDATED, handler);
          }
        })();

        return iterator;
      },
      resolve: async (_payload: any, { gameId }: any) => {
        const g = await Game.findById(gameId).lean();
        if (!g) throw new GraphQLError("Game not found");
        return { ...g, id: g._id.toString() };
      },
    },
  },
};

const schema = makeExecutableSchema({ typeDefs, resolvers });

async function main() {
  await connectToDB(
    "mongodb+srv://sebastianoerndrup_db_user:QqMd6ADeSPx0DSAv@uno-db.zcbtce6.mongodb.net/"
  );

  const app = express();
  const httpServer = http.createServer(app);

  const wsServer = new WebSocketServer({
    server: httpServer,
    path: "/graphql",
  });

  const wsCleanup = useServer(
    {
      schema,
      context: async (ctx) => {
        const token =
          (ctx.connectionParams?.Authorization as string | undefined) ??
          (ctx.connectionParams?.authorization as string | undefined);

        return buildContext({ req: { headers: { authorization: token } } });
      },
    },
    wsServer
  );

  const apollo = new ApolloServer({
    schema,
    plugins: [
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await wsCleanup.dispose();
            },
          };
        },
      },
    ],
  });

  await apollo.start();

  app.use(
    "/graphql",
    cors(),
    bodyParser.json(),
    expressMiddleware(apollo, {
      context: async ({ req }) => buildContext({ req }),
    })
  );

  httpServer.listen(4000, () => {
    console.log("🚀 Server ready at http://localhost:4000/graphql");
    console.log("🔌 WS ready at ws://localhost:4000/graphql");
  });

  process.on("SIGINT", async () => {
    await mongoose.disconnect();
    process.exit(0);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
