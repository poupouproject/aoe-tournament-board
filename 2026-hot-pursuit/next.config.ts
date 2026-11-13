import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Le badge de développement de Next masquerait « EN DIRECT » sur le projo.
  devIndicators: false,

  // Le téléphone de saisie et le laptop du projo joignent `next dev` par
  // l'adresse IP du poste sur le Wi-Fi. Sans ces origines, Next bloque leurs
  // requêtes vers les ressources de développement et les Server Actions.
  allowedDevOrigins: ['192.168.*.*', '10.*.*.*', '172.*.*.*'],

  // better-sqlite3 est un module natif (.node) et le client Prisma charge ses
  // propres fichiers : ils restent chargés par Node, hors du bundle.
  serverExternalPackages: ['@prisma/client', '@prisma/adapter-better-sqlite3', 'better-sqlite3'],
};

export default nextConfig;
