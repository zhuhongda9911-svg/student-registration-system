import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import * as newsDb from "./news-db";
import * as competitionsDb from "./competitions-db";
import * as coursesDb from "./courses-db";
import * as adminsDb from "./admins-db";
import { createCheckoutSession } from "./stripe";
import bcrypt from "bcryptjs";

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

  // Admin authentication and management
  admin: router({
    login: publicProcedure
      .input(z.object({
        username: z.string().min(1),
        password: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const admin = await adminsDb.getAdminByUsername(input.username);
        
        if (!admin || !admin.isActive) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: '用户名或密码错误' });
        }
        
        const isValidPassword = await bcrypt.compare(input.password, admin.password);
        if (!isValidPassword) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: '用户名或密码错误' });
        }
        
        // Update last login time
        await adminsDb.updateLastLoginAt(admin.id);
        
        // Set admin session cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie('admin_session', JSON.stringify({ adminId: admin.id, username: admin.username, name: admin.name }), {
          ...cookieOptions,
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        
        return {
          success: true,
          admin: {
            id: admin.id,
            username: admin.username,
            name: admin.name,
            email: admin.email,
          },
        };
      }),
    
    me: publicProcedure.query(({ ctx }) => {
      const adminSession = ctx.req.cookies?.admin_session;
      if (!adminSession) return null;
      
      try {
        return JSON.parse(adminSession);
      } catch {
        return null;
      }
    }),
    
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie('admin_session', { ...cookieOptions, maxAge: -1 });
      return { success: true };
    }),
    
    list: adminProcedure.query(async () => {
      return await adminsDb.getAllAdmins();
    }),
    
    create: adminProcedure
      .input(z.object({
        username: z.string().min(3),
        password: z.string().min(4),
        name: z.string().min(1),
        email: z.string().email().optional(),
        phone: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const hashedPassword = await bcrypt.hash(input.password, 10);
        
        const admin = await adminsDb.createAdmin({
          username: input.username,
          password: hashedPassword,
          name: input.name,
          email: input.email,
          phone: input.phone,
          createdBy: ctx.user.id,
        });
        
        return { success: true, admin };
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        password: z.string().min(4).optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const updates: any = {};
        if (input.name) updates.name = input.name;
        if (input.email !== undefined) updates.email = input.email;
        if (input.phone !== undefined) updates.phone = input.phone;
        if (input.isActive !== undefined) updates.isActive = input.isActive;
        if (input.password) {
          updates.password = await bcrypt.hash(input.password, 10);
        }
        
        const admin = await adminsDb.updateAdmin(input.id, updates);
        return { success: true, admin };
      }),
    
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await adminsDb.deleteAdmin(input.id);
        return { success: true };
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

  // News routes
  news: router({    create: adminProcedure
      .input(z.object({
        title: z.string().min(1),
        summary: z.string().optional(),
        content: z.string().min(1),
        category: z.string().min(1),
        coverImage: z.string().optional(),
        author: z.string().optional(),
        source: z.string().optional(),
        publishDate: z.string(),
        isPublished: z.boolean().default(true),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await newsDb.createNews({
          ...input,
          publishDate: new Date(input.publishDate),
          createdBy: ctx.user.id,
        });
        return { success: true, id: result[0].insertId };
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        summary: z.string().optional(),
        content: z.string().optional(),
        category: z.string().optional(),
        coverImage: z.string().optional(),
        author: z.string().optional(),
        source: z.string().optional(),
        publishDate: z.string().optional(),
        isPublished: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, publishDate, ...rest } = input;
        const data: any = { ...rest };
        if (publishDate) {
          data.publishDate = new Date(publishDate);
        }
        await newsDb.updateNews(id, data);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await newsDb.deleteNews(input.id);
        return { success: true };
      }),

    list: publicProcedure
      .input(z.object({
        category: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await newsDb.listNews({
          ...input,
          publishedOnly: true,
        });
      }),

    listAll: adminProcedure
      .input(z.object({
        category: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await newsDb.listNews(input);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const newsItem = await newsDb.getNewsById(input.id);
        if (!newsItem) {
          throw new TRPCError({ code: 'NOT_FOUND', message: '资讯不存在' });
        }
        return newsItem;
      }),

    getCategories: publicProcedure.query(async () => {
      return await newsDb.getNewsCategories();
    }),
  }),

  // Competitions routes
  competitions: router({
    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        organizer: z.string().optional(),
        category: z.string().optional(),
        level: z.enum(["国家级", "省级", "市级", "校级"]).optional(),
        description: z.string().optional(),
        requirements: z.string().optional(),
        awards: z.string().optional(),
        registrationStartDate: z.string().optional(),
        registrationEndDate: z.string().optional(),
        competitionDate: z.string().optional(),
        resultAnnouncementDate: z.string().optional(),
        officialWebsite: z.string().optional(),
        contactInfo: z.string().optional(),
        status: z.enum(["即将开始", "报名中", "进行中", "已结束"]).default("即将开始"),
        isWhitelisted: z.boolean().default(false),
        isPublished: z.boolean().default(true),
      }))
      .mutation(async ({ ctx, input }) => {
        const data: any = { ...input, createdBy: ctx.user.id };
        if (input.registrationStartDate) data.registrationStartDate = new Date(input.registrationStartDate);
        if (input.registrationEndDate) data.registrationEndDate = new Date(input.registrationEndDate);
        if (input.competitionDate) data.competitionDate = new Date(input.competitionDate);
        if (input.resultAnnouncementDate) data.resultAnnouncementDate = new Date(input.resultAnnouncementDate);
        const result = await competitionsDb.createCompetition(data);
        return { success: true, id: result[0].insertId };
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        organizer: z.string().optional(),
        category: z.string().optional(),
        level: z.enum(["国家级", "省级", "市级", "校级"]).optional(),
        description: z.string().optional(),
        requirements: z.string().optional(),
        awards: z.string().optional(),
        registrationStartDate: z.string().optional(),
        registrationEndDate: z.string().optional(),
        competitionDate: z.string().optional(),
        resultAnnouncementDate: z.string().optional(),
        officialWebsite: z.string().optional(),
        contactInfo: z.string().optional(),
        status: z.enum(["即将开始", "报名中", "进行中", "已结束"]).optional(),
        isWhitelisted: z.boolean().optional(),
        isPublished: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, registrationStartDate, registrationEndDate, competitionDate, resultAnnouncementDate, ...rest } = input;
        const data: any = { ...rest };
        if (registrationStartDate) data.registrationStartDate = new Date(registrationStartDate);
        if (registrationEndDate) data.registrationEndDate = new Date(registrationEndDate);
        if (competitionDate) data.competitionDate = new Date(competitionDate);
        if (resultAnnouncementDate) data.resultAnnouncementDate = new Date(resultAnnouncementDate);
        await competitionsDb.updateCompetition(id, data);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await competitionsDb.deleteCompetition(input.id);
        return { success: true };
      }),

    list: publicProcedure
      .input(z.object({
        category: z.string().optional(),
        level: z.string().optional(),
        status: z.string().optional(),
        isWhitelisted: z.boolean().optional(),
        search: z.string().optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await competitionsDb.listCompetitions({
          ...input,
          publishedOnly: true,
        });
      }),

    listAll: adminProcedure
      .input(z.object({
        category: z.string().optional(),
        level: z.string().optional(),
        status: z.string().optional(),
        isWhitelisted: z.boolean().optional(),
        search: z.string().optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await competitionsDb.listCompetitions(input);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const competition = await competitionsDb.getCompetitionById(input.id);
        if (!competition) {
          throw new TRPCError({ code: 'NOT_FOUND', message: '竞赛不存在' });
        }
        return competition;
      }),

    getCategories: publicProcedure.query(async () => {
      return await competitionsDb.getCompetitionCategories();
    }),
  }),

  // Courses routes
  courses: router({
    create: adminProcedure
      .input(z.object({
        title: z.string().min(1),
        teacherName: z.string().min(1),
        teacherTitle: z.string().optional(),
        teacherSchool: z.string().optional(),
        teacherIntro: z.string().optional(),
        subject: z.string().min(1),
        grade: z.string().min(1),
        description: z.string().optional(),
        syllabus: z.string().optional(),
        schedule: z.string().optional(),
        location: z.string().optional(),
        price: z.string(),
        maxStudents: z.number().optional(),
        courseType: z.enum(["一对一", "小班课", "大班课"]),
        duration: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        contactPhone: z.string().optional(),
        contactWechat: z.string().optional(),
        isActive: z.boolean().default(true),
      }))
      .mutation(async ({ ctx, input }) => {
        const data: any = { ...input, createdBy: ctx.user.id };
        if (input.startDate) data.startDate = new Date(input.startDate);
        if (input.endDate) data.endDate = new Date(input.endDate);
        const result = await coursesDb.createCourse(data);
        return { success: true, id: result[0].insertId };
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        teacherName: z.string().optional(),
        teacherTitle: z.string().optional(),
        teacherSchool: z.string().optional(),
        teacherIntro: z.string().optional(),
        subject: z.string().optional(),
        grade: z.string().optional(),
        description: z.string().optional(),
        syllabus: z.string().optional(),
        schedule: z.string().optional(),
        location: z.string().optional(),
        price: z.string().optional(),
        maxStudents: z.number().optional(),
        courseType: z.enum(["一对一", "小班课", "大班课"]).optional(),
        duration: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        contactPhone: z.string().optional(),
        contactWechat: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, startDate, endDate, ...rest } = input;
        const data: any = { ...rest };
        if (startDate) data.startDate = new Date(startDate);
        if (endDate) data.endDate = new Date(endDate);
        await coursesDb.updateCourse(id, data);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await coursesDb.deleteCourse(input.id);
        return { success: true };
      }),

    list: publicProcedure
      .input(z.object({
        subject: z.string().optional(),
        grade: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await coursesDb.listCourses({
          ...input,
          activeOnly: true,
        });
      }),

    listAll: adminProcedure
      .input(z.object({
        subject: z.string().optional(),
        grade: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await coursesDb.listCourses(input);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const course = await coursesDb.getCourseById(input.id);
        if (!course) {
          throw new TRPCError({ code: 'NOT_FOUND', message: '课程不存在' });
        }
        return course;
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
