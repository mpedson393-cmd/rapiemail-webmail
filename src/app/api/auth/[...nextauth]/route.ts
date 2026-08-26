import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || "supersecret12345_rapiemail_enterprise_key_2026",
  session: { 
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias de sessão persistente contínua
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" ? `__Secure-next-auth.session-token` : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === "production"
      }
    }
  },
  useSecureCookies: process.env.NODE_ENV === "production",
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        const cleanEmail = credentials.email.trim().toLowerCase();
        const rawPassword = credentials.password;

        // Função de Execução Resiliente para Autenticação Supabase
        const fetchUserWithRetry = async (retries = 3): Promise<any> => {
          try {
            return await prisma.user.findFirst({
              where: {
                email: { equals: cleanEmail, mode: 'insensitive' }
              }
            });
          } catch (err) {
            if (retries > 0) {
              console.warn(`[NextAuth DB Retry] Reconectar ao Supabase... (${retries})`);
              await new Promise(res => setTimeout(res, 800));
              return fetchUserWithRetry(retries - 1);
            }
            console.error("NextAuth DB Fetch Error:", err);
            return null;
          }
        };

        const user = await fetchUserWithRetry();
        if (!user) {
          console.warn(`[NextAuth] Utilizador não encontrado para email: ${cleanEmail}`);
          return null;
        }

        // Testar palavra-passe bruta e com trim
        let isValid = await bcrypt.compare(rawPassword, user.password);
        if (!isValid && rawPassword !== rawPassword.trim()) {
          isValid = await bcrypt.compare(rawPassword.trim(), user.password);
        }

        if (!isValid) {
          console.warn(`[NextAuth] Palavra-passe incorreta para email: ${cleanEmail}`);
          return null;
        }

        return { 
          id: user.id, 
          email: user.email, 
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Utilizador',
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.name = token.name as string;
        session.user.email = token.email as string;
      }
      return session;
    }
  },
  pages: {
    signIn: "/auth/login",
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
