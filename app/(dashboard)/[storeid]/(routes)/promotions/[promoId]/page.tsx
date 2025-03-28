import prismadb from "@/lib/prismadb";
import { PromoCodeForm } from "./components/promotion-form";

const PromoCodePage = async ({ 
  params 
}: { 
  params: { storeid: string; promoId: string } 
}) => {
  const promoCode = await prismadb.promoCode.findUnique({
    where: {
      id: params.promoId,
      storeId: params.storeid
    }
  });

  // if (!promoCode) {
  //   return (
  //     <div className="flex-col">
  //       <div className="flex-1 space-y-4 p-8 pt-6">
  //         <div className="text-center text-red-500">
  //           Promo code not found
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <PromoCodeForm initialData={promoCode} />
      </div>
    </div>
  );
};

export default PromoCodePage;