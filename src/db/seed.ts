// src/db/seed.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";
import { users } from "./schema.js";

dotenv.config();

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);

interface UserSeed {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

async function seed() {
  try {
    console.log("Starting seed process...");

    // Clear existing data
    await db.delete(users);
    console.log("Cleared existing users");

    // Sample users with realistic data
    const sampleUsers: UserSeed[] = [
      {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        password: "Password123!",
      },
      {
        firstName: "Jane",
        lastName: "Smith",
        email: "jane.smith@example.com",
        password: "Password123!",
      },
      {
        firstName: "Alice",
        lastName: "Johnson",
        email: "alice.j@example.com",
        password: "Password123!",
      },
      {
        firstName: "Bob",
        lastName: "Wilson",
        email: "bob.w@example.com",
        password: "Password123!",
      },
      {
        firstName: "Carol",
        lastName: "Brown",
        email: "carol.b@example.com",
        password: "Password123!",
      },
      {
        firstName: "David",
        lastName: "Miller",
        email: "david.m@example.com",
        password: "Password123!",
      },
      {
        firstName: "Emma",
        lastName: "Davis",
        email: "emma.d@example.com",
        password: "Password123!",
      },
      {
        firstName: "Frank",
        lastName: "Garcia",
        email: "frank.g@example.com",
        password: "Password123!",
      },
      {
        firstName: "Grace",
        lastName: "Martinez",
        email: "grace.m@example.com",
        password: "Password123!",
      },
      {
        firstName: "Henry",
        lastName: "Anderson",
        email: "henry.a@example.com",
        password: "Password123!",
      },
    ];

    // Hash passwords and insert users
    const usersWithHashedPasswords = await Promise.all(
      sampleUsers.map(async (user) => ({
        ...user,
        password: await bcrypt.hash(user.password, 10),
      })),
    );

    // Insert users in batches
    const insertedUsers = await db
      .insert(users)
      .values(usersWithHashedPasswords)
      .returning({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
      });

    console.log("Successfully seeded users:");
    console.table(
      insertedUsers.map((user) => ({
        ...user,
        password: "Password123!", // Show the plain password in logs for testing
      })),
    );

    console.log("\nSeed completed successfully!");
    console.log(
      "\nYou can log in with any email using the password: Password123!",
    );
  } catch (error) {
    console.error("Seed failed:", error);
    throw error;
  } finally {
    await client.end();
  }
}

seed().catch((err) => {
  console.error("Seed process failed:", err);
  process.exit(1);
});
