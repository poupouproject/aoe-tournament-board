import Link from 'next/link';

const ECRANS = [
  { href: '/scoreboard', titre: 'Scoreboard', detail: 'Projo 1 · la tour de contrôle' },
  { href: '/saisie', titre: 'Saisie', detail: "Téléphone de l'organisateur" },
] as const;

export default function Accueil() {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 px-4 py-12">
      <h1 className="text-3xl font-extrabold uppercase italic">
        <span className="text-rouge">Hot</span> <span className="text-bleu">Pursuit</span>
      </h1>
      <p className="text-attenue">FDS Gaming 2026 · Tournoi Hot Pursuit</p>
      <nav className="flex flex-col gap-3">
        {ECRANS.map((e) => (
          <Link
            key={e.href}
            href={e.href}
            className="border-ligne bg-panneau hover:border-attenue border px-5 py-4"
          >
            <span className="block text-xl font-bold uppercase">{e.titre}</span>
            <span className="text-attenue text-sm">{e.detail}</span>
          </Link>
        ))}
      </nav>
    </main>
  );
}
