-- CreateTable
CREATE TABLE "BankBalance" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "balance" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankBalance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BankBalance_tenantId_date_key" ON "BankBalance"("tenantId", "date");
CREATE INDEX "BankBalance_tenantId_idx" ON "BankBalance"("tenantId");
