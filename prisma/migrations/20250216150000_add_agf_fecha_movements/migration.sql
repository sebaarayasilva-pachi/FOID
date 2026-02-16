-- AlterTable
ALTER TABLE "Investment" ADD COLUMN "agf" TEXT;
ALTER TABLE "Investment" ADD COLUMN "fechaApertura" DATETIME;

-- CreateTable
CREATE TABLE "InvestmentMovement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "investmentId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "monto" REAL NOT NULL,
    "fecha" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InvestmentMovement_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "Investment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "InvestmentMovement_investmentId_idx" ON "InvestmentMovement"("investmentId");
