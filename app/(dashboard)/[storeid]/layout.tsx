import Navbar from "@/components/navbar";
import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/get-current-user";
import { Toaster } from "@/components/ui/toaster"

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { storeid: string };
}) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const user = await getCurrentUser();
  const isAdmin = user?.publicMetadata?.role === "admin";

  if (!isAdmin) {
    redirect(`https://dryaura.in`);
  }

  const store = await prismadb.store.findFirst({
    where: {
      id: params.storeid,
      userId,
    },
  });

  if (!store) {
    redirect("/");
  }

  return (
    <div>
      <Navbar />
      <Toaster />
      {children}
    </div>
  );
}
