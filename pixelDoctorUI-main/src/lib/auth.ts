import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import type { AccountType, Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      username: string;
      role: Role;
      accountType: AccountType;
      hospitalUnitId: string | null;
    };
  }
  interface User {
    id: string;
    username: string;
    role: Role;
    accountType: AccountType;
    hospitalUnitId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    role: Role;
    accountType: AccountType;
    hospitalUnitId: string | null;
  }
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/login", error: "/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "아이디", type: "text" },
        password: { label: "비밀번호", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;
        const user = await prisma.user.findUnique({ where: { username: credentials.username } });
        if (!user || !user.isActive) return null;
        const isValid = await compare(credentials.password, user.passwordHash);
        if (!isValid) return null;
        return {
          id: user.id, name: user.name, username: user.username,
          role: user.role, accountType: user.accountType, hospitalUnitId: user.hospitalUnitId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id; token.username = user.username;
        token.role = user.role; token.accountType = user.accountType;
        token.hospitalUnitId = user.hospitalUnitId;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: token.id, name: token.name ?? "", username: token.username,
        role: token.role, accountType: token.accountType, hospitalUnitId: token.hospitalUnitId,
      };
      return session;
    },
  },
};
