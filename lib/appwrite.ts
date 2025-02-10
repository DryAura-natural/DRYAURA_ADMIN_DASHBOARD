// import { Client, Storage, ID } from "appwrite";

// const client = new Client();

// client
//   .setEndpoint("https://cloud.appwrite.io/v1") // Replace with your Appwrite endpoint
//   .setProject("677bf12a000e83aee344"); // Replace with your Appwrite Project ID

// const storage = new Storage(client);

// export { storage, ID };


import { Client, Storage, ID } from "appwrite";

const client = new Client();

client
  .setEndpoint("https://cloud.appwrite.io/v1") // Change if self-hosting Appwrite
  .setProject("67a96cd2001e32766970"); // Replace with your actual Project ID

export const storage = new Storage(client);
export { ID };
