-- CreateTable
CREATE TABLE "Joueur" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "equipe" TEXT,
    "rivalId" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "Manche" (
    "numero" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "bloc" TEXT NOT NULL,
    "trace" TEXT NOT NULL,
    "finale" BOOLEAN NOT NULL DEFAULT false,
    "cops" TEXT,
    "duel" INTEGER
);

-- CreateTable
CREATE TABLE "Resultat" (
    "mancheNumero" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "donnees" TEXT NOT NULL,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Resultat_mancheNumero_fkey" FOREIGN KEY ("mancheNumero") REFERENCES "Manche" ("numero") ON DELETE CASCADE ON UPDATE CASCADE
);
