import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { SettingsDashboardClient } from '@/components/SettingsDashboardClient';

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user?.email) {
    redirect('/auth/login');
  }

  const name = session.user?.name || 'Utilizador';
  const email = session.user?.email;
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <main className="w-full min-h-screen overflow-x-hidden overflow-y-auto overscroll-contain">
      <SettingsDashboardClient 
        user={{ name, email, initials }}
      />
    </main>
  );
}
