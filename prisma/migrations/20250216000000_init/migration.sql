-- CreateTable
CREATE TABLE "Investment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "capitalInvested" REAL NOT NULL,
    "currentValue" REAL,
    "returnPct" REAL,
    "monthlyIncome" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Liability" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "balance" REAL,
    "monthlyPayment" REAL NOT NULL,
    "interestRate" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CashflowMonth" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "income" REAL NOT NULL,
    "expenses" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Rental" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "propertyName" TEXT NOT NULL,
    "monthlyRent" REAL NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Investment_tenantId_idx" ON "Investment"("tenantId");

-- CreateIndex
CREATE INDEX "Liability_tenantId_idx" ON "Liability"("tenantId");

-- CreateIndex
CREATE INDEX "CashflowMonth_tenantId_idx" ON "CashflowMonth"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "CashflowMonth_tenantId_month_key" ON "CashflowMonth"("tenantId", "month");

-- CreateIndex
CREATE INDEX "Rental_tenantId_idx" ON "Rental"("tenantId");
