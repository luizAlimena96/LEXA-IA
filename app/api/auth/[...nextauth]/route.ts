import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/app/lib/prisma';
import bcrypt from 'bcryptjs';

// Extend NextAuth types
declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
            email: string;
            name: string;
            role: string;
            organizationId: string | null;
            organizationName: string | null;
        };
    }

    interface User {
        id: string;
        email: string;
        name: string;
        role: string;
        organizationId: string | null;
        organizationName: string | null;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string;
        role: string;
        organizationId: string | null;
        organizationName: string | null;
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Email e senha são obrigatórios');
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                    include: { organization: true },
                });

                if (!user) {
                    throw new Error('Credenciais inválidas');
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                if (!isPasswordValid) {
                    throw new Error('Credenciais inválidas');
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    organizationId: user.organizationId,
                    organizationName: user.organization?.name || null,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.organizationId = user.organizationId;
                token.organizationName = user.organizationName;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id;
                session.user.role = token.role;
                session.user.organizationId = token.organizationId;
                session.user.organizationName = token.organizationName;
            }
            return session;
        },
    },
    pages: {
        signIn: '/login',
        error: '/login',
    },
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
