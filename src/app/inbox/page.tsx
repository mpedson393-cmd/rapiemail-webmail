import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import { InboxDashboard, EmailItem } from '@/components/InboxDashboard';

const prisma = new PrismaClient();

export default async function InboxPage({ searchParams }: { searchParams: Promise<{ folder?: string }> }) {
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

  const resolvedParams = await searchParams;
  const folder = resolvedParams.folder || 'INBOX';

  // Fetch all emails related to user
  const dbEmails = await prisma.email.findMany({
    where: {
      OR: [
        { to: email },
        { from: email }
      ]
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  const formattedEmails: EmailItem[] = dbEmails.map(e => ({
    id: e.id,
    from: e.from,
    to: e.to,
    subject: e.subject,
    body: e.body,
    folder: e.folder,
    read: e.read,
    createdAt: e.createdAt.toISOString(),
    trackingId: e.trackingId || undefined,
    isOpened: e.isOpened,
    openedAt: e.openedAt ? e.openedAt.toISOString() : undefined,
    openCount: e.openCount || 0,
    userAgent: e.userAgent || undefined
  }));

  return (
    <InboxDashboard 
      user={{ name, email, initials }}
      initialEmails={formattedEmails}
      currentFolder={folder}
    />
  );
}
