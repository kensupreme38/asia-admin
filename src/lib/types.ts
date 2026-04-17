export type User = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'Admin' | 'Member' | 'Guest';
  joinDate: string;
};

export type Employee = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  department: 'Human Resources' | 'Engineering' | 'Marketing' | 'Sales' | 'Operations' | 'Finance';
  jobTitle: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other'; // Updated to match asianightlife schema
  address?: string;
  startDate: string;
  // New fields from asianightlife schema
  full_name?: string; // Preferred field name from asianightlife
  user_id?: string; // Link to auth user
  referral_code?: string; // Employee referral code
  created_at?: string; // Timestamp when employee was created
  updated_at?: string; // Timestamp when employee was last updated
};

export type DJ = {
  id: string;
  avatar: string;            // Required for ManageableEntity constraint
  // Asianightlife fields
  name: string;              // DJ name (from asianightlife)
  image_url?: string;        // Image URL
  bio?: string;              // Biography
  genres?: string[];         // Array of genres
  country?: string;          // Country
  user_id?: string;          // Link to auth user
  is_active?: boolean;       // Active status
  status?: string;           // Status (active, inactive)
  created_at?: string;       // Timestamp
  votes_count?: number;      // Vote count aggregation

  // Keep existing fields for backward compatibility
  stageName?: string;        // Alias for name
  realName?: string;         // Optional real name
  bookingContact?: string;   // Optional booking contact
  performanceCount?: number; // Alias for votes_count
};

export type Venue = {
  id: string;
  name: string;
  slug?: string;
  main_image_url?: string;
  images?: string[];
  map_embed_url?: string;
  category?: string;
  address?: string;
  price?: string;
  country?: string;
  /** Matches client CountrySelector city ids (e.g. Ho Chi Minh City) */
  city?: string;
  phone?: string;
  hours?: string;
  description?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
};

// A generic type for our entities that have an 'id' and 'avatar'
export type ManageableEntity = { id: string; avatar: string } & Record<string, any>;

export type FormFieldConfig<T> = {
  name: keyof T;
  label: string;
  type: 'text' | 'email' | 'select' | 'date' | 'number';
  placeholder?: string;
  options?: readonly { value: string; label: string }[];
};

export type ColumnConfig<T> = {
  accessor: keyof T;
  header: string;
};

export type AdminUser = {
  id: string;
  username: string;
  password?: string; // Only for form, not stored
  full_name?: string;
  email?: string;
  role: string;
  permissions: Record<string, any>;
  is_active: boolean;
  last_login?: string;
  created_at?: string;
  updated_at?: string;
  avatar?: string; // For ManageableEntity compatibility
};