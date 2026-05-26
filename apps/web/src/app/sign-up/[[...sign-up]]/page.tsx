"use client";

import { SignUp } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp
        fallbackRedirectUrl="/post-auth"
        initialValues={email ? { emailAddress: email } : undefined}
      />
    </div>
  );
}
