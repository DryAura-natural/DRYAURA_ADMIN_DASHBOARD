import React from 'react'
import { SubscriberClient } from './components/client';
import prismadb from '@/lib/prismadb';
import { SubscriberColumn } from './components/columns';
import { format, isValid } from "date-fns"

const SubscribePage = async ({params}: {params: {storeid: string}}) => {
    const subscribers = await prismadb.subscribe.findMany({
      where: {
        storeId: params.storeid
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  
    const formattedSubscribers: SubscriberColumn[] = subscribers.map((subscriber) => ({
      id: subscriber.id,
      email: subscriber.email,
      name: 'Subscriber', // Default name since model doesn't have a name field
      totalOrders: 0, // Cannot calculate without additional relationship
      isActive: true, // Default to true since model doesn't have an isActive field
      createdAt: format(new Date(subscriber.createdAt), "MMM do, yyyy"),
      lastOrderDate: 'N/A' // Cannot calculate without additional relationship
    }));
  
    // Calculate subscriber statistics
    const subscriberStats = {
      total: subscribers.length,
      active: subscribers.length, // All are considered active
      inactive: 0,
      recentSubscribers: formattedSubscribers.slice(0, 5)
    };
  
    return (
      <div className='flex-col'>
        <div className='flex-1 space-y-4 p-8 pt-6'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
            <div className='bg-white shadow rounded-lg p-6'>
              <h3 className='text-lg font-semibold text-gray-800 mb-2'>
                Total Subscribers
              </h3>
              <p className='text-3xl font-bold text-[#3D1D1D]'>
                {subscriberStats.total}
              </p>
            </div>
            <div className='bg-white shadow rounded-lg p-6'>
              <h3 className='text-lg font-semibold text-gray-800 mb-2'>
                Active Subscribers
              </h3>
              <p className='text-3xl font-bold text-green-600'>
                {subscriberStats.active}
              </p>
            </div>
            <div className='bg-white shadow rounded-lg p-6'>
              <h3 className='text-lg font-semibold text-gray-800 mb-2'>
                Inactive Subscribers
              </h3>
              <p className='text-3xl font-bold text-red-600'>
                {subscriberStats.inactive}
              </p>
            </div>
          </div>
  
          <SubscriberClient 
            data={formattedSubscribers} 
            stats={subscriberStats}
          />
        </div>
      </div>
    )
  }
  
  export default SubscribePage;