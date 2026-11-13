import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

// Polices servies localement (Fontsource) : tout doit tourner sans internet.
import '@fontsource/saira/latin-400.css';
import '@fontsource/saira/latin-500.css';
import '@fontsource/saira/latin-600.css';
import '@fontsource/saira-condensed/latin-500.css';
import '@fontsource/saira-condensed/latin-600.css';
import '@fontsource/saira-condensed/latin-700.css';
import '@fontsource/saira-condensed/latin-800.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Hot Pursuit · FDS Gaming',
  description: 'Scoreboard du tournoi Need for Speed Hot Pursuit de la FDS Gaming.',
};

export const viewport: Viewport = {
  themeColor: '#06080c',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
