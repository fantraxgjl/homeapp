-- CreateTable
CREATE TABLE "FamilyMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CHILD',
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "avatarEmoji" TEXT NOT NULL DEFAULT '👤',
    "calendarId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Chore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "iconName" TEXT NOT NULL DEFAULT 'star',
    "points" INTEGER NOT NULL DEFAULT 1,
    "recurrence" TEXT NOT NULL DEFAULT 'DAILY',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ChoreAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "choreId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "dayOfWeek" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChoreAssignment_choreId_fkey" FOREIGN KEY ("choreId") REFERENCES "Chore" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChoreAssignment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "FamilyMember" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChoreCompletion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "choreId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pointsEarned" INTEGER NOT NULL,
    CONSTRAINT "ChoreCompletion_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "FamilyMember" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MealPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weekStart" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MealDay" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "planId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    CONSTRAINT "MealDay_planId_fkey" FOREIGN KEY ("planId") REFERENCES "MealPlan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Meal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dayId" TEXT NOT NULL,
    "mealType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "emoji" TEXT,
    "imageUrl" TEXT,
    "recipeUrl" TEXT,
    "servings" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Meal_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "MealDay" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ShoppingItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "quantity" TEXT,
    "isChecked" BOOLEAN NOT NULL DEFAULT false,
    "mealId" TEXT,
    "addedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ShoppingItem_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "color" TEXT DEFAULT '#fef08a',
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    CONSTRAINT "Message_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "FamilyMember" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HomeDevice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entityId" TEXT NOT NULL,
    "friendlyName" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "iconOverride" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AppConfig" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "pinHash" TEXT,
    "haBaseUrl" TEXT,
    "haToken" TEXT,
    "weatherLat" REAL,
    "weatherLon" REAL,
    "kioskMode" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CalendarEventCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "googleId" TEXT NOT NULL,
    "calendarId" TEXT NOT NULL,
    "memberId" TEXT,
    "title" TEXT NOT NULL,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "isAllDay" BOOLEAN NOT NULL DEFAULT false,
    "color" TEXT,
    "location" TEXT,
    "syncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "ChoreAssignment_choreId_memberId_dayOfWeek_key" ON "ChoreAssignment"("choreId", "memberId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "ChoreCompletion_completedAt_idx" ON "ChoreCompletion"("completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MealDay_planId_date_key" ON "MealDay"("planId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Meal_dayId_mealType_key" ON "Meal"("dayId", "mealType");

-- CreateIndex
CREATE UNIQUE INDEX "HomeDevice_entityId_key" ON "HomeDevice"("entityId");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarEventCache_googleId_key" ON "CalendarEventCache"("googleId");

-- CreateIndex
CREATE INDEX "CalendarEventCache_startTime_endTime_idx" ON "CalendarEventCache"("startTime", "endTime");
