import { GetServerSideProps } from "next";
import prismadb from "@/lib/prismadb";
import { BillboardForm } from "./components/billboard-form";

// Define the expected types for params
interface BillboardPageProps {
  params: {
    billboardId: string;
  };
}

// You can also define the return type of the function for clarity
const BillboardPage = async ({ params }: BillboardPageProps) => {
  const billboard = await prismadb.billboard.findUnique({
    where: {
      id: params.billboardId,
    },
  });

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <BillboardForm initialData={billboard} />
      </div>
    </div>
  );
};

export default BillboardPage;

// If using dynamic routes, make sure to use getServerSideProps or getStaticProps
export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const { billboardId } = params as { billboardId: string };

  // Fetch your data based on the dynamic route parameter
  const billboard = await prismadb.billboard.findUnique({
    where: {
      id: billboardId,
    },
  });

  return {
    props: {
      params: { billboardId },
      billboard,
    },
  };
};
