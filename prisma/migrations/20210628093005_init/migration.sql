/*
  Warnings:

  - Added the required column `orderId` to the `OrderDetail` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_OrderDetail" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "price" REAL NOT NULL,
    "amount" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "orderId" INTEGER NOT NULL,
    "merchandiseId" INTEGER NOT NULL,
    FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("merchandiseId") REFERENCES "Merchandise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_OrderDetail" ("amount", "createdAt", "id", "merchandiseId", "price", "updatedAt") SELECT "amount", "createdAt", "id", "merchandiseId", "price", "updatedAt" FROM "OrderDetail";
DROP TABLE "OrderDetail";
ALTER TABLE "new_OrderDetail" RENAME TO "OrderDetail";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
