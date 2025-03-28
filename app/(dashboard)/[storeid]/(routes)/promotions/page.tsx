import { PromoCodesClient } from "./components/client";
import prismadb from "@/lib/prismadb";
import { PromoCodeColumn } from "./components/columns";
import { format, isValid } from "date-fns";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const PromoCodesPage = async ({ params }: { params: { storeId: string } }) => {
  const { userId } = await auth();

  if (!userId) redirect("/sign-in");

  try {
    const store = await prismadb.store.findFirst({
      where: {
        id: params.storeId,
        userId,
      },
    });

    if (!store) redirect("/");
    const promoCodes = await prismadb.promoCode.findMany({
      where: { storeId: params.storeId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        code: true,
        type: true,
        discount: true,
        isActive: true,
        maxUses: true,
        maxUsesPerUser: true,
        usedCount: true,
        startDate: true,
        endDate: true,
        createdAt: true,
      },
    });

    const formattedPromoCodes: PromoCodeColumn[] = promoCodes.map((item) => ({
      id: item.id,
      code: item.code,
      type: item.type,
      discount: `${item.discount}${item.type === "PERCENTAGE" ? "%" : ""}`,
      isActive: item.isActive ? "Active" : "Inactive",
      maxUses: item.maxUses ?? 0,
      maxUsesPerUser: item.maxUsesPerUser ?? 0,
      usedCount: item.usedCount,
      startDate: isValid(item.startDate)
        ? format(item.startDate, "MMM dd, yyyy")
        : "Invalid date",
      endDate: isValid(item.endDate)
        ? format(item.endDate, "MMM dd, yyyy")
        : "Invalid date",
      createdAt: isValid(item.createdAt)
        ? format(item.createdAt, "MMM dd, yyyy")
        : "Invalid date",
    }));

    return (
      <div className="flex-col">
        <div className="flex-1 space-y-4 p-8 pt-6">
          <PromoCodesClient data={formattedPromoCodes} />
        </div>
      </div>
    );
  } catch (error) {
    console.error("[PROMO_CODES_PAGE_ERROR]", error);
    return (
      <div className="flex-col">
        <div className="flex-1 space-y-4 p-8 pt-6">
          <div className="text-red-500 text-center p-4">
            Could not load promo codes. Please refresh the page or try again
            later.
          </div>
        </div>
      </div>
    );
  }
};

export default PromoCodesPage;
