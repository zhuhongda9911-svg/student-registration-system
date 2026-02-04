import { eq } from "drizzle-orm";
import { admins, type Admin, type InsertAdmin } from "../drizzle/schema";
import { getDb } from "./db";

export async function getAdminByUsername(username: string): Promise<Admin | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(admins).where(eq(admins.username, username)).limit(1);
  return result[0];
}

export async function getAdminById(id: number): Promise<Admin | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(admins).where(eq(admins.id, id)).limit(1);
  return result[0];
}

export async function getAllAdmins(): Promise<Admin[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(admins);
}

export async function createAdmin(admin: InsertAdmin): Promise<Admin> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(admins).values(admin);
  const insertedId = Number(result[0].insertId);
  
  const newAdmin = await getAdminById(insertedId);
  if (!newAdmin) throw new Error("Failed to create admin");
  
  return newAdmin;
}

export async function updateAdmin(id: number, updates: Partial<InsertAdmin>): Promise<Admin> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(admins).set(updates).where(eq(admins.id, id));
  
  const updated = await getAdminById(id);
  if (!updated) throw new Error("Failed to update admin");
  
  return updated;
}

export async function deleteAdmin(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(admins).where(eq(admins.id, id));
}

export async function updateLastLoginAt(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(admins).set({ lastLoginAt: new Date() }).where(eq(admins.id, id));
}
