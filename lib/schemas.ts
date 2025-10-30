import { z } from "zod";

export const OCRPositionSchema = z.object({
  code: z.string().regex(/^LK\d{1,2}[A-Za-z]?$/, "invalid LK code"),
  description: z.string().optional().default(""),
  quantity: z.number().int().nonnegative(),
  unitPrice: z.number().nonnegative(),
  totalPrice: z.number().nonnegative(),
  parentLK: z.string().optional(),
});

export const OCRResultSchema = z.object({
  invoiceNumber: z.string().optional().default(""),
  period: z.object({ from: z.string(), to: z.string() }).optional(),
  positions: z.array(OCRPositionSchema).min(1),
  warnings: z.array(z.string()).optional().default([]),
});

export type OCRPosition = z.infer<typeof OCRPositionSchema>;
export type OCRResult = z.infer<typeof OCRResultSchema>;
