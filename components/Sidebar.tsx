import { FileText, Home, Image, Edit3, Share2, Settings2 } from "lucide-react";

const items = [
  { name: "Tableau de bord", icon: Home },
  { name: "Mes documents", icon: FileText },
  { name: "Upload / Scan", icon: Image },
  { name: "Éditeur", icon: Edit3 },
  { name: "Conversions", icon: Share2 },
  { name: "Paramètres", icon: Settings2 },
];

export default function Sidebar() {
  return (
    <aside className="w-64 p-5 bg-white border-r border-slate-200 h-screen sticky top-0">
      <div className="text-brand-700 font-bold text-xl mb-8">DocuAI</div>
      <nav className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.name} className="w-full text-left rounded-lg px-3 py-2 hover:bg-slate-100 flex items-center gap-3">
              <Icon size={16} />
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
