import { GraphQLError } from "graphql";
import { Game } from "../db-models/game.js";
import { GAME_UPDATED, pubsub } from "../pubsub.js";

const subscriptionResolver = {
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

export default subscriptionResolver;
