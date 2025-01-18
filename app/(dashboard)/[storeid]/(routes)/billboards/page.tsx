// @ts-nocheck
import React from 'react'
import { BillboardClient } from './components/client';
import prismadb from '@/lib/prismadb';
import { BillboardColumn } from './components/columns';
import {format, isValid} from "date-fns"

 const BillboardsPage = async({params}:{params:{storeid:string}}) => {
  const billboard = await prismadb.billboard.findMany({
    where:{
      storeId:params.storeid
    },
    orderBy:{
      createdAt:'desc'
    }
  }) 

  const formattedBillboards: BillboardColumn[] = billboard.map((item) => ({
    id: item.id,
    label: item.label,
    description: item.description,
    createdAt: isValid(new Date(item.createdAt))
      ? format(new Date(item.createdAt), "MMM do yyyy")
      : "Unknown", // Fallback value for invalid dates
  }));
  return (
    <div className='flex-col'>
      <div className='flex-1 space-y-4 p-8 pt-6'>
        <BillboardClient data = {formattedBillboards}/>
      </div>
    </div>
  )
}
export default BillboardsPage;