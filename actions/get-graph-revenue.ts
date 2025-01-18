import prismadb from "@/lib/prismadb"

export const getGraphRevenue = async (storeId:string)=>{
      const paidOrder = await prismadb.order.findMany({
            where:{
                  storeId,
                  isPaid:true,
            }
      });
      return salecount:
}