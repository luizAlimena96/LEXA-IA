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
            allowedTabs?: string[];
        };
    }

    interface User {
        id: string;
        email: string;
        name: string;
        role: string;
        organizationId: string | null;
        organizationName: string | null;
        allowedTabs?: string[];
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string;
        role: string;
        organizationId: string | null;
        organizationName: string | null;
        allowedTabs?: string[];
    }
}

// Validate critical environment variables
const requiredEnvVars = ['NEXTAUTH_SECRET', 'DATABASE_URL'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    throw new Error(
        `Missing required environment variables: ${missingVars.join(', ')}. ` +
        `Please check your .env file.`
    );
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
                    allowedTabs: (user.allowedTabs as string[]) || [],
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
                token.allowedTabs = user.allowedTabs;
            } else if (token.id) {
                // Refresh user data from database to get latest organizationId
                const dbUser = await prisma.user.findUnique({
                    where: { id: token.id as string },
                    include: { organization: true },
                });

                if (dbUser) {
                    token.role = dbUser.role;
                    token.organizationId = dbUser.organizationId;
                    token.organizationName = dbUser.organization?.name || null;
                    token.allowedTabs = (dbUser.allowedTabs as string[]) || [];
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id;
                session.user.role = token.role;
                session.user.organizationId = token.organizationId;
                session.user.organizationName = token.organizationName;
                session.user.allowedTabs = token.allowedTabs;
            }
            return session;
        },
        async redirect({ url, baseUrl }) {
            // Get dynamic origin from environment or use current request origin
            const origin = process.env.NEXTAUTH_URL || baseUrl;

            // Permite redirecionamentos para URLs relativas
            if (url.startsWith("/")) return `${origin}${url}`;
            // Permite redirecionamentos para o mesmo domínio
            else if (new URL(url).origin === origin) return url;
            // Caso contrário, redireciona para a página inicial
            return origin;
        },
    },
    pages: {
        signIn: '/login',
        error: '/login',
    },
    session: {
        strategy: 'jwt',
        maxAge: 90 * 24 * 60 * 60, // 90 days (3 months)
        updateAge: 24 * 60 * 60, // Update session every 24 hours
    },
    jwt: {
        maxAge: 90 * 24 * 60 * 60, // 90 days - same as session
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
