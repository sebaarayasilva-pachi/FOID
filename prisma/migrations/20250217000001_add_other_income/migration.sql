-- CreateTable
CREATE TABLE "OtherIncome" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "frequency" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OtherIncome_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OtherIncome_tenantId_idx" ON "OtherIncome"("tenantId");
