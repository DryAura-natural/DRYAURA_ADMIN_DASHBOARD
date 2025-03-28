import React from 'react';
import { BadgesClient } from './components/client';
import prismadb from '@/lib/prismadb';
import { BadgeColumn } from './components/columns';
import { format, isValid } from "date-fns";

const BadgePage = async ({ params }: { params: { storeId: string } }) => {
  const badges = await prismadb.badge.findMany({
    where: {
      storeId: params.storeId
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  const formattedBadges: BadgeColumn[] = badges.map((item) => ({
    id: item.id,
    label: item.label,
    color: item.color || 'No color set', // Handle optional color
    createdAt: isValid(new Date(item.createdAt))
      ? format(new Date(item.createdAt), "MMM do yyyy")
      : "Unknown",
  }));

  return (
    <div className='flex-col'>
      <div className='flex-1 space-y-4 p-8 pt-6'>
        <BadgesClient data={formattedBadges} />
      </div>
    </div>
  );
};

export default BadgePage;