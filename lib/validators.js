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

export const jobPostingSchema = z.object({
  title: z.string().min(1, "Job title is required"),
  company: z.string().min(1, "Company name is required"),
  url: z.string().url("Must be a valid URL (include https://)"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  location: z.string().optional(),
  job_type: z.enum(["full-time", "part-time", "internship", "contract"]).default("full-time"),
  contact_email: z.string().email("Must be a valid email address"),
  logo_url: z.string().optional(),
});


