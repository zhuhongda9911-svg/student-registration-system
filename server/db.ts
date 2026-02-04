import { eq, desc, and, like, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, activities, registrations, payments, InsertActivity, InsertRegistration, InsertPayment } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ User Functions ============
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ Activity Functions ============
export async function createActivity(activity: InsertActivity) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(activities).values(activity);
  return result;
}

export async function getActivityById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(activities).where(eq(activities.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getActiveActivities() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(activities).where(eq(activities.isActive, true)).orderBy(desc(activities.createdAt));
}

export async function getAllActivities() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(activities).orderBy(desc(activities.createdAt));
}

export async function updateActivity(id: number, data: Partial<InsertActivity>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(activities).set(data).where(eq(activities.id, id));
}

// ============ Registration Functions ============
export async function createRegistration(registration: InsertRegistration) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(registrations).values(registration);
  return result;
}

export async function getRegistrationById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(registrations).where(eq(registrations.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getRegistrationsByActivityId(activityId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(registrations).where(eq(registrations.activityId, activityId)).orderBy(desc(registrations.createdAt));
}

export async function searchRegistrations(params: {
  activityId?: number;
  studentName?: string;
  paymentStatus?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const conditions = [];
  
  if (params.activityId) {
    conditions.push(eq(registrations.activityId, params.activityId));
  }
  
  if (params.studentName) {
    conditions.push(like(registrations.studentName, `%${params.studentName}%`));
  }
  
  if (params.paymentStatus) {
    conditions.push(eq(registrations.paymentStatus, params.paymentStatus as any));
  }
  
  if (params.startDate) {
    conditions.push(gte(registrations.createdAt, params.startDate));
  }
  
  if (params.endDate) {
    conditions.push(lte(registrations.createdAt, params.endDate));
  }
  
  let query = db.select().from(registrations);
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  query = query.orderBy(desc(registrations.createdAt)) as any;
  
  if (params.limit) {
    query = query.limit(params.limit) as any;
  }
  
  if (params.offset) {
    query = query.offset(params.offset) as any;
  }
  
  return await query;
}

export async function countRegistrations(params: {
  activityId?: number;
  studentName?: string;
  paymentStatus?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const conditions = [];
  
  if (params.activityId) {
    conditions.push(eq(registrations.activityId, params.activityId));
  }
  
  if (params.studentName) {
    conditions.push(like(registrations.studentName, `%${params.studentName}%`));
  }
  
  if (params.paymentStatus) {
    conditions.push(eq(registrations.paymentStatus, params.paymentStatus as any));
  }
  
  if (params.startDate) {
    conditions.push(gte(registrations.createdAt, params.startDate));
  }
  
  if (params.endDate) {
    conditions.push(lte(registrations.createdAt, params.endDate));
  }
  
  let query = db.select({ count: sql<number>`count(*)` }).from(registrations);
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  const result = await query;
  return result[0]?.count || 0;
}

export async function updateRegistration(id: number, data: Partial<InsertRegistration>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(registrations).set(data).where(eq(registrations.id, id));
}

export async function deleteRegistration(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(registrations).where(eq(registrations.id, id));
}

// ============ Payment Functions ============
export async function createPayment(payment: InsertPayment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(payments).values(payment);
  return result;
}

export async function getPaymentByRegistrationId(registrationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(payments).where(eq(payments.registrationId, registrationId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updatePayment(id: number, data: Partial<InsertPayment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(payments).set(data).where(eq(payments.id, id));
}
