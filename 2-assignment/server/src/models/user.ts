import { HydratedDocument, model, Schema } from "mongoose";

export interface IUser {
  id: string;
  username: string;
  passwordHash: string;
  passwordSalt: string;
}

const userSchema = new Schema<IUser>({
  username: { type: String, required: true },
  passwordHash: { type: String, required: true },
  passwordSalt: { type: String, required: true },
});

export type UserDocument = HydratedDocument<IUser>

export const User = model<IUser>("User", userSchema)