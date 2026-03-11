"use client";

import { useEffect, useState } from "react";

function UserCount() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/users/count")
      .then((res) => res.json())
      .then((body) => {
        if (body.success) setCount(body.count);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="border border-slate-200 rounded-xl bg-white p-4 shadow-sm">
      <h4 className="text-lg font-semibold">Utilisateurs inscrits</h4>
      <p className="text-2xl font-bold text-brand-700 mt-2">{count !== null ? count : "..."}</p>
    </div>
  );
}

export default UserCount;
