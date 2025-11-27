"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push("/login");
  }, [router]);

  return (
    <main className="flex items-center justify-center h-screen">
      {" "}
      <p className="text-gray-500">Redirecionando...</p>{" "}
    </main>
  );
}
