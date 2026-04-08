import { z } from 'zod';

/**
 * Zod validation schemas for sell project data.
 * Used for inline form validation before submission.
 */

// ─── Customer Info ─────────────────────────────────────────────────────

export const customerInfoSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  email: z.string().email('Invalid email address').or(z.literal('')),
  phone: z.string().regex(/^[\d\s\-().+]*$/, 'Invalid phone format').or(z.literal('')),
  address: z.string().min(5, 'Full address is required').max(200, 'Address too long'),
});

// ─── Utility Info ──────────────────────────────────────────────────────

export const utilitySchema = z.object({
  highBill: z.number().min(1, 'High bill is required').max(10000, 'Check high bill amount'),
  lowBill: z.number().min(0, 'Low bill cannot be negative').max(10000, 'Check low bill amount'),
  allElectric: z.boolean(),
}).refine(data => data.highBill >= data.lowBill, {
  message: 'High bill must be greater than or equal to low bill',
  path: ['lowBill'],
});

// ─── Aurora Data ───────────────────────────────────────────────────────

export const auroraDataSchema = z.object({
  systemSize: z.string().min(1, 'System size is required'),
  battery: z.string().min(1, 'Battery selection is required'),
  financier: z.string().min(1, 'Financier is required'),
  monthlyPayment: z.string().min(1, 'Monthly payment is required'),
  adders: z.array(z.string()).optional(),
});

// ─── Full Sell Project (for submission) ────────────────────────────────

export const sellProjectSubmitSchema = customerInfoSchema.merge(utilitySchema).extend({
  auroraSynced: z.literal(true, { errorMap: () => ({ message: 'Aurora data must be synced before submission' }) }),
});

// ─── Conversion Gate ───────────────────────────────────────────────────
// What's required before a sell project can be converted to a sale

export const conversionGateSchema = customerInfoSchema.merge(utilitySchema).extend({
  auroraSynced: z.literal(true, { errorMap: () => ({ message: 'Sync Aurora data first' }) }),
  creditStatus: z.literal('credit_passed', { errorMap: () => ({ message: 'Credit check must pass' }) }),
});

// ─── Helpers ───────────────────────────────────────────────────────────

export type FieldErrors = Record<string, string>;

/**
 * Validate data against a schema and return field-level errors.
 * Returns null if valid, or a Record<fieldName, errorMessage> if invalid.
 */
export function validateFields<T extends z.ZodType>(
  schema: T,
  data: unknown
): FieldErrors | null {
  const result = schema.safeParse(data);
  if (result.success) return null;

  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join('.');
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  }
  return errors;
}
