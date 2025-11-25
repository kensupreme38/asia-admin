import { z } from 'zod';

const id = z.string().optional();

export const userSchema = z.object({
  id,
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  role: z.enum(['Admin', 'Member', 'Guest']),
  joinDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
  avatar: z.string().optional(),
});

export const employeeSchema = z.object({
  id,
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  department: z.enum(['Human Resources', 'Engineering', 'Marketing', 'Sales']),
  jobTitle: z.string().min(2, { message: "Job title must be at least 2 characters." }),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
  avatar: z.string().optional(),
});

export const djSchema = z.object({
  id,
  stageName: z.string().min(2, { message: "Stage name must be at least 2 characters." }),
  realName: z.string().min(2, { message: "Real name must be at least 2 characters." }),
  genres: z.string().min(3, { message: "Genres must be at least 3 characters." }),
  bookingContact: z.string().email({ message: "Invalid email address." }),
  performanceCount: z.coerce.number().int().min(0, { message: "Performances must be a positive number." }),
  avatar: z.string().optional(),
});

export function getSchema(entityName: string) {
    switch (entityName) {
      case 'User':
        return userSchema;
      case 'Employee':
        return employeeSchema;
      case 'DJ':
        return djSchema;
      default:
        throw new Error(`Unknown entity: ${entityName}`);
    }
  }
