-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Inventory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "cost" REAL NOT NULL DEFAULT 0,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "merchandiseId" INTEGER NOT NULL,
    "adjustmentId" INTEGER,
    "purchaseId" INTEGER,
    "saleId" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY ("merchandiseId") REFERENCES "Merchandise" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("adjustmentId") REFERENCES "Adjustment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY ("purchaseId") REFERENCES "Purchase" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY ("saleId") REFERENCES "Sale" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Inventory" ("adjustmentId", "cost", "createdAt", "id", "merchandiseId", "purchaseId", "quantity", "saleId", "updatedAt") SELECT "adjustmentId", "cost", "createdAt", "id", "merchandiseId", "purchaseId", "quantity", "saleId", "updatedAt" FROM "Inventory";
DROP TABLE "Inventory";
ALTER TABLE "new_Inventory" RENAME TO "Inventory";
CREATE UNIQUE INDEX "Inventory_adjustmentId_unique" ON "Inventory"("adjustmentId");
CREATE UNIQUE INDEX "Inventory_purchaseId_unique" ON "Inventory"("purchaseId");
CREATE UNIQUE INDEX "Inventory_saleId_unique" ON "Inventory"("saleId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
