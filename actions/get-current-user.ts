
import { currentUser } from "@clerk/nextjs/server";
export const getCurrentUser = async () => {
  const clerkUser = await currentUser();
  return clerkUser;
};
