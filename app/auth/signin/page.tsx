"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await signIn("credentials", { redirect: false, email, password });
    if (res?.error) setError(res.error);
    else window.location.href = "/";
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
      <section className="w-full max-w-md bg-white p-8 rounded-xl shadow">
        <h1 className="text-2xl font-bold mb-4">Connexion DocuAI</h1>
        <form onSubmit={onSubmit} className="space-y-3">
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" className="w-full border rounded p-2" required />
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Mot de passe" className="w-full border rounded p-2" required />
          <button className="btn-primary w-full">Se connecter</button>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </form>
      </section>
    </main>
  );
}
