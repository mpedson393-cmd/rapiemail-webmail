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
    <SettingsDashboardClient 
      user={{ name, email, initials }}
    />
  );
}
