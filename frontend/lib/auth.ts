import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { timingSafeEqual } from 'crypto';
import { getUserByEmail } from './db';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const adminEmail = process.env.ADMIN_EMAIL || '';
        const adminPassword = process.env.ADMIN_PASSWORD || '';

        // 管理者ログイン（.envで設定した専用アカウント）— タイミング攻撃対策
        const emailMatch = credentials.email === adminEmail;
        const passBuffer = Buffer.from(credentials.password);
        const adminBuffer = Buffer.from(adminPassword);
        const passwordMatch = adminPassword.length > 0 &&
          passBuffer.length === adminBuffer.length &&
          timingSafeEqual(passBuffer, adminBuffer);
        if (adminEmail && emailMatch && passwordMatch) {
          return {
            id: 'admin',
            email: adminEmail,
            name: '管理者',
            isAdmin: true,
          } as any;
        }

        let user;
        try {
          user = await getUserByEmail(credentials.email);
        } catch (e) {
          console.error('[auth] DB lookup failed:', e);
          return null;
        }
        if (!user) return null;
        if (!user.active) return null; // 無効化されたアカウント

        const valid = await bcrypt.compare(credentials.password, user.password_hash);
        if (!valid) return null;

        return { id: String(user.id), email: user.email, name: user.name, isAdmin: false } as any;
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.isAdmin = (user as any).isAdmin ?? false;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).isAdmin = token.isAdmin ?? false;
      }
      return session;
    },
  },
};
