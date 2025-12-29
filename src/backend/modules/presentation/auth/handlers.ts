import NextAuth, { type NextAuthOptions } from 'next-auth';
import Google from 'next-auth/providers/google';
import { AppConfig } from '@/config/AppConfig';
import { prismaClient } from '@/backend/shared/infrastructure/prisma';

export const authOptions: NextAuthOptions = {
  providers: [
    Google({
      clientId: AppConfig.google.clientId,
      clientSecret: AppConfig.google.clientSecret,
    }),
  ],
  session: { strategy: 'jwt' },
  secret: AppConfig.auth.secret,
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async signIn({ user }: { user?: { email?: string | null; name?: string | null } }) {
      if (!user?.email) return false;
      await prismaClient.user.upsert({
        where: { email: user.email },
        update: { name: user.name ?? null },
        create: {
          email: user.email,
          name: user.name ?? null,
        },
      });
      return true;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };




