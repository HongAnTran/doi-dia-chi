"use client";

import { authClient } from "@/lib/auth-client";

export function GoogleSignInButton() {
  async function handleSignIn() {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/",
    });
  }

  return (
    <button
      type="button"
      onClick={handleSignIn}
      className="rounded-md border px-4 py-2"
    >
      Continue with Google
    </button>
  );
}
