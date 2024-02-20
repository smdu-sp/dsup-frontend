import { jwtDecode } from "jwt-decode";
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        login: { label: "Login", type: "text" },
        senha: {  label: "Senha", type: "password" }
      },
      async authorize(credentials, req) {
        if (credentials?.login && credentials?.senha){
          const { login, senha } = credentials;
          const response = await fetch(`${process.env.API_URL}login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ login, senha })
          });
          const usuario = response.json();
          if (usuario && response.ok) return usuario;
        }
        return null;
      }
    })
  ],
  pages: {
    signIn: "/login"
  },
  callbacks: {
    async jwt({ token, user }) {
      user && (token.user = user);
      return token;
    },
    async session({ session, token }) {
      session = token.user as any;
      session.usuario = jwtDecode(session.access_token);
      return session;
    }
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };