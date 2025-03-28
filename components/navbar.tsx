import { UserButton } from "@clerk/nextjs";
import { MainNav } from "@/components/main-nav";
import StoreSwitcher from "@/components/store-switcher";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prismadb from "@/lib/prismadb";
import { currentUser } from "@clerk/nextjs/server";

const Navbar = async () => {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

    const stores = await prismadb.store.findMany({
    // where: {
    //     userId: userId || undefined  // Fallback to undefined if userId is null
    //   },
    //   take: 10  // Limit to prevent potential performance issues
    });

    // Check if stores exist
    if (!stores || stores.length === 0) {
      console.warn(`No stores found for user: ${userId}`);
      redirect("/");
    }

    return (
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <div className="flex justify-between lg:justify-start w-full">
            <StoreSwitcher items={stores} />

            {/* Main Navigation */}
            <MainNav className="mr-5" />
          </div>

          {/* User Section */}
          <div className="ml-auto flex items-center space-x-4">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </div>
    );
};

export default Navbar;
