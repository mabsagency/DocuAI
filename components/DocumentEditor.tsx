"use client";

import { useRef, useState } from "react";

export default function DocumentEditor() {
  const [text, setText] = useState("Tapez ici votre document ou importez le texte OCR...");
  const [signature, setSignature] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const drawSignature = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx || event.buttons !== 1) return;
    ctx.fillStyle = "#111827";
    ctx.beginPath();
    ctx.arc(event.clientX - rect.left, event.clientY - rect.top, 2, 0, Math.PI * 2);
    ctx.fill();
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignature(null);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSignature(canvas.toDataURL("image/png"));
  };

  const shareWhatsApp = () => {
    const link = encodeURIComponent("Lien DocuAI : " + window.location.href);
    window.open(`https://wa.me/?text=${link}`, "_blank");
  };

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm mt-5">
      <h3 className="text-xl font-bold mb-3">Éditeur de documents + annotation</h3>
      <div className="mb-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full border border-slate-300 rounded-lg p-2 min-h-[160px]"
        />
      </div>

      <div className="mb-3">
        <div className="mb-2">Signature électronique (dessin) :</div>
        <canvas
          ref={canvasRef}
          width={600}
          height={150}
          className="border border-slate-300 rounded-lg"
          onMouseMove={drawSignature}
          onMouseDown={drawSignature}
          onMouseUp={() => saveSignature()}
          onMouseLeave={() => saveSignature()}
        />
        <div className="mt-2 flex gap-2">
          <button className="btn-secondary" onClick={clearSignature}>Effacer</button>
          <button className="btn-secondary" onClick={saveSignature}>Enregistrer signature</button>
          <button className="btn-secondary" onClick={shareWhatsApp}>Partager sur WhatsApp</button>
        </div>
        {signature && <img src={signature} alt="signature" className="mt-2 border border-slate-300" />}
      </div>

      <div className="text-sm text-slate-600">Annotation : utiliser le texte ci-dessus et l’icône de surlignage plus basiment.
(À améliorer avec tiptap / Prosemirror pour fonctionnalité complète.)</div>
      <div className="mt-4 border border-slate-200 rounded-lg p-3 bg-slate-50">
        <h4 className="font-semibold mb-2">Impression</h4>
        <p className="text-slate-600 text-sm mb-2">Connectez votre imprimante (via fonction navigateur) et imprimez ce document directement.</p>
        <button className="btn-primary" onClick={() => window.print()}>Imprimer le document</button>
      </div>
    </section>
  );
}
