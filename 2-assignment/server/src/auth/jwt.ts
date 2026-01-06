import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const EXPIRES_IN = "7d";

export function generateToken(user: { id: string; username: string }) {
  return jwt.sign({ sub: user.id, username: user.username }, JWT_SECRET, {
    expiresIn: EXPIRES_IN,
  });
}

export function validateToken(token: string) {
  return jwt.verify(token, JWT_SECRET);
}
