import { eq, desc, and, like, sql } from "drizzle-orm";
import { getDb } from "./db";
import { news, InsertNews } from "../drizzle/schema";

export async function createNews(data: InsertNews) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(news).values(data);
}

export async function updateNews(id: number, data: Partial<InsertNews>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(news).set(data).where(eq(news.id, id));
}

export async function deleteNews(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(news).where(eq(news.id, id));
}

export async function getNewsById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Increment view count
  await db.update(news).set({ viewCount: sql`${news.viewCount} + 1` }).where(eq(news.id, id));
  
  const result = await db.select().from(news).where(eq(news.id, id)).limit(1);
  return result[0];
}

export async function listNews(params?: { 
  category?: string; 
  search?: string; 
  limit?: number; 
  offset?: number;
  publishedOnly?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const conditions = [];
  
  if (params?.publishedOnly) {
    conditions.push(eq(news.isPublished, true));
  }
  
  if (params?.category) {
    conditions.push(eq(news.category, params.category));
  }
  
  if (params?.search) {
    conditions.push(
      sql`${news.title} LIKE ${`%${params.search}%`} OR ${news.content} LIKE ${`%${params.search}%`}`
    );
  }
  
  let query = db.select().from(news);
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  query = query.orderBy(desc(news.publishDate)) as any;
  
  if (params?.limit) {
    query = query.limit(params.limit) as any;
  }
  
  if (params?.offset) {
    query = query.offset(params.offset) as any;
  }
  
  return await query;
}

export async function getNewsCategories() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select({ category: news.category })
    .from(news)
    .groupBy(news.category);
  
  return result.map(r => r.category);
}
