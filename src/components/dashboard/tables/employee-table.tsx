"use client";

import * as React from "react";
import {
  MoreHorizontal,
  PlusCircle,
  Search,
  Calendar as CalendarIcon,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ZodSchema } from "zod";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import type { Employee, FormFieldConfig, ColumnConfig } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getSchema } from "@/lib/schemas";
import { useRouter } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface EmployeeTableProps {
  initialData: Employee[];
  initialTotal: number;
}

const employeeFormFields: FormFieldConfig<Employee>[] = [
  { name: "full_name", label: "Full Name", type: "text", placeholder: "Jane Smith" },
  { name: "email", label: "Email", type: "email", placeholder: "jane@work.com" },
  { name: "phone", label: "Phone Number", type: "text", placeholder: "+84 908 123 456" },
  { name: "dateOfBirth", label: "Date of Birth", type: "date" },
  {
    name: "gender", label: "Gender", type: "select", options: [
      { value: "male", label: "Male" },
      { value: "female", label: "Female" },
      { value: "other", label: "Other" },
    ] as const
  },
  { name: "address", label: "Address", type: "text", placeholder: "123 Main Street, City" },
  { name: "referral_code", label: "Referral Code", type: "text", placeholder: "ABC123" },
];

const employeeColumns: ColumnConfig<Employee>[] = [
  { accessor: "name", header: "Name" },
  { accessor: "email", header: "Email" },
  { accessor: "phone", header: "Phone" },
  { accessor: "gender", header: "Gender" },
  { accessor: "referral_code", header: "Referral Code" },
  { accessor: "startDate", header: "Joined" },
];

export function EmployeeTable({ initialData, initialTotal }: EmployeeTableProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [data, setData] = React.useState<Employee[]>(initialData);
  const [totalItems, setTotalItems] = React.useState(initialTotal);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [isDialogOpen, setDialogOpen] = React.useState(false);
  const [isAlertOpen, setAlertOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<Employee | null>(null);
  const [itemToDelete, setItemToDelete] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isFetching, setIsFetching] = React.useState(false);
  const [openDatePickers, setOpenDatePickers] = React.useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  const formSchema = getSchema('Employee');

  const form = useForm<any>({
    resolver: zodResolver(formSchema as unknown as ZodSchema<any>),
  });

  const handleAddNew = () => {
    setSelectedItem(null);
    form.reset({
        full_name: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        gender: 'male',
        address: '',
        referral_code: '',
    });
    setOpenDatePickers({});
    setDialogOpen(true);
  };

  const handleEdit = (item: Employee) => {
    setSelectedItem(item);
    form.reset({
      ...item,
      full_name: item.full_name || item.name || '',
      dateOfBirth: (item as any).date_of_birth || item.dateOfBirth,
    });
    setOpenDatePickers({});
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setItemToDelete(id);
    setAlertOpen(true);
  };

  const fetchData = React.useCallback(async (page: number, search: string) => {
    setIsFetching(true);
    try {
      const response = await fetch(`/api/admin/employees?page=${page}&limit=${itemsPerPage}&search=${encodeURIComponent(search)}`);
      if (!response.ok) throw new Error('Failed to fetch data');
      const result = await response.json();
      setData(result.data.map(mapApiResponseToEmployee));
      setTotalItems(result.total);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || "Failed to fetch employees.",
        variant: 'destructive',
      });
    } finally {
      setIsFetching(false);
    }
  }, [itemsPerPage, toast]);

  // Debounce search term
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch data when page or search changes
  React.useEffect(() => {
    fetchData(currentPage, debouncedSearch);
  }, [currentPage, debouncedSearch, fetchData]);

  const confirmDelete = async () => {
    if (!itemToDelete) {
      setAlertOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/employees/${itemToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete');
      }

      toast({
        title: "Employee Deleted",
        description: "The employee has been successfully deleted.",
      });
      fetchData(currentPage, debouncedSearch);
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || "Failed to delete employee.",
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setAlertOpen(false);
      setItemToDelete(null);
    }
  };

  const onSubmit = async (values: any) => {
    const isEditing = !!selectedItem;
    setIsLoading(true);

    try {
      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing ? `/api/admin/employees/${selectedItem.id}` : `/api/admin/employees`;

      let payload = { ...values };
      
      if (payload.dateOfBirth) {
        payload.date_of_birth = payload.dateOfBirth;
        delete payload.dateOfBirth;
      }
      
      if (payload.full_name || payload.name) {
        payload.full_name = payload.full_name || payload.name;
      }
      
      delete payload.name;
      delete payload.avatar;
      delete payload.department;
      delete payload.jobTitle;
      delete payload.startDate;
      delete payload.id;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${isEditing ? 'update' : 'create'}`);
      }

      const result = await response.json();

      toast({
        title: isEditing ? `Employee Updated` : `Employee Added`,
        description: `The employee has been successfully ${isEditing ? 'updated' : 'added'}.`,
      });

      setDialogOpen(false);
      setSelectedItem(null);
      setOpenDatePickers({});
      fetchData(currentPage, debouncedSearch);
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || `Failed to ${isEditing ? 'update' : 'create'} employee.`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const mapApiResponseToEmployee = (apiData: any): Employee => {
    return {
      id: apiData.id?.toString() || '',
      name: apiData.full_name || apiData.email?.split('@')[0] || 'Unknown',
      full_name: apiData.full_name,
      email: apiData.email || '',
      avatar: apiData.avatar || apiData.image_url || '',
      department: 'Engineering' as const,
      jobTitle: 'Employee',
      phone: apiData.phone,
      dateOfBirth: apiData.date_of_birth || apiData.dateOfBirth,
      gender: apiData.gender,
      address: apiData.address,
      startDate: apiData.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      user_id: apiData.user_id,
      referral_code: apiData.referral_code,
      created_at: apiData.created_at,
      updated_at: apiData.updated_at,
    };
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Reset to first page when search term changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const renderCellContent = (item: Employee, accessor: keyof Employee) => {
    const value = item[accessor];
    if (accessor === 'name') {
      const avatarSrc = item.avatar && (item.avatar.startsWith('http') || item.avatar.includes('/')) 
        ? item.avatar 
        : `https://picsum.photos/seed/${item.avatar || item.id}/40/40`;
        
      return (
        <div className="flex items-center gap-4">
          <Avatar className="hidden h-9 w-9 sm:flex">
            <AvatarImage src={avatarSrc} alt="Avatar" />
            <AvatarFallback>{item.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="font-medium">{value as string}</div>
        </div>
      );
    }
    if (accessor === 'gender') {
      if (!value) return <span className="text-muted-foreground">-</span>;
      let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
      if (value === 'male') variant = "default";
      if (value === 'female') variant = "secondary";
      return <Badge variant={variant}>{value as string}</Badge>;
    }
    if (accessor === 'phone' || accessor === 'address') {
      if (!value || value === '') return <span className="text-muted-foreground">-</span>;
      return value as string;
    }
    return value as string;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Employee Management</CardTitle>
        <CardDescription>
          Manage your employees here.
        </CardDescription>
        <div className="flex items-center justify-between gap-2 pt-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search employees..."
              className="w-full rounded-lg bg-card pl-8 md:w-[200px] lg:w-[320px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog 
            open={isDialogOpen} 
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) {
                setTimeout(() => {
                  document.body.style.pointerEvents = 'auto';
                }, 0);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 gap-1" onClick={handleAddNew}>
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Add Employee
                </span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {selectedItem ? "Edit Employee" : "Add Employee"}
                </DialogTitle>
                <DialogDescription>
                  {selectedItem ? "Update employee details." : "Enter details for the new employee."}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                  {employeeFormFields.map((field) => (
                    <FormField
                      key={String(field.name)}
                      control={form.control}
                      name={field.name as any}
                      render={({ field: formField }) => (
                        <FormItem>
                          <FormLabel>{field.label}</FormLabel>
                          <FormControl>
                            {field.type === 'select' ? (
                              <Select onValueChange={formField.onChange} defaultValue={formField.value}>
                                <SelectTrigger>
                                  <SelectValue placeholder={field.placeholder} />
                                </SelectTrigger>
                                <SelectContent>
                                  {field.options?.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : field.type === 'date' ? (
                                <Popover 
                                  open={openDatePickers[String(field.name)] || false}
                                  onOpenChange={(open) => setOpenDatePickers(prev => ({ ...prev, [String(field.name)]: open }))}
                                  modal={false}
                                >
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant={"outline"}
                                      type="button"
                                      className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !formField.value && "text-muted-foreground"
                                      )}
                                    >
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {formField.value ? (() => {
                                        try {
                                          let dateValue: Date;
                                          if (typeof formField.value === 'string') {
                                            const [year, month, day] = formField.value.split('-').map(Number);
                                            dateValue = new Date(year, month - 1, day);
                                          } else {
                                            dateValue = new Date(formField.value);
                                          }
                                          if (isNaN(dateValue.getTime())) return <span>Pick a date</span>;
                                          return format(dateValue, "PPP");
                                        } catch {
                                          return <span>Pick a date</span>;
                                        }
                                      })() : <span>Pick a date</span>}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0 z-[100]" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                                    <Calendar
                                      mode="single"
                                      selected={formField.value ? (() => {
                                        try {
                                          let dateValue: Date;
                                          if (typeof formField.value === 'string') {
                                            const [year, month, day] = formField.value.split('-').map(Number);
                                            dateValue = new Date(year, month - 1, day);
                                          } else {
                                            dateValue = new Date(formField.value);
                                          }
                                          return isNaN(dateValue.getTime()) ? undefined : dateValue;
                                        } catch {
                                          return undefined;
                                        }
                                      })() : undefined}
                                      onSelect={(date) => {
                                        if (date) {
                                          const year = date.getFullYear();
                                          const month = String(date.getMonth() + 1).padStart(2, '0');
                                          const day = String(date.getDate()).padStart(2, '0');
                                          const dateString = `${year}-${month}-${day}`;
                                          formField.onChange(dateString);
                                          setTimeout(() => {
                                            setOpenDatePickers(prev => ({ ...prev, [String(field.name)]: false }));
                                          }, 100);
                                        } else {
                                          formField.onChange('');
                                        }
                                      }}
                                      captionLayout="dropdown"
                                    />
                                  </PopoverContent>
                                </Popover>
                            ) : (
                              <Input
                                {...formField}
                                type={field.type}
                                placeholder={field.placeholder}
                                value={formField.value || ''}
                              />
                            )}
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={isLoading}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Saving...' : 'Save Employee'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {employeeColumns.map((col) => <TableHead key={String(col.accessor)}>{col.header}</TableHead>)}
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isFetching ? (
              <TableRow>
                <TableCell colSpan={employeeColumns.length + 1} className="h-24 text-center">
                  Loading employees...
                </TableCell>
              </TableRow>
            ) : data.length > 0 ? (
              data.map((item) => (
                <TableRow key={item.id}>
                  {employeeColumns.map((col) => (
                    <TableCell key={`${item.id}-${String(col.accessor)}`}>
                      {renderCellContent(item, col.accessor)}
                    </TableCell>
                  ))}
                  <TableCell>
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEdit(item)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(item.id)}>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={employeeColumns.length + 1} className="h-24 text-center">
                  No employees found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {totalPages > 1 && (
          <div className="flex items-center justify-end space-x-2 py-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage((prev) => Math.max(prev - 1, 1));
                    }}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(page);
                      }}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages));
                    }}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>
      <AlertDialog 
        open={isAlertOpen} 
        onOpenChange={(open) => {
          setAlertOpen(open);
          if (!open) {
            setTimeout(() => {
              document.body.style.pointerEvents = 'auto';
            }, 0);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the employee.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isLoading} className={buttonVariants({ variant: "destructive" })}>
              {isLoading ? 'Deleting...' : 'Continue'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
