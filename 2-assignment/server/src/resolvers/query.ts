import { Game } from "../db-models/game.js";
import { User } from "../db-models/user.js";

const queryResolver = {
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
};

export default queryResolver;
