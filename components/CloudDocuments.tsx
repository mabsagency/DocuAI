"use client";

import { useCallback, useEffect, useState, DragEvent } from "react";

type CloudDoc = {
  id: string;
  name: string;
  folder: string;
  type: string;
  updatedAt: string;
};

export default function CloudDocuments() {
  const [docs, setDocs] = useState<CloudDoc[]>([]);
  const [folder, setFolder] = useState("root");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("updated");

  const loadDocs = useCallback(async () => {
    const q = new URLSearchParams({ folder, q: query, sort }).toString();
    const result = await fetch(`/api/cloud-docs?${q}`);
    const body = await result.json();
    if (body.success) setDocs(body.docs);
  }, [folder, query, sort]);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  const onDrop = async (ev: DragEvent<HTMLDivElement>) => {
    ev.preventDefault();
    const text = ev.dataTransfer.getData("text/plain");
    if (text) {
      const moduleName = text || "Dragged";
      await fetch("/api/cloud-docs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: moduleName, folder, content: "", type: "txt" }) });
      loadDocs();
    }
  };

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm mt-5">
      <h3 className="text-xl font-bold mb-3">Bibliothèque Cloud</h3>
      <div className="flex flex-wrap gap-2 mb-3">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Recherche..." className="border rounded px-2 py-1" />
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="border rounded px-2 py-1">
          <option value="updated">Mis à jour</option>
          <option value="name">Nom</option>
          <option value="created">Création</option>
        </select>
        <input value={folder} onChange={(e) => setFolder(e.target.value)} placeholder="Dossier" className="border rounded px-2 py-1" />
      </div>

      <div className="border border-dashed border-slate-300 rounded p-4" onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
        Glisser-déposer pour créer un document (mock) dans le dossier actuel.
      </div>

      <table className="w-full mt-3">
        <thead>
          <tr className="text-left text-xs text-slate-500 uppercase">
            <th>Nom</th>
            <th>Dossier</th>
            <th>Type</th>
            <th>Mise à jour</th>
          </tr>
        </thead>
        <tbody>
          {docs.map((doc) => (
            <tr key={doc.id} className="border-t hover:bg-slate-50">
              <td>{doc.name}</td>
              <td>{doc.folder}</td>
              <td>{doc.type}</td>
              <td>{new Date(doc.updatedAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
