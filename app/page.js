"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/lib/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace(isLoggedIn() ? "/documents" : "/login");
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-notary-950">
      <p className="font-display text-2xl text-parchment tracking-wide">DocSign</p>
    </main>
  );
}
