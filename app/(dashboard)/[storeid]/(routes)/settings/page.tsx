import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SettingsForm } from "./components/settings-form";


interface SettingsPagesProps {
  params: { storeid: string };
}

const SettingsPages: React.FC<SettingsPagesProps> = async ({ params }) => {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }
  const store = await prismadb.store.findFirst({
      where:{
            id:params.storeid,
            userId
      }
  })
  if(!store){
      redirect("/")
  }
  console.log(store);
  
  return( 
    <>
   
  <div className="flex-col">

    <div className="flex-1 space-y-4 p-8 pt-6">
      <SettingsForm initialData={store}/>

    </div>
  </div>
  </>)
};
export default SettingsPages;
