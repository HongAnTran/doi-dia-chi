import { ModeToggle } from "@/components/mode-toggle";
import { GoogleSignInButton } from "@/components/google-signIn-button";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const user = await prisma.user.findUnique({
    where: {
      id: session?.user?.id,
    },
  });

  const accounts = await prisma.account.findMany({
    where: {
      userId: session?.user?.id,
    },
  });
  console.log(accounts);

  return (
    <div>
      <h1>Hello World</h1>
      <ModeToggle />
      <GoogleSignInButton />
    </div>
  );
}
