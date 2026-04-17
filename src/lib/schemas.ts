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
  department: z.enum(['Human Resources', 'Engineering', 'Marketing', 'Sales', 'Operations', 'Finance']),
  jobTitle: z.string().min(2, { message: "Job title must be at least 2 characters." }),
  phone: z.string().optional().or(z.literal('')),
  dateOfBirth: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), { message: "Invalid date" }),
  gender: z.enum(['male', 'female', 'other']).optional(), // Updated to match asianightlife
  address: z.string().optional().or(z.literal('')),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
  avatar: z.string().optional(),
  // New fields from asianightlife schema
  full_name: z.string().min(2, { message: "Full name must be at least 2 characters." }).optional(),
  user_id: z.string().optional(),
  referral_code: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const djSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, { message: "DJ name must be at least 2 characters." }),
  image_url: z.string().optional(),
  bio: z.string().optional().or(z.literal('')),
  genres: z.array(z.string()).optional(), // Changed to array
  country: z.string().optional().or(z.literal('')),
  user_id: z.string().optional(),
  is_active: z.boolean().optional(),
  status: z.string().optional(),
  created_at: z.string().optional(),
  votes_count: z.number().optional(),
  // Backward compatibility
  stageName: z.string().optional(),
  realName: z.string().optional(),
  avatar: z.string().optional(),
  bookingContact: z.string().optional(),
  performanceCount: z.number().optional(),
});

export const venueSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, { message: "Venue name must be at least 2 characters." }),
  slug: z.string().optional(),
  main_image_url: z.string().url({ message: "Please enter a valid image URL." }).optional().or(z.literal("")),
  images: z.string().optional().or(z.literal("")),
  map_embed_url: z.string().optional().or(z.literal("")),
  category: z.string().min(1, { message: "Category is required." }),
  address: z.string().optional().or(z.literal("")),
  price: z.string().optional().or(z.literal("")),
  country: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  hours: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  status: z.enum(["active", "inactive", "draft"]).optional(),
});

// Password policy: at least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const adminUserSchema = z.object({
  id: z.string().optional(),
  username: z.string().min(3, { message: "Username must be at least 3 characters." }),
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters." })
    .regex(passwordRegex, {
      message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)."
    })
    .optional(),
  full_name: z.string().min(2, { message: "Full name must be at least 2 characters." }).optional(),
  email: z.string().email({ message: "Invalid email address." }).optional().or(z.literal('')),
  role: z.string().min(1, { message: "Role is required." }),
  permissions: z.record(z.any()).optional(),
  is_active: z.boolean().optional(),
  avatar: z.string().optional(),
});

// Reset password schema for user management dialog
export const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters." })
    .regex(passwordRegex, {
      message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)."
    }),
  confirmPassword: z.string().min(1, { message: "Please confirm your password." }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ["confirmPassword"],
});

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, { message: "Username is required." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export function getSchema(entityName: string) {
  switch (entityName) {
    case 'User':
      return userSchema;
    case 'Employee':
      return employeeSchema;
    case 'DJ':
      return djSchema;
    case 'Venue':
      return venueSchema;
    case 'AdminUser':
      return adminUserSchema;
    default:
      throw new Error(`Unknown entity: ${entityName}`);
  }
}
