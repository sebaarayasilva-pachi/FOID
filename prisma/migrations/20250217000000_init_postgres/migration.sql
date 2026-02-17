-- CreateTable
CREATE TABLE "Investment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "agf" TEXT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "capitalInvested" DECIMAL(65,30) NOT NULL,
    "fechaApertura" TIMESTAMP(3),
    "currentValue" DECIMAL(65,30),
    "fechaValor" TIMESTAMP(3),
    "returnPct" DECIMAL(65,30),
    "monthlyIncome" DECIMAL(65,30),
    "rescates" DECIMAL(65,30),
    "units" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Investment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestmentMovement" (
    "id" TEXT NOT NULL,
    "investmentId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "monto" DECIMAL(65,30) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvestmentMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Liability" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "balance" DECIMAL(65,30),
    "monthlyPayment" DECIMAL(65,30) NOT NULL,
    "interestRate" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Liability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashflowMonth" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "income" DECIMAL(65,30) NOT NULL,
    "expenses" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CashflowMonth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rental" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "propertyName" TEXT NOT NULL,
    "monthlyRent" DECIMAL(65,30) NOT NULL,
    "status" TEXT NOT NULL,
    "tenantName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rental_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Investment_tenantId_idx" ON "Investment"("tenantId");

-- CreateIndex
CREATE INDEX "InvestmentMovement_investmentId_idx" ON "InvestmentMovement"("investmentId");

-- CreateIndex
CREATE INDEX "Liability_tenantId_idx" ON "Liability"("tenantId");

-- CreateIndex
CREATE INDEX "CashflowMonth_tenantId_idx" ON "CashflowMonth"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "CashflowMonth_tenantId_month_key" ON "CashflowMonth"("tenantId", "month");

-- CreateIndex
CREATE INDEX "Rental_tenantId_idx" ON "Rental"("tenantId");

-- AddForeignKey
ALTER TABLE "InvestmentMovement" ADD CONSTRAINT "InvestmentMovement_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "Investment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
