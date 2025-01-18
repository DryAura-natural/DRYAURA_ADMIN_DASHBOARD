import prismadb from "@/lib/prismadb";
import { BillboardForm } from "./components/billboard-form";


interface BillboardPageProps  {
  params: {
    billboardId: string;
  };
}
// @ts-ignore: Ignore type error for dynamic params
const BillboardPage = async ({ params }: BillboardPageProps) => {
  const billboard = await prismadb.billboard.findUnique({
    where: {
      id: params.billboardId,
    },
  });

  // Handle the case if no billboard is found
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
