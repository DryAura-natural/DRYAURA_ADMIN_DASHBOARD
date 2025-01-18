// @ts-nocheck
import prismadb from "@/lib/prismadb";
import { BillboardForm } from "./components/billboard-form";

const BillboardPage = async ({ params }: { params: { billboardId: string } }) => {
  // Ensure that the `billboardId` is a valid string and passed correctly
  const billboard = await prismadb.billboard.findUnique({
    where: {
      id: params.billboardId, // Access the `billboardId` from params
    },
  });

  if (!billboard) {
    return <div>Billboard not found</div>;
  }

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <BillboardForm initialData={billboard} />
      </div>
    </div>
  );
};

export default BillboardPage;
