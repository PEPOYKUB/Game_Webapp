// Creates only a dedicated local demo player. It does not create sessions or alter game data.
// Run after the regular seed so the CP faculty exists: npm run db:demo
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ROLE, USER_STATUS } from "../lib/constants";

const db = new PrismaClient();
const demoAccount = {
  username: "demo_student",
  email: "demo.student@example.test",
  password: "DemoPass2026!",
  firstName: "Demo",
  lastName: "Student",
  yearLevel: 3,
};

async function main() {
  const faculty = await db.faculty.findUnique({ where: { facultyCode: "CP" }, select: { facultyId: true } });
  if (!faculty) throw new Error("Faculty seed is missing. Run npm run db:seed before npm run db:demo.");

  const [byUsername, byEmail] = await Promise.all([
    db.appUser.findUnique({ where: { username: demoAccount.username } }),
    db.appUser.findUnique({ where: { email: demoAccount.email } }),
  ]);

  if (byUsername || byEmail) {
    if (!byUsername || byUsername.userId !== byEmail?.userId) {
      throw new Error("The demo username or email is already used by another account; no data was changed.");
    }
    if (byUsername.role !== ROLE.player || byUsername.status !== USER_STATUS.active) {
      throw new Error("The existing demo account is not an active PLAYER; no data was changed.");
    }
    console.log(`Demo account already exists: ${demoAccount.username} (no changes made).`);
    return;
  }

  await db.appUser.create({
    data: {
      username: demoAccount.username,
      email: demoAccount.email,
      passwordHash: await bcrypt.hash(demoAccount.password, 12),
      firstName: demoAccount.firstName,
      lastName: demoAccount.lastName,
      facultyId: faculty.facultyId,
      yearLevel: demoAccount.yearLevel,
      role: ROLE.player,
      status: USER_STATUS.active,
    },
  });
  console.log(`Created local demo account: ${demoAccount.username}`);
  console.log(`Password: ${demoAccount.password}`);
  console.log("No game sessions, attempts, scores, hints, or achievements were created.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  await db.$disconnect();
});
