import { Client, Storage, ID } from "appwrite";

const client = new Client();

client
  .setEndpoint("https://cloud.appwrite.io/v1") // Change if self-hosting Appwrite
  .setProject("67a96cd2001e32766970"); // Replace with your actual Project ID

export const storage = new Storage(client);

// Helper functions for ID generation
export const generateUniqueId = () => ID.unique();
export const createCustomId = (prefix: string) => ID.custom(`${prefix}_${Date.now()}`);

export { ID };
