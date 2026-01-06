import crypto from "node:crypto";

const ITERATIONS = 210_000;
const KEYLEN = 32;
const DIGEST = "sha256";

export function createPasswordHash(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST)
    .toString("hex");

  return { salt, hash };
}

export function verifyPassword(
  password: string,
  salt: string,
  expectedHash: string
) {
  const hash = crypto
    .pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST)
    .toString("hex");

  // timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(hash, "hex"),
    Buffer.from(expectedHash, "hex")
  );
}
