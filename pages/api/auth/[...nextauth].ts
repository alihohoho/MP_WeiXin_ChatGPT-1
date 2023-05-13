//[...nextauth].ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcrypt";
import User from "db/models/user";
import SystemLog from "components/systemLog";

export default NextAuth({
  providers: [
    CredentialsProvider({
      credentials: {},
      async authorize(credentials, _) {
        const { username, password } = credentials as {
          username: string;
          password: string;
        };
        if (!username || !password) {
          SystemLog.Log('error', 'Missing username or password');
          throw Error("Missing username or password");
        }
        try {
          const user = await User.findOne({
            where: {
              username,
            },
          });
          // if user doesn't exist or password doesn't match
          if (!user || !(await compare(password, user.password))) {
            SystemLog.Log('error', 'Invalid username or password');
            throw Error("Invalid username or password");
          }
          SystemLog.Log('info', `Successfully logged in as ${username}`);
          return { id: user.id, name: user.name };
        } catch (error: any) {
          SystemLog.Log('error', error.message);
          throw Error(error.message);
        }
      },
    }),
  ],
  callbacks: {
    async redirect(params) {
      const { url } = params;
      const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    }
  },
  session: { strategy: "jwt" },
});