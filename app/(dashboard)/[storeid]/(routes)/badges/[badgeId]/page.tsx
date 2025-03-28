import prismadb from "@/lib/prismadb";
import { BadgeForm } from "./components/badge-form";

const BadgePage = async ({ params }: { params: { storeid: string, badgeId: string } }) => {
  const badge = await prismadb.badge.findUnique({
    where: {
      id: params.badgeId,
      storeId: params.storeid // Important for data security
    }
  });

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <BadgeForm initialData={badge} />
      </div>
    </div>
  );
};

export default BadgePage;