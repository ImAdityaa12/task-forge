"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SignupForm } from "@/components/auth/SignupForm";
import { useSession } from "@/lib/auth-client";

export default function SignupPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && session) {
      router.replace("/");
    }
  }, [session, isPending, router]);

  if (isPending || session) {
    return null;
  }

  return (
    <main className="flex items-center justify-center min-h-screen">
      <SignupForm />
    </main>
  );
}
