import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getUserByCredentials } from '@/lib/google-sheets';

export const authOptions: NextAuthOptions = {
    secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-key-12345',
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                username: { label: "User", type: "text", placeholder: "jsmith" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
               console.log("LOGIN TEST:", credentials);

    return {
        id: "1",
        name: "test",
        email: "test@test.com"
    };
            }
        })
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
                token.cargo = (user as any).cargo;
                token.dni = (user as any).id;
                token.supervisor = (user as any).supervisor;
                token.phone = (user as any).phone;
                token.sessionToken = (user as any).sessionToken;
                token.picture = (user as any).image;
            }
            if (trigger === "update" && session?.image) {
                token.picture = session.image;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id;
                (session.user as any).role = token.role;
                (session.user as any).cargo = token.cargo;
                (session.user as any).dni = token.dni;
                (session.user as any).supervisor = token.supervisor;
                (session.user as any).phone = token.phone;
                (session.user as any).sessionToken = token.sessionToken;
                session.user.image = token.picture as string;
            }
            return session;
        }
    },
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
    }
};
