import { eq, desc, and, like, sql } from "drizzle-orm";
import { getDb } from "./db";
import { competitions, InsertCompetition } from "../drizzle/schema";

export async function createCompetition(data: InsertCompetition) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(competitions).values(data);
}

export async function updateCompetition(id: number, data: Partial<InsertCompetition>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(competitions).set(data).where(eq(competitions.id, id));
}

export async function deleteCompetition(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(competitions).where(eq(competitions.id, id));
}

export async function getCompetitionById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Increment view count
  await db.update(competitions).set({ viewCount: sql`${competitions.viewCount} + 1` }).where(eq(competitions.id, id));
  
  const result = await db.select().from(competitions).where(eq(competitions.id, id)).limit(1);
  return result[0];
}

export async function listCompetitions(params?: { 
  category?: string;
  level?: string;
  status?: string;
  isWhitelisted?: boolean;
  search?: string; 
  limit?: number; 
  offset?: number;
  publishedOnly?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const conditions = [];
  
  if (params?.publishedOnly) {
    conditions.push(eq(competitions.isPublished, true));
  }
  
  if (params?.category) {
    conditions.push(eq(competitions.category, params.category));
  }
  
  if (params?.level) {
    conditions.push(eq(competitions.level, params.level as any));
  }
  
  if (params?.status) {
    conditions.push(eq(competitions.status, params.status as any));
  }
  
  if (params?.isWhitelisted !== undefined) {
    conditions.push(eq(competitions.isWhitelisted, params.isWhitelisted));
  }
  
  if (params?.search) {
    conditions.push(
      sql`${competitions.name} LIKE ${`%${params.search}%`} OR ${competitions.description} LIKE ${`%${params.search}%`}`
    );
  }
  
  let query = db.select().from(competitions);
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  query = query.orderBy(desc(competitions.createdAt)) as any;
  
  if (params?.limit) {
    query = query.limit(params.limit) as any;
  }
  
  if (params?.offset) {
    query = query.offset(params.offset) as any;
  }
  
  return await query;
}

export async function getCompetitionCategories() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select({ category: competitions.category })
    .from(competitions)
    .groupBy(competitions.category);
  
  return result.map(r => r.category).filter(Boolean);
}
