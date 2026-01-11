"use client";

import * as React from "react";
import {
  MoreHorizontal,
  PlusCircle,
  Search,
  Eye,
  EyeOff,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ZodSchema } from "zod";

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
import { useToast } from "@/hooks/use-toast";
import type { User, FormFieldConfig, ColumnConfig, AdminUser } from "@/lib/types";
import { getSchema, resetPasswordSchema } from "@/lib/schemas";
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

interface UserTableProps {
  initialData: User[];
  initialTotal: number;
}

const userFormFields: FormFieldConfig<AdminUser>[] = [
  { name: "username", label: "Username", type: "text", placeholder: "johndoe" },
  { name: "full_name", label: "Full Name", type: "text", placeholder: "John Doe" },
  { name: "email", label: "Email", type: "email", placeholder: "john@example.com" },
  {
    name: "role", label: "Role", type: "select", options: [
      { value: "admin", label: "Admin" },
      { value: "member", label: "Member" },
      { value: "guest", label: "Guest" },
    ] as const
  },
];

const userColumns: ColumnConfig<User>[] = [
  { accessor: "name", header: "Name" },
  { accessor: "email", header: "Email" },
  { accessor: "role", header: "Role" },
  { accessor: "joinDate", header: "Join Date" },
];

export function UserTable({ initialData, initialTotal }: UserTableProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [data, setData] = React.useState<User[]>(initialData);
  const [totalItems, setTotalItems] = React.useState(initialTotal);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [isDialogOpen, setDialogOpen] = React.useState(false);
  const [isAlertOpen, setAlertOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<User | null>(null);
  const [itemToDelete, setItemToDelete] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isFetching, setIsFetching] = React.useState(false);
  const [isResetPasswordOpen, setResetPasswordOpen] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  const formSchema = getSchema('AdminUser');

  const form = useForm<any>({
    resolver: zodResolver(formSchema as unknown as ZodSchema<any>),
  });

  const resetForm = useForm<any>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const isEditing = !!selectedItem;

  const handleAddNew = () => {
    setSelectedItem(null);
    form.reset({
        username: '',
        full_name: '',
        email: '',
        role: 'member',
        password: '',
    });
    setDialogOpen(true);
  };

  const handleEdit = (item: User) => {
    setSelectedItem(item);
    form.reset({
      ...item,
      username: (item as any).username || item.name || '',
      full_name: (item as any).full_name || item.name || '',
      email: item.email || '',
      role: item.role?.toLowerCase() || 'member',
    });
    setDialogOpen(true);
  };

  const handleResetPassword = (item: User) => {
    setSelectedItem(item);
    resetForm.reset({
      password: '',
      confirmPassword: '',
    });
    setResetPasswordOpen(true);
  };

  const handleDelete = (id: string) => {
    setItemToDelete(id);
    setAlertOpen(true);
  };

  const fetchData = React.useCallback(async (page: number, search: string) => {
    setIsFetching(true);
    try {
      const response = await fetch(`/api/admin/users?page=${page}&limit=${itemsPerPage}&search=${encodeURIComponent(search)}`);
      if (!response.ok) throw new Error('Failed to fetch data');
      const result = await response.json();
      setData(result.data.map(mapApiResponseToUser));
      setTotalItems(result.total);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || "Failed to fetch users.",
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
      const response = await fetch(`/api/admin/users/${itemToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete');
      }

      toast({
        title: "User Deleted",
        description: "The user has been successfully deleted.",
      });
      fetchData(currentPage, debouncedSearch);
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || "Failed to delete user.",
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setAlertOpen(false);
      setItemToDelete(null);
    }
  };

  const onResetPassword = async (values: any) => {
    if (!selectedItem) return;
    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/users/${selectedItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: values.password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reset password');
      }

      toast({
        title: "Password Reset",
        description: "The user's password has been successfully updated.",
      });

      setResetPasswordOpen(false);
      setSelectedItem(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || "Failed to reset password.",
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (values: any) => {
    setIsLoading(true);

    try {
      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing ? `/api/admin/users/${selectedItem.id}` : `/api/admin/users`;

      let payload = { ...values };
      if (!isEditing) {
        delete payload.id;
        if (!payload.password) {
            throw new Error('Password is required when creating a new user.');
        }
      } else {
        if (!payload.password || payload.password.trim() === '') {
          delete payload.password;
        }
      }
      
      delete payload.joinDate;
      delete payload.avatar;
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
        title: isEditing ? `User Updated` : `User Added`,
        description: `The user has been successfully ${isEditing ? 'updated' : 'added'}.`,
      });

      setDialogOpen(false);
      setSelectedItem(null);
      fetchData(currentPage, debouncedSearch);
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || `Failed to ${isEditing ? 'update' : 'create'} user.`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const mapApiResponseToUser = (apiData: any): User => {
    let mappedRole: 'Admin' | 'Member' | 'Guest' = 'Member';
    if (apiData.role) {
      const roleLower = apiData.role.toLowerCase();
      if (roleLower.includes('admin') || roleLower.includes('super')) {
        mappedRole = 'Admin';
      } else if (roleLower.includes('moderator') || roleLower.includes('member')) {
        mappedRole = 'Member';
      } else {
        mappedRole = 'Guest';
      }
    }
    
    const avatarSeed = apiData.username || apiData.id?.toString() || 'default';
    const avatarNumber = Math.abs(avatarSeed.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)) % 25 + 1;
    
    return {
      id: apiData.id?.toString() || '',
      name: apiData.full_name || apiData.username || '',
      email: apiData.email || '',
      avatar: apiData.avatar || '',
      role: mappedRole,
      joinDate: apiData.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      // Compatibility fields
      username: apiData.username,
      full_name: apiData.full_name,
    } as any;
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Reset to first page when search term changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const renderCellContent = (item: User, accessor: keyof User) => {
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
    if (accessor === 'role') {
      let variant: "default" | "secondary" | "destructive" | "outline" = "default";
      if (value === 'Admin') variant = "default";
      if (value === 'Member') variant = "secondary";
      if (value === 'Guest') variant = "outline";
      return <Badge variant={variant}>{value as string}</Badge>;
    }
    return value as string;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>
          Manage your admin users here.
        </CardDescription>
        <div className="flex items-center justify-between gap-2 pt-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search users..."
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
                  Add User
                </span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {selectedItem ? "Edit User" : "Add User"}
                </DialogTitle>
                <DialogDescription>
                  {selectedItem ? "Update user details." : "Enter details for the new user."}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                  {userFormFields.map((field) => (
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
                            ) : (
                              <Input
                                {...formField}
                                type={field.type}
                                placeholder={field.placeholder}
                                value={formField.value || ''}
                                disabled={field.name === 'email' && isEditing}
                              />
                            )}
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                  {!isEditing && (
                     <FormField
                        control={form.control}
                        name="password"
                        render={({ field: formField }) => (
                        <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                            <Input
                                {...formField}
                                type="password"
                                placeholder="Enter password"
                                value={formField.value || ''}
                            />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                  )}
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={isLoading}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Saving...' : 'Save User'}
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
              {userColumns.map((col) => <TableHead key={String(col.accessor)}>{col.header}</TableHead>)}
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isFetching ? (
              <TableRow>
                <TableCell colSpan={userColumns.length + 1} className="h-24 text-center">
                  Loading users...
                </TableCell>
              </TableRow>
            ) : data.length > 0 ? (
              data.map((item) => (
                <TableRow key={item.id}>
                  {userColumns.map((col) => (
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
                        <DropdownMenuItem onClick={() => handleResetPassword(item)}>Reset Password</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(item.id)}>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={userColumns.length + 1} className="h-24 text-center">
                  No users found.
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
              This action cannot be undone. This will permanently delete the user.
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

      <Dialog 
        open={isResetPasswordOpen} 
        onOpenChange={(open) => {
          setResetPasswordOpen(open);
          if (!open) {
            resetForm.reset();
            setShowPassword(false);
            setShowConfirmPassword(false);
            setTimeout(() => {
              document.body.style.pointerEvents = 'auto';
            }, 0);
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter a new password for {selectedItem?.name}.
            </DialogDescription>
          </DialogHeader>
          <Form {...resetForm}>
            <form onSubmit={resetForm.handleSubmit(onResetPassword)} className="grid gap-4 py-4">
              <FormField
                control={resetForm.control}
                name="password"
                render={({ field: formField }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...formField}
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter new password"
                          value={formField.value || ''}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="sr-only">
                            {showPassword ? "Hide password" : "Show password"}
                          </span>
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={resetForm.control}
                name="confirmPassword"
                render={({ field: formField }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...formField}
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm new password"
                          value={formField.value || ''}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="sr-only">
                            {showConfirmPassword ? "Hide password" : "Show password"}
                          </span>
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setResetPasswordOpen(false)} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Reset Password'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
