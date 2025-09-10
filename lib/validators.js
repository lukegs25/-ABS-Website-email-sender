import { z } from "zod";

export const subscriberSchema = z.object({
  role: z.enum(["student", "teacher"]),
  email: z.string().email(),
  mainOptIn: z.boolean().default(false),
  subgroups: z.array(z.string()).default([]),
  major: z.string().optional(),
  otherMajor: z.string().optional(),
  scaiOptIn: z.boolean().optional(),
});

export const scaiLeadSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  course: z.string().min(1),
  details: z.string().min(1),
});


