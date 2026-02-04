import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { createCheckoutSession } from "./stripe";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: '需要管理员权限' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Activity management routes (admin only)
  activities: router({
    create: adminProcedure
      .input(z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        price: z.string(),
        contactPerson: z.string().optional(),
        contactPhone: z.string().optional(),
        contactWechat: z.string().optional(),
        itinerary: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.createActivity({
          ...input,
          createdBy: ctx.user.id,
        });
        return { success: true, id: result[0].insertId };
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        price: z.string().optional(),
        contactPerson: z.string().optional(),
        contactPhone: z.string().optional(),
        contactWechat: z.string().optional(),
        itinerary: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateActivity(id, data);
        return { success: true };
      }),

    list: publicProcedure.query(async () => {
      return await db.getActiveActivities();
    }),

    listAll: adminProcedure.query(async () => {
      return await db.getAllActivities();
    }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const activity = await db.getActivityById(input.id);
        if (!activity) {
          throw new TRPCError({ code: 'NOT_FOUND', message: '活动不存在' });
        }
        return activity;
      }),
  }),

  // Registration routes
  registrations: router({
    create: publicProcedure
      .input(z.object({
        activityId: z.number(),
        studentName: z.string().min(1),
        studentGender: z.enum(["男", "女"]),
        studentSchool: z.string().min(1),
        studentGrade: z.string().min(1),
        studentClass: z.string().min(1),
        studentIdCard: z.string().optional(),
        guardianName: z.string().min(1),
        guardianPhone: z.string().min(1),
        emergencyContactName: z.string().optional(),
        emergencyContactPhone: z.string().optional(),
        remarks: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Get activity to determine payment amount
        const activity = await db.getActivityById(input.activityId);
        if (!activity) {
          throw new TRPCError({ code: 'NOT_FOUND', message: '活动不存在' });
        }
        if (!activity.isActive) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: '活动已关闭' });
        }

        // Get IP address from request
        const ipAddress = ctx.req.headers['x-forwarded-for'] as string || 
                         ctx.req.headers['x-real-ip'] as string || 
                         ctx.req.socket?.remoteAddress || '';

        const result = await db.createRegistration({
          ...input,
          paymentAmount: activity.price,
          paymentStatus: 'pending',
          ipAddress: ipAddress.split(',')[0]?.trim() || '',
        });

        return { success: true, registrationId: result[0].insertId };
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const registration = await db.getRegistrationById(input.id);
        if (!registration) {
          throw new TRPCError({ code: 'NOT_FOUND', message: '报名记录不存在' });
        }
        return registration;
      }),

    search: adminProcedure
      .input(z.object({
        activityId: z.number().optional(),
        studentName: z.string().optional(),
        paymentStatus: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        page: z.number().default(1),
        pageSize: z.number().default(20),
      }))
      .query(async ({ input }) => {
        const { page, pageSize, startDate, endDate, ...rest } = input;
        const offset = (page - 1) * pageSize;

        const [items, total] = await Promise.all([
          db.searchRegistrations({
            ...rest,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            limit: pageSize,
            offset,
          }),
          db.countRegistrations({
            ...rest,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
          }),
        ]);

        return {
          items,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteRegistration(input.id);
        return { success: true };
      }),

    batchDelete: adminProcedure
      .input(z.object({ ids: z.array(z.number()) }))
      .mutation(async ({ input }) => {
        await Promise.all(input.ids.map(id => db.deleteRegistration(id)));
        return { success: true };
      }),
  }),

  // Payment routes
  payments: router({
    createIntent: publicProcedure
      .input(z.object({ 
        registrationId: z.number(),
        origin: z.string(),
      }))
      .mutation(async ({ input }) => {
        const registration = await db.getRegistrationById(input.registrationId);
        if (!registration) {
          throw new TRPCError({ code: 'NOT_FOUND', message: '报名记录不存在' });
        }

        // Check if payment already exists
        const existingPayment = await db.getPaymentByRegistrationId(input.registrationId);
        if (existingPayment && existingPayment.status === 'completed') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: '该报名已支付' });
        }

        // Get activity details
        const activity = await db.getActivityById(registration.activityId);
        if (!activity) {
          throw new TRPCError({ code: 'NOT_FOUND', message: '活动不存在' });
        }

        // Create Stripe checkout session
        const session = await createCheckoutSession({
          registrationId: input.registrationId,
          amount: parseFloat(registration.paymentAmount),
          activityTitle: activity.title,
          studentName: registration.studentName,
          guardianEmail: undefined, // Could add email field to registration if needed
          origin: input.origin,
        });

        // Create or update payment record
        if (existingPayment) {
          await db.updatePayment(existingPayment.id, {
            status: 'pending',
            transactionId: session.id,
          });
        } else {
          await db.createPayment({
            registrationId: input.registrationId,
            amount: registration.paymentAmount,
            currency: 'CNY',
            paymentMethod: 'stripe',
            status: 'pending',
            transactionId: session.id,
          });
        }

        return {
          success: true,
          checkoutUrl: session.url,
          amount: registration.paymentAmount,
        };
      }),

    getByRegistrationId: publicProcedure
      .input(z.object({ registrationId: z.number() }))
      .query(async ({ input }) => {
        return await db.getPaymentByRegistrationId(input.registrationId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
