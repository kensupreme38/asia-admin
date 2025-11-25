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
  department: 'Human Resources' | 'Engineering' | 'Marketing' | 'Sales';
  jobTitle: string;
  startDate: string;
};

export type DJ = {
  id: string;
  stageName: string;
  realName: string;
  avatar: string;
  genres: string;
  bookingContact: string;
  performanceCount: number;
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
