import mongoose from "mongoose";

export async function connectToDB( uri: string ) {
    await mongoose.connect(uri)
}