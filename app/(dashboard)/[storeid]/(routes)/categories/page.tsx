import React from 'react'
import { CategoryClient } from './components/client';
import prismadb from '@/lib/prismadb';
import { CategoryColumn } from './components/columns';
import {format, isValid} from "date-fns"

 const CategoriesPage = async({params}:{params:{storeid:string}}) => {
  const categories = await prismadb.category.findMany({
    where:{
      storeId:params.storeid
    },
    include:{
      billboard:true,
    },
    orderBy:{
      createdAt:'desc'
    }
  }) 

  const formattedCategories: CategoryColumn[] = categories.map((item) => ({
    id: item.id,
    name: item.name,
    billboardLabel:item.billboard.label,
    createdAt: isValid(new Date(item.createdAt))
      ? format(new Date(item.createdAt), "MMM do yyyy")
      : "Unknown", // Fallback value for invalid dates
  }));
  return (
    <div className='flex-col'>
      <div className='flex-1 space-y-4 p-8 pt-6'>
        <CategoryClient data = {formattedCategories}/>
      </div>
    </div>
  )
}
export default CategoriesPage;