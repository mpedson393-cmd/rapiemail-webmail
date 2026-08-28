import webpush from 'web-push';
import { prisma } from './prisma';

export const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BCC2cdUC5qyeJwwL_OwCQYISuI2-tMl9wuhRx_x7jgQ2k77sL1yA0UrurhtF6l33oN7BU2QOEJtF14f4kk6GEIs";
export const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "Xna1FeXJjg-m0RXW31ujCx11muaIpRrogu4gQlgJH_I";
export const VAPID_SUBJECT = "mailto:suporte@rapimoneyit.online";

webpush.setVapidDetails(
  VAPID_SUBJECT,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export interface PushNotificationPayload {
  title: string;
  body: string;
  url?: string;
  emailId?: string;
  icon?: string;
}

export async function sendPushNotificationToUser(userId: string, payload: PushNotificationPayload) {
  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId }
    });

    if (subscriptions.length === 0) {
      return { success: false, sentCount: 0, message: "Nenhuma subscrição push registada para este utilizador." };
    }

    const payloadString = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || (payload.emailId ? `/inbox?id=${payload.emailId}` : '/inbox'),
      emailId: payload.emailId,
      icon: payload.icon || '/favicon.ico',
      badge: '/favicon.ico'
    });

    let sentCount = 0;

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification({
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        }, payloadString);
        sentCount++;
      } catch (err: any) {
        // Se a subscrição expirou ou foi revogada (410 Gone / 404 Not Found), apagar da BD
        if (err.statusCode === 410 || err.statusCode === 404) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
      }
    }

    return { success: true, sentCount };
  } catch (error) {
    console.error("[WebPush Error]:", error);
    return { success: false, error };
  }
}
