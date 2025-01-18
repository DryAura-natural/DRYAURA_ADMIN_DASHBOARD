import prismadb from "@/lib/prismadb";
import { BillboardForm } from "./components/billboard-form";

export async function getServerSideProps(context: { params: { billboardId: string } }) {
   const { billboardId } = context.params;
   const billboard = await prismadb.billboard.findUnique({
      where: {
         id: billboardId,
      },
   });

   if (!billboard) {
      return {
         notFound: true, // This will return a 404 page if the billboard is not found
      };
   }

   return {
      props: {
         billboard, // Pass the fetched billboard as a prop
      },
   };
}

const BillboardPage = ({ billboard }: { billboard: any }) => {
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
