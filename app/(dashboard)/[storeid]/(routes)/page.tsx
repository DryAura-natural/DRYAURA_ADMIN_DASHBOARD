import { Heading } from "@/components/heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Overview } from "@/components/ui/chart/overview";
import { UserDevice } from "@/components/ui/chart/userDevice";
import { Visiter } from "@/components/ui/chart/visiter";
import prismadb from "@/lib/prismadb";
import { formatter } from "@/lib/utils";
import { Separator } from "@radix-ui/react-dropdown-menu";
import { CreditCard, IndianRupee, Package } from "lucide-react";

interface DashboardPageProps {
  params: { storeid: string };
}

const DashboardPage: React.FC<DashboardPageProps> = async ({ params }) => {
  // const store = await prismadb.store.findFirst({
  //       where:{
  //             id: params.storeid
  //       }
  // })
  const totalRevenue = () => {};
  const saleCount = () => {};
  const stockCount = () => {};

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-2 p-8 pt-6">
        <Heading title="Dashboard" description="Overview of your store" />
        <Separator />

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 ">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-r">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatter.format(10000)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-r">
              <CardTitle className="text-sm font-medium">Sales</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+100</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-r">
              <CardTitle className="text-sm font-medium">
                Product in Stock
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">15</div>
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-col sm:flex-row">
        <Card className=" cursor-pointer sm:w-9/12 w-full">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <Overview/>
          </CardContent>
          
        </Card>
        <Card className=" cursor-pointer  flex flex-col items-center justify-between">
          <CardHeader>
            <CardTitle>Visiter</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <Visiter/>
          </CardContent>
          <CardHeader>
            <CardTitle>User Device</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <UserDevice/>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
};
export default DashboardPage;
