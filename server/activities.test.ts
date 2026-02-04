import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AdminUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): { ctx: TrpcContext } {
  const user: AdminUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

function createPublicContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: undefined,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("activities", () => {
  it("should list active activities for public users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const activities = await caller.activities.list();

    expect(Array.isArray(activities)).toBe(true);
    // All returned activities should be active
    activities.forEach(activity => {
      expect(activity.isActive).toBe(true);
    });
  });

  it("should allow admin to list all activities", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const activities = await caller.activities.listAll();

    expect(Array.isArray(activities)).toBe(true);
  });

  it("should get activity by id", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // Get the first activity from the list
    const activities = await caller.activities.list();
    if (activities.length > 0) {
      const activity = await caller.activities.getById({ id: activities[0]!.id });
      
      expect(activity).toBeDefined();
      expect(activity.id).toBe(activities[0]!.id);
      expect(activity.title).toBeDefined();
      expect(activity.price).toBeDefined();
    }
  });
});

describe("registrations", () => {
  it("should create registration with valid data", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // Get an active activity first
    const activities = await caller.activities.list();
    if (activities.length === 0) {
      // Skip test if no activities available
      return;
    }

    const result = await caller.registrations.create({
      activityId: activities[0]!.id,
      studentName: "测试学生",
      studentGender: "男",
      studentSchool: "测试学校",
      studentGrade: "一年级",
      studentClass: "1班",
      guardianName: "测试家长",
      guardianPhone: "13800138000",
    });

    expect(result.success).toBe(true);
    expect(result.registrationId).toBeDefined();
  });

  it("should allow admin to search registrations", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.registrations.search({
      page: 1,
      pageSize: 20,
    });

    expect(result).toBeDefined();
    expect(result.items).toBeDefined();
    expect(Array.isArray(result.items)).toBe(true);
    expect(result.total).toBeDefined();
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
  });
});
