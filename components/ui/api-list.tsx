"use client"

import { useParams } from "next/navigation";
import {useOrign} from "@/hooks/use-origin"
import { ApiAlert } from "./api-alert";

interface ApiListProps{
      entityName:string;
      entityIdName:string;
}
export const ApiList:React.FC<ApiListProps> = ({entityName,entityIdName}) => {
      const params = useParams();
      const origin = useOrign();
      const baseUrl = `${origin}/api/${params.storeid}`

  return <>
  <ApiAlert title="GET" variant="public" description={`${baseUrl}/${entityName}`}/>
  <ApiAlert title="GET" variant="public" description={`${baseUrl}/${entityName}/{${entityIdName}}`}/>
  <ApiAlert title="POST" variant="admin" description={`${baseUrl}/${entityName}`}/>
  <ApiAlert title="PATCH" variant="admin" description={`${baseUrl}/${entityName}/{${entityIdName}}`}/>
  <ApiAlert title="DELETE" variant="admin" description={`${baseUrl}/${entityName}/{${entityIdName}}`}/>
  </>;
};
