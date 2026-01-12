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
import { makeExecutableSchema } from "@graphql-tools/schema";
import { WebSocketServer } from "ws";
import express from "express";
import http from "node:http";
import { useServer } from "graphql-ws/use/ws";
import cors from "cors";
import bodyParser from "body-parser";
import { expressMiddleware } from "@as-integrations/express5";
import { GraphQLJSON } from "graphql-scalars";
import queryResolver from "./resolvers/query.js";
import gameResolver from "./resolvers/game.js";
import mutationResolver from "./resolvers/mutation.js";
import subscriptionResolver from "./resolvers/subscription.js";

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
  ...queryResolver,
  ...gameResolver,
  ...mutationResolver,
  ...subscriptionResolver,
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
