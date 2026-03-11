import Sidebar from "../components/Sidebar";
import DocumentScanner from "../components/DocumentScanner";
import DocumentEditor from "../components/DocumentEditor";
import CloudDocuments from "../components/CloudDocuments";
import UserCount from "../components/UserCount";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="flex">
        <Sidebar />
        <div className="flex-1 p-6">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">DocuAI</h1>
            <p className="text-slate-600 mt-2">Scanner, OCR intelligent, conversion, édition et partage — entièrement gratuit.</p>
          </header>

          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 mb-8">
            <Card title="Scanner intelligent" description="Capturez avec votre webcam ou importez une image. Bords, perspective et contraste corrigés avec IA." />
            <Card title="OCR IA" description="Reconnaissance imprimée + manuscrit, structure intelligente (titres, paragraphes, tableaux)." />
            <Card title="Conversion" description="PDF ⇄ DOCX, Image ⇄ PDF, et +. Mise en page conservée automatiquement." />
            <Card title="Éditeur" description="Éditez texte, format, listes, tableaux, images et sig. automatique avec autosave." />
            <Card title="Partage & impression" description="Partage par lien, WhatsApp et email + impression native (format/orientation)." />
            <Card title="Bibliothèque cloud" description="Organisation par dossiers, glisser-déposer, recherche et sauvegarde automatique." />
          </section>

          <div className="mb-8">
            <DocumentScanner />
            <DocumentEditor />
            <CloudDocuments />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
            <UserCount />
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            <Panel title="Scans récents">
              <p className="text-slate-600">Aucun document pour l’instant. Ajoutez une page avec Upload/Scan.</p>
            </Panel>
            <Panel title="Dernière conversion">
              <p className="text-slate-600">Sélectionnez un fichier pour convertir (PDF, DOCX, IMAGE).</p>
            </Panel>
            <Panel title="Support IA">
              <p className="text-slate-600">Amélioration de texte + résumé + traduction disponibles sur commande.</p>
            </Panel>
          </div>
        </div>
      </div>
    </main>
  );
}

function Card({ title, description }: { title: string; description: string }) {
  return (
    <article className="border border-slate-200 bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="font-semibold text-lg text-slate-900">{title}</h3>
      <p className="text-slate-600 mt-2">{description}</p>
    </article>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-slate-200 rounded-xl bg-white p-5 shadow-sm">
      <h4 className="text-slate-800 font-medium mb-2">{title}</h4>
      <div className="text-slate-600 text-sm">{children}</div>
    </div>
  );
}
