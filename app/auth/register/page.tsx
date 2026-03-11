"use client";

import { useState } from "react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, accessCode }),
    });

    const body = await res.json();
    if (res.ok) {
      setSuccess(true);
      setMessage("Inscription réussie, vous pouvez vous connecter.");
    } else {
      setSuccess(false);
      setMessage(body.message || "Erreur inscription");
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white p-6 rounded-xl shadow">
        <h1 className="text-2xl font-bold mb-4">Inscription DocuAI</h1>
        <form onSubmit={onSubmit} className="space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom" className="w-full border rounded p-2" required />
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" className="w-full border rounded p-2" required />
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Mot de passe" className="w-full border rounded p-2" required />
          <input value={accessCode} onChange={(e) => setAccessCode(e.target.value)} placeholder="Code d'accès (2007)" className="w-full border rounded p-2" required />
          <button className="btn-primary w-full">Créer un compte</button>
          <p className={success ? "text-green-600" : "text-red-600"}>{message}</p>
        </form>
      </div>
    </main>
  );
}
