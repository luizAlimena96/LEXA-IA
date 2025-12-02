-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "city" TEXT,
ADD COLUMN     "document" TEXT,
ADD COLUMN     "neighborhood" TEXT,
ADD COLUMN     "niche" TEXT,
ADD COLUMN     "number" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "street" TEXT,
ADD COLUMN     "zipCode" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "allowedTabs" JSONB,
ADD COLUMN     "image" TEXT;
