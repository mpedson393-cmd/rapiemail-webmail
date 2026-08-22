import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { InboxDashboard, EmailItem } from '@/components/InboxDashboard';

export const dynamic = 'force-dynamic';

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

  let formattedEmails: EmailItem[] = [];

  try {
    // Fetch emails safely from Supabase PostgreSQL
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

    formattedEmails = dbEmails.map(e => ({
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
  } catch (err) {
    console.error("Prisma Inbox Fetch Warning (Fallback gracefully to empty Inbox):", err);
  }

  return (
    <InboxDashboard 
      user={{ name, email, initials }}
      initialEmails={formattedEmails}
      currentFolder={folder}
    />
  );
}
