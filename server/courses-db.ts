import { eq, desc, and, like, sql } from "drizzle-orm";
import { getDb } from "./db";
import { courses, InsertCourse } from "../drizzle/schema";

export async function createCourse(data: InsertCourse) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(courses).values(data);
}

export async function updateCourse(id: number, data: Partial<InsertCourse>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(courses).set(data).where(eq(courses.id, id));
}

export async function deleteCourse(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(courses).where(eq(courses.id, id));
}

export async function getCourseById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(courses).set({ viewCount: sql`${courses.viewCount} + 1` }).where(eq(courses.id, id));
  
  const result = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
  return result[0];
}

export async function listCourses(params?: { 
  subject?: string;
  grade?: string;
  search?: string; 
  limit?: number; 
  offset?: number;
  activeOnly?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const conditions = [];
  
  if (params?.activeOnly) {
    conditions.push(eq(courses.isActive, true));
  }
  
  if (params?.subject) {
    conditions.push(eq(courses.subject, params.subject));
  }
  
  if (params?.grade) {
    conditions.push(eq(courses.grade, params.grade));
  }
  
  if (params?.search) {
    conditions.push(
      sql`${courses.title} LIKE ${`%${params.search}%`} OR ${courses.teacherName} LIKE ${`%${params.search}%`}`
    );
  }
  
  let query = db.select().from(courses);
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  query = query.orderBy(desc(courses.createdAt)) as any;
  
  if (params?.limit) {
    query = query.limit(params.limit) as any;
  }
  
  if (params?.offset) {
    query = query.offset(params.offset) as any;
  }
  
  return await query;
}
