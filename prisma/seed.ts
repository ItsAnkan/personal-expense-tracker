import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_EMAIL = process.env.DEMO_USER_EMAIL ?? "demo@example.com";
const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD ?? "ChangeMe123!";

function monthDate(isoDate: string): Date {
  return new Date(`${isoDate}T10:00:00+05:30`);
}

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {
      name: "Demo User",
      passwordHash,
      defaultCurrency: "INR",
      timezone: "Asia/Kolkata",
    },
    create: {
      email: DEMO_EMAIL,
      name: "Demo User",
      passwordHash,
      defaultCurrency: "INR",
      timezone: "Asia/Kolkata",
    },
  });

  await prisma.transaction.deleteMany({ where: { userId: user.id } });
  await prisma.budget.deleteMany({ where: { userId: user.id } });
  await prisma.importRow.deleteMany({ where: { batch: { userId: user.id } } });
  await prisma.importBatch.deleteMany({ where: { userId: user.id } });
  await prisma.category.deleteMany({ where: { userId: user.id } });
  await prisma.account.deleteMany({ where: { userId: user.id } });

  const accounts = await Promise.all([
    prisma.account.create({
      data: {
        userId: user.id,
        name: "HDFC Savings",
        type: "BANK_ACCOUNT",
        openingBalance: new Prisma.Decimal("50000"),
        currency: "INR",
        notes: "Demo seed data - removable",
        sortOrder: 1,
      },
    }),
    prisma.account.create({
      data: {
        userId: user.id,
        name: "ICICI Savings",
        type: "BANK_ACCOUNT",
        openingBalance: new Prisma.Decimal("10000"),
        currency: "INR",
        notes: "Demo seed data - removable",
        sortOrder: 2,
      },
    }),
    prisma.account.create({
      data: {
        userId: user.id,
        name: "Cash",
        type: "CASH",
        openingBalance: new Prisma.Decimal("3000"),
        currency: "INR",
        notes: "Demo seed data - removable",
        sortOrder: 3,
      },
    }),
    prisma.account.create({
      data: {
        userId: user.id,
        name: "HDFC Credit Card",
        type: "CREDIT_CARD",
        openingBalance: new Prisma.Decimal("0"),
        currency: "INR",
        notes: "Demo seed data - removable",
        sortOrder: 4,
      },
    }),
  ]);

  const accountByName = new Map(accounts.map((account) => [account.name, account]));

  async function createCategoryTree(
    name: string,
    children: string[] = [],
    sortOrder = 0,
  ) {
    const parent = await prisma.category.create({
      data: {
        userId: user.id,
        name,
        kind: "EXPENSE",
        sortOrder,
      },
    });

    const childRecords = await Promise.all(
      children.map((childName, index) =>
        prisma.category.create({
          data: {
            userId: user.id,
            parentId: parent.id,
            name: childName,
            kind: "EXPENSE",
            sortOrder: index + 1,
          },
        }),
      ),
    );

    return { parent, children: childRecords };
  }

  const housing = await createCategoryTree(
    "Housing",
    ["Rent", "Maintenance", "Electricity", "Water", "Internet", "Gas"],
    1,
  );
  const food = await createCategoryTree(
    "Food",
    ["Groceries", "Restaurants", "Food Delivery", "Coffee"],
    2,
  );
  const transport = await createCategoryTree(
    "Transport",
    ["Fuel", "Public Transport", "Cab", "Parking", "Vehicle Maintenance"],
    3,
  );
  const shopping = await createCategoryTree(
    "Shopping",
    ["Clothes", "Electronics", "Household", "Personal Care"],
    4,
  );
  const entertainment = await createCategoryTree(
    "Entertainment",
    ["Movies", "Games", "Subscriptions", "Events"],
    5,
  );
  const health = await createCategoryTree("Health", ["Pharmacy", "Doctor", "Medical"], 6);
  const education = await createCategoryTree("Education", ["Courses", "Books", "Fees"], 7);
  const travel = await createCategoryTree(
    "Travel",
    ["Flights", "Hotels", "Food", "Local Transport"],
    8,
  );
  const financial = await createCategoryTree(
    "Financial",
    ["Bank Fees", "Credit Card Fees", "Interest"],
    9,
  );
  const other = await createCategoryTree("Other", [], 10);

  const categoryByName = new Map<string, string>();
  [
    housing,
    food,
    transport,
    shopping,
    entertainment,
    health,
    education,
    travel,
    financial,
    other,
  ].forEach((group) => {
    categoryByName.set(group.parent.name, group.parent.id);
    group.children.forEach((child) => categoryByName.set(child.name, child.id));
  });

  const txData: Array<{
    type: "EXPENSE" | "INCOME" | "TRANSFER" | "CREDIT_CARD_PAYMENT" | "REFUND";
    amount: string;
    occurredAt: Date;
    from?: string;
    to?: string;
    category?: string;
    notes: string;
    merchant?: string;
    refundForIndex?: number;
  }> = [
    { type: "INCOME", amount: "85000", occurredAt: monthDate("2026-06-01"), to: "HDFC Savings", category: "Other", notes: "June Salary [DEMO]" },
    { type: "EXPENSE", amount: "18000", occurredAt: monthDate("2026-06-03"), from: "HDFC Savings", category: "Rent", notes: "Monthly Rent [DEMO]", merchant: "Landlord" },
    { type: "EXPENSE", amount: "5800", occurredAt: monthDate("2026-06-08"), from: "HDFC Credit Card", category: "Groceries", notes: "Grocery Purchase [DEMO]", merchant: "BigBasket" },
    { type: "EXPENSE", amount: "2400", occurredAt: monthDate("2026-06-11"), from: "HDFC Credit Card", category: "Restaurants", notes: "Dinner [DEMO]", merchant: "Barbeque Nation" },
    { type: "TRANSFER", amount: "10000", occurredAt: monthDate("2026-06-14"), from: "HDFC Savings", to: "ICICI Savings", notes: "Transfer to ICICI [DEMO]" },
    { type: "EXPENSE", amount: "3200", occurredAt: monthDate("2026-06-18"), from: "HDFC Savings", category: "Fuel", notes: "Fuel Refill [DEMO]", merchant: "Indian Oil" },
    { type: "CREDIT_CARD_PAYMENT", amount: "7000", occurredAt: monthDate("2026-06-25"), from: "HDFC Savings", to: "HDFC Credit Card", notes: "Credit Card Bill Payment [DEMO]" },
    { type: "INCOME", amount: "85000", occurredAt: monthDate("2026-07-01"), to: "HDFC Savings", category: "Other", notes: "July Salary [DEMO]" },
    { type: "EXPENSE", amount: "18000", occurredAt: monthDate("2026-07-03"), from: "HDFC Savings", category: "Rent", notes: "Monthly Rent [DEMO]", merchant: "Landlord" },
    { type: "EXPENSE", amount: "7200", occurredAt: monthDate("2026-07-07"), from: "HDFC Credit Card", category: "Groceries", notes: "Groceries [DEMO]", merchant: "DMart" },
    { type: "EXPENSE", amount: "4100", occurredAt: monthDate("2026-07-10"), from: "HDFC Credit Card", category: "Electronics", notes: "Gadgets [DEMO]", merchant: "Amazon" },
    { type: "TRANSFER", amount: "5000", occurredAt: monthDate("2026-07-12"), from: "HDFC Savings", to: "Cash", notes: "Withdraw Cash [DEMO]" },
    { type: "REFUND", amount: "1200", occurredAt: monthDate("2026-07-14"), to: "HDFC Credit Card", category: "Electronics", notes: "Item Refund [DEMO]", merchant: "Amazon", refundForIndex: 10 },
    { type: "EXPENSE", amount: "1600", occurredAt: monthDate("2026-07-20"), from: "Cash", category: "Movies", notes: "Cinema [DEMO]", merchant: "PVR" },
    { type: "CREDIT_CARD_PAYMENT", amount: "9000", occurredAt: monthDate("2026-07-26"), from: "HDFC Savings", to: "HDFC Credit Card", notes: "Credit Card Bill Payment [DEMO]" },
    { type: "INCOME", amount: "85000", occurredAt: monthDate("2026-08-01"), to: "HDFC Savings", category: "Other", notes: "August Salary [DEMO]" },
    { type: "EXPENSE", amount: "18000", occurredAt: monthDate("2026-08-03"), from: "HDFC Savings", category: "Rent", notes: "Monthly Rent [DEMO]", merchant: "Landlord" },
    { type: "EXPENSE", amount: "8200", occurredAt: monthDate("2026-08-06"), from: "HDFC Credit Card", category: "Food Delivery", notes: "Food Orders [DEMO]", merchant: "Swiggy" },
    { type: "EXPENSE", amount: "6500", occurredAt: monthDate("2026-08-09"), from: "HDFC Credit Card", category: "Clothes", notes: "Clothing [DEMO]", merchant: "Myntra" },
    { type: "EXPENSE", amount: "4200", occurredAt: monthDate("2026-08-15"), from: "HDFC Savings", category: "Fuel", notes: "Fuel [DEMO]", merchant: "Shell" },
    { type: "EXPENSE", amount: "2450", occurredAt: monthDate("2026-08-17"), from: "HDFC Savings", category: "Subscriptions", notes: "Entertainment Subscriptions [DEMO]", merchant: "Netflix" },
    { type: "TRANSFER", amount: "8000", occurredAt: monthDate("2026-08-21"), from: "ICICI Savings", to: "HDFC Savings", notes: "Transfer to HDFC [DEMO]" },
    { type: "EXPENSE", amount: "3000", occurredAt: monthDate("2026-08-24"), from: "HDFC Credit Card", category: "Credit Card Fees", notes: "Card Charges [DEMO]", merchant: "HDFC Bank" },
    { type: "CREDIT_CARD_PAYMENT", amount: "10000", occurredAt: monthDate("2026-08-26"), from: "HDFC Savings", to: "HDFC Credit Card", notes: "Credit Card Bill Payment [DEMO]" },
  ];

  const createdTransactions: Array<{ id: string }> = [];

  for (const [index, item] of txData.entries()) {
    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        type: item.type,
        amount: new Prisma.Decimal(item.amount),
        occurredAt: item.occurredAt,
        fromAccountId: item.from ? accountByName.get(item.from)?.id : null,
        toAccountId: item.to ? accountByName.get(item.to)?.id : null,
        categoryId: item.category ? categoryByName.get(item.category) : null,
        notes: item.notes,
        merchant: item.merchant ?? null,
        source: "MANUAL",
        refundForTransactionId:
          item.refundForIndex !== undefined
            ? createdTransactions[item.refundForIndex]?.id
            : null,
      },
    });

    createdTransactions[index] = { id: transaction.id };
  }

  await prisma.budget.createMany({
    data: [
      {
        userId: user.id,
        period: "MONTHLY",
        monthStart: monthDate("2026-08-01"),
        amount: new Prisma.Decimal("50000"),
      },
      {
        userId: user.id,
        period: "MONTHLY",
        monthStart: monthDate("2026-08-01"),
        categoryId: categoryByName.get("Food"),
        amount: new Prisma.Decimal("8000"),
      },
      {
        userId: user.id,
        period: "MONTHLY",
        monthStart: monthDate("2026-08-01"),
        categoryId: categoryByName.get("Shopping"),
        amount: new Prisma.Decimal("5000"),
      },
    ],
  });

  console.log("Seed completed");
  console.log(`Demo login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
