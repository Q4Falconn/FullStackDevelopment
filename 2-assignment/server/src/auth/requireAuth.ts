import { GraphQLError } from "graphql";

export function requireAuth(ctx: {
  currentUser: { id: string; username: string } | null;
}) {
  if (!ctx.currentUser) {
    throw new GraphQLError("Not authenticated", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }

  return ctx.currentUser;
}
