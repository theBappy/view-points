import { StreamChat } from "stream-chat";
import { ENV } from "./env.js";
import { StreamClient } from "@stream-io/node-sdk";

const apiKey = ENV.STREAM_API_KEY;
const apiSecret = ENV.STREAM_API_SECRET;

if (!apiKey || !apiSecret) {
  console.error("STREAM_API_KEY or STREAM_API_SECRET is missing in env files.");
}

export const chatClient = StreamChat.getInstance(apiKey, apiSecret); //this is for chat features
export const streamClient = new StreamClient(apiKey, apiSecret); //will be used for the video call

export const upsertStreamUser = async (userData) => {
  try {
    await chatClient.upsertUser(userData);
    console.log("Stream user upsert succeeded:", userData);
  } catch (error) {
    console.error("Error upsert Stream user: ", error);
  }
};
export const deleteStreamUser = async (userId) => {
  try {
    await chatClient.deleteUser(userId);
    console.log("Stream user deleted succeeded:", userId);
  } catch (error) {
    console.error("Error deleting Stream user: ", error);
  }
};
