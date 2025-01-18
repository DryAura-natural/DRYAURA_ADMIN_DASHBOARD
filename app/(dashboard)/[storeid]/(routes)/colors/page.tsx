import React from 'react'
import {ColorsClient } from './components/client';
import prismadb from '@/lib/prismadb';
import { ColorColumn, } from './components/columns';
import {format, isValid} from "date-fns"

 const ColorsPage = async({params}:{params:{storeid:string}}) => {
  const Colors = await prismadb.color.findMany({
    where:{
      storeId:params.storeid
    },
    orderBy:{
      createdAt:'desc'
    }
  }) 

  const formattedColors: ColorColumn[] = Colors.map((item) => ({
    id: item.id,
    name: item.name,
    value:item.value,
    createdAt: isValid(new Date(item.createdAt))
      ? format(new Date(item.createdAt), "MMM do yyyy")
      : "Unknown", // Fallback value for invalid dates
  }));
  return (
    <div className='flex-col'>
      <div className='flex-1 space-y-4 p-8 pt-6'>
        <ColorsClient data = {formattedColors}/>
      </div>
    </div>
  )
}
export default ColorsPage;