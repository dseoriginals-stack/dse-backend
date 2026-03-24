-- CreateTable
CREATE TABLE "CartRecovery" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CartRecovery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CartRecovery_token_key" ON "CartRecovery"("token");

-- CreateIndex
CREATE INDEX "CartRecovery_token_idx" ON "CartRecovery"("token");

-- AddForeignKey
ALTER TABLE "CartRecovery" ADD CONSTRAINT "CartRecovery_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;
