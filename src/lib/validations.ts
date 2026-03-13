/**
 * Zod validation schemas.
 *
 * These are the single source of truth for shape and constraints —
 * used both in API route handlers (server-side) and with
 * react-hook-form's zodResolver (client-side).
 */

import { z } from "zod";
import { APPLICATION_STATUSES } from "@/types";

// ---------------------------------------------------------------------------
// Auth schemas
// ---------------------------------------------------------------------------

export const registerSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(100),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ---------------------------------------------------------------------------
// Application schemas
// ---------------------------------------------------------------------------

export const applicationSchema = z.object({
  jobTitle: z.string().min(1, "Job title is required").max(200),
  company: z.string().min(1, "Company name is required").max(200),
  location: z.string().max(200).optional().or(z.literal("")),
  dateApplied: z.string().min(1, "Date applied is required").regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "Date must be in YYYY-MM-DD format"
  ),
  status: z.enum(APPLICATION_STATUSES as [string, ...string[]], {
    errorMap: () => ({ message: "Invalid status" }),
  }),
  notes: z.string().max(5000).optional().or(z.literal("")),
  jobDescription: z.string().max(10000).optional().or(z.literal("")),
  jobLink: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
  salary: z.string().max(100).optional().or(z.literal("")),
  recruiterContact: z.string().max(200).optional().or(z.literal("")),
});

export type ApplicationInput = z.infer<typeof applicationSchema>;

// Partial version for updates (all fields optional except we still validate shape)
export const applicationUpdateSchema = applicationSchema.partial();
export type ApplicationUpdateInput = z.infer<typeof applicationUpdateSchema>;
