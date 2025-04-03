import Navbar from "@/components/navbar";
import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/get-current-user";
import { Toaster } from "@/components/ui/toaster";


export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { storeid: string };
}) {
  const { userId } = await auth();

  if (!userId) {
    return redirect("/sign-in");
  }

  const user = await prismadb.user.findUnique({
    where: { id: userId },
    select: { 
      role: true,
      email: true 
    }
  });

  // Check if user exists and is an admin
  if (!user || user.role !== 'ADMIN') {
    // Server-side toast simulation
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Redirect with a toast message
    return (
      <div>
        <div className="p-4 bg-red-500 text-white">
          Unauthorized Access. Redirecting...
          {/* Trigger client-side toast */}
          <script dangerouslySetInnerHTML={{
            __html: `
              setTimeout(() => {
                window.location.href = 'https://dryaura.in';
              }, 5000);
            `
          }} />
        </div>
      </div>
    );
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
