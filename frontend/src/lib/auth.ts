// NextAuth configuration — GitHub OAuth with JWT session strategy
import type { NextAuthOptions, Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import GitHubProvider from 'next-auth/providers/github';
import { getServerSession } from 'next-auth';

// Extend NextAuth types to include our custom fields
declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      githubUsername?: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    githubUsername?: string;
    userId?: string;
  }
}

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'read:user',
        },
      },
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: 'jwt',
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'github' && profile) {
        try {
          // Call backend to create/upsert profile
          const githubProfile = profile as { login?: string };
          const response = await fetch(`${BACKEND_URL}/api/profile/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              githubUsername: githubProfile.login || user.name,
            }),
          });

          if (!response.ok) {
            const data = await response.json();
            // If it's a reserved subdomain, we still allow sign-in
            // but the user will need to pick a custom username later
            if (response.status === 409) {
              console.warn('Reserved subdomain conflict:', data);
              // Still allow sign-in — user picks username in onboarding
              return true;
            }
            console.error('Profile creation failed:', data);
          }
        } catch (error) {
          console.error('Failed to create profile on backend:', error);
          // Don't block sign-in if backend is temporarily unavailable
        }
      }
      return true;
    },

    async jwt({ token, account, profile }) {
      // On initial sign-in, persist the access token and GitHub username
      if (account && profile) {
        token.accessToken = account.access_token;
        const githubProfile = profile as { login?: string };
        token.githubUsername = githubProfile.login || undefined;
        token.userId = account.providerAccountId;
      }
      return token;
    },

    async session({ session, token }: { session: Session; token: JWT }) {
      // Expose accessToken and GitHub username to the client session
      session.accessToken = token.accessToken;
      session.user.id = token.userId || token.sub || '';
      session.user.githubUsername = token.githubUsername;
      return session;
    },
  },

  pages: {
    signIn: '/', // Redirect unauthenticated users to the landing page
  },
};

// Server-side session helpers
export async function getSession() {
  return getServerSession(authOptions);
}

export async function getSessionToken(): Promise<string | null> {
  const session = await getSession();
  return session?.accessToken || null;
}

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    throw new Error('Authentication required');
  }
  return session;
}
