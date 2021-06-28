/*
  Warnings:

  - You are about to drop the column `orderId` on the `OrderDetail` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_OrderDetail" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "price" REAL NOT NULL,
    "amount" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "merchandiseId" INTEGER NOT NULL,
    FOREIGN KEY ("merchandiseId") REFERENCES "Merchandise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_OrderDetail" ("amount", "createdAt", "id", "merchandiseId", "price", "updatedAt") SELECT "amount", "createdAt", "id", "merchandiseId", "price", "updatedAt" FROM "OrderDetail";
DROP TABLE "OrderDetail";
ALTER TABLE "new_OrderDetail" RENAME TO "OrderDetail";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
