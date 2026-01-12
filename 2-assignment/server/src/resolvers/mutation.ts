import { GraphQLError } from "graphql";
import { User } from "../db-models/user.js";
import { createPasswordHash, verifyPassword } from "../auth/password.js";
import { generateToken } from "../auth/jwt.js";
import { GAME_UPDATED, pubsub } from "../pubsub.js";
import { requireAuth } from "../auth/requireAuth.js";
import { Game } from "../db-models/game.js";
import { Game as DomainGame } from "../models/game.js";

const mutationResolver = {
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
};

export default mutationResolver;
