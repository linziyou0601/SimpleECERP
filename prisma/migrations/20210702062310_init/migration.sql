/*
  Warnings:

  - You are about to drop the `AccountingSubject` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `JournalEntry` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `JournalEntryDetail` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN "avatar" TEXT;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "AccountingSubject";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "JournalEntry";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "JournalEntryDetail";
PRAGMA foreign_keys=on;
