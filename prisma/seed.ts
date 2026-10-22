import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { slugify } from "../src/lib/slug";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

const boards = [
  { name: "Federal Board (FBISE)", province: "Islamabad Capital Territory" },
  { name: "BISE Lahore", province: "Punjab" },
  { name: "BISE Rawalpindi", province: "Punjab" },
  { name: "BISE Gujranwala", province: "Punjab" },
  { name: "BISE Faisalabad", province: "Punjab" },
  { name: "BISE Multan", province: "Punjab" },
  { name: "Karachi Boards (BSEK / BIEK)", province: "Sindh" },
  { name: "BISE Peshawar", province: "Khyber Pakhtunkhwa" },
];

const categories = [
  { name: "Textbooks", description: "Board-approved textbooks for every class and subject." },
  { name: "Guides & Keybooks", description: "Solved exercises, MCQs and exam-focused guides." },
  { name: "Notes", description: "Concise chapter-wise notes for quick revision." },
  { name: "Past Papers", description: "Solved past papers organised by board and year." },
  { name: "Model Papers", description: "Practice papers built on the latest paper pattern." },
];

const subjects = [
  "Physics", "Chemistry", "Biology", "Mathematics", "Computer Science", "English", "Urdu",
  "Islamiat", "Pakistan Studies", "Accounting", "Economics", "Statistics", "All Subjects",
];

const publishers = [
  { name: "Punjab Curriculum & Textbook Board", website: "https://pctb.punjab.gov.pk" },
  { name: "National Book Foundation", website: "https://www.nbf.org.pk" },
  { name: "Crescent Study Press" },
  { name: "Al-Noor Publishers" },
  { name: "BNB Study Series" },
];

const MATRIC = ["Physics", "Chemistry", "Biology", "Mathematics", "Computer Science", "English", "Urdu", "Islamiat", "Pakistan Studies"];
const INTER = ["Physics", "Chemistry", "Biology", "Mathematics", "Computer Science", "English", "Urdu", "Accounting", "Economics", "Statistics"];

const classTitle: Record<number, string> = { 9: "Class 9", 10: "Class 10", 11: "1st Year (Class 11)", 12: "2nd Year (Class 12)" };

// Deterministic pseudo-random so re-seeding yields stable data.
let s = 42;
const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647);
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];

async function main() {
  const boardIds: Record<string, string> = {};
  for (const b of boards) {
    const row = await db.board.upsert({ where: { slug: slugify(b.name) }, update: {}, create: { ...b, slug: slugify(b.name) } });
    boardIds[b.name] = row.id;
  }
  const catIds: Record<string, string> = {};
  for (const [i, c] of categories.entries()) {
    const row = await db.category.upsert({
      where: { slug: slugify(c.name) },
      update: {},
      create: { ...c, slug: slugify(c.name), sortOrder: i },
    });
    catIds[c.name] = row.id;
  }
  const subIds: Record<string, string> = {};
  for (const name of subjects) {
    const row = await db.subject.upsert({ where: { slug: slugify(name) }, update: {}, create: { name, slug: slugify(name) } });
    subIds[name] = row.id;
  }
  const pubIds: Record<string, string> = {};
  for (const p of publishers) {
    const row = await db.publisher.upsert({ where: { slug: slugify(p.name) }, update: {}, create: { ...p, slug: slugify(p.name) } });
    pubIds[p.name] = row.id;
  }

  type Seed = {
    title: string; classLevel: number; subject: string; category: string; board: string; publisher: string;
    price: number; description: string; medium?: string;
  };
  const books: Seed[] = [];
  for (const cls of [9, 10, 11, 12]) {
    const subs = cls <= 10 ? MATRIC : INTER;
    for (const sub of subs) {
      books.push({
        title: `${sub} Textbook ${classTitle[cls]} — Punjab`,
        classLevel: cls, subject: sub, category: "Textbooks", board: "BISE Lahore",
        publisher: "Punjab Curriculum & Textbook Board",
        price: 180 + Math.round(rand() * 22) * 10,
        medium: sub === "Urdu" || sub === "Islamiat" || sub === "Pakistan Studies" ? "Urdu" : "English",
        description: `The official ${sub} textbook for ${classTitle[cls]} prescribed for Punjab boards, covering the complete syllabus with exercises at the end of every chapter.`,
      });
    }
    for (const sub of subs.slice(0, 5)) {
      books.push({
        title: `${sub} Textbook ${classTitle[cls]} — Federal`,
        classLevel: cls, subject: sub, category: "Textbooks", board: "Federal Board (FBISE)",
        publisher: "National Book Foundation",
        price: 220 + Math.round(rand() * 20) * 10,
        description: `National Book Foundation ${sub} textbook for ${classTitle[cls]} following the Federal Board (FBISE) curriculum.`,
      });
      books.push({
        title: `${sub} Complete Guide ${classTitle[cls]}`,
        classLevel: cls, subject: sub, category: "Guides & Keybooks", board: pick(["BISE Lahore", "BISE Rawalpindi", "BISE Gujranwala"]),
        publisher: pick(["Crescent Study Press", "Al-Noor Publishers"]),
        price: 450 + Math.round(rand() * 35) * 10,
        description: `Fully solved exercises, numericals, MCQs and short/long questions for ${sub} ${classTitle[cls]}, arranged chapter by chapter according to the latest paper pattern.`,
      });
      books.push({
        title: `${sub} Chapter-wise Notes ${classTitle[cls]}`,
        classLevel: cls, subject: sub, category: "Notes", board: pick(["BISE Lahore", "Federal Board (FBISE)", "BISE Faisalabad"]),
        publisher: "BNB Study Series",
        price: 250 + Math.round(rand() * 15) * 10,
        description: `Concise, exam-oriented ${sub} notes for ${classTitle[cls]} with key definitions, diagrams and important questions highlighted for last-minute revision.`,
      });
    }
    for (const board of ["BISE Lahore", "Federal Board (FBISE)", "Karachi Boards (BSEK / BIEK)", "BISE Multan", "BISE Peshawar"]) {
      books.push({
        title: `Solved Past Papers ${classTitle[cls]} — ${board}`,
        classLevel: cls, subject: "All Subjects", category: "Past Papers", board,
        publisher: "BNB Study Series",
        price: 550 + Math.round(rand() * 30) * 10,
        description: `Solved annual and supplementary past papers of ${board} for ${classTitle[cls]} (last 10 years), with marking-scheme style answers.`,
      });
    }
    books.push({
      title: `Model Papers ${classTitle[cls]} (Science Group)`,
      classLevel: cls, subject: "All Subjects", category: "Model Papers", board: "BISE Lahore",
      publisher: "Crescent Study Press",
      price: 400 + Math.round(rand() * 20) * 10,
      description: `Practice model papers for every science subject of ${classTitle[cls]} built on the latest Punjab boards paper scheme.`,
    });
  }

  let created = 0;
  for (const [i, b] of books.entries()) {
    const slug = slugify(b.title);
    const discount = rand() < 0.35 ? pick([5, 10, 15, 20]) : 0;
    const stock = rand() < 0.08 ? 0 : 5 + Math.floor(rand() * 60);
    const data = {
      title: b.title,
      slug,
      description: b.description,
      sku: `BNB-${b.classLevel}-${String(i + 1).padStart(4, "0")}`,
      level: b.classLevel <= 10 ? ("MATRIC" as const) : ("INTERMEDIATE" as const),
      classLevel: b.classLevel,
      medium: b.medium ?? "English",
      edition: "2026 Edition",
      pages: 120 + Math.floor(rand() * 380),
      price: b.price,
      discountPercent: discount,
      stock,
      isFeatured: rand() < 0.18,
      categoryId: catIds[b.category],
      boardId: boardIds[b.board],
      subjectId: subIds[b.subject],
      publisherId: pubIds[b.publisher],
    };
    const exists = await db.book.findUnique({ where: { slug }, select: { id: true } });
    if (!exists) {
      await db.book.create({ data });
      created++;
    }
  }

  await db.coupon.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: { code: "WELCOME10", description: "10% off your first order above Rs. 1,000", type: "PERCENT", value: 10, minOrder: 1000 },
  });
  await db.coupon.upsert({
    where: { code: "BNB200" },
    update: {},
    create: { code: "BNB200", description: "Rs. 200 off orders above Rs. 2,500", type: "FIXED", value: 200, minOrder: 2500, maxUses: 500 },
  });

  const email = process.env.ADMIN_EMAIL?.toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) {
    const existing = await db.user.findUnique({ where: { email } });
    if (!existing) {
      await db.user.create({
        data: { email, name: process.env.ADMIN_NAME || "Administrator", role: "ADMIN", passwordHash: await bcrypt.hash(password, 12) },
      });
      console.log(`Created admin user ${email}`);
    } else if (existing.role !== "ADMIN") {
      await db.user.update({ where: { email }, data: { role: "ADMIN" } });
      console.log(`Promoted ${email} to ADMIN`);
    }
  } else {
    console.warn("ADMIN_EMAIL / ADMIN_PASSWORD not set — skipped admin user");
  }

  console.log(`Seed complete: ${books.length} catalogue entries (${created} new).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
