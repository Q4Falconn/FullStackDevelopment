import { validateToken } from "./jwt.js";
import { User } from "../models/user.js";

function getBearerToken(authorization: string | undefined): string | null {
  if (!authorization) return null;
  const [type, token] = authorization.split(" ");
  if (type?.toLowerCase() !== "bearer" || !token) return null;
  return token.trim();
}

export async function buildContext({
  req,
}: {
  req: { headers: { authorization?: string } };
}) {
  const token = getBearerToken(req.headers.authorization);

  if (!token) return { currentUser: null };

  try {
    const payload = validateToken(token); // { sub, username, iat, exp }
    const userDoc = await User.findById(payload.sub).lean();

    if (!userDoc) return { currentUser: null };

    return {
      currentUser: {
        id: userDoc._id.toString(),
        username: userDoc.username,
      },
    };
  } catch {
    // invalid/expired token => treat as not logged in
    return { currentUser: null };
  }
}
