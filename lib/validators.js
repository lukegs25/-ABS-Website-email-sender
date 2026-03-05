import { z } from "zod";

export const subscriberSchema = z.object({
  role: z.enum(["student", "teacher"]),
  email: z.string().email(),
  mainOptIn: z.boolean().default(false),
  subgroups: z.array(z.string()).default([]),
  major: z.string().optional(),
  otherMajor: z.string().optional(),
  scaiOptIn: z.boolean().optional(),
  advisorInterest: z.boolean().optional(),
  notifyNewMajorsOrSubgroups: z.boolean().optional(),
  otherAreasInterest: z.string().optional(),
});

export const scaiLeadSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  course: z.string().min(1),
  details: z.string().min(1),
});

export const postJobSchema = z.object({
  title: z.string().min(1, "Job title is required"),
  company: z.string().min(1, "Company name is required"),
  url: z.string().min(1, "Application link or email is required").refine(
    (val) => val.startsWith("http") || val.startsWith("mailto:") || val.includes("@"),
    "Enter a valid URL (https://...) or email (mailto:hr@company.com)"
  ).transform((val) => (val.includes("@") && !val.startsWith("mailto:")) ? `mailto:${val}` : val),
  description: z.string().optional(),
});


