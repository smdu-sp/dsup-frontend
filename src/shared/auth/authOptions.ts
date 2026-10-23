import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/shared/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        login: { label: "Login", type: "text" },
        senha: { label: "Senha", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.login || !credentials?.senha) return null;
        const { login, senha } = credentials;

        const usuario = await prisma.usuario.findUnique({ where: { login } });
        if (!usuario) return null;
        if (usuario.status !== 1) return null;

        if (process.env.ENVIRONMENT !== "local") {
          const auth_response = await fetch(`${process.env.SMUL_AUTH_URL}ldap/autenticar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ login, senha })
          });
          if (auth_response.status !== 200) return null;
        }

        return { id: usuario.id };
      }
    })
  ],
  pages: {
    signIn: "/login"
  },
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async session({ session, token }) {
      session.usuario = { id: token.sub as string };
      return session;
    }
  }
};
