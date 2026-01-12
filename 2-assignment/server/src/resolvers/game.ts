import mongoose from "mongoose";
import { User } from "../db-models/user.js";

const gameResolver = {
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
};

export default gameResolver;
