import { PrismaClient, Billboard } from "@prisma/client";
import { BillboardForm } from "./components/billboard-form";

const prismadb = new PrismaClient();

interface BillboardPageProps {
  params: {
    billboardId: string;
  };
}

const BillboardPage = async ({ params }: BillboardPageProps) => {
  const billboard = await prismadb.billboard.findUnique({
    where: {
      id: params.billboardId,
    },
  });

  // Null check for the billboard
  if (!billboard) {
    return <div>Billboard not found</div>;
  }

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        {/* Make sure BillboardForm expects a `billboard` type as initialData */}
        <BillboardForm initialData={billboard} />
      </div>
    </div>
  );
};

export default BillboardPage;
