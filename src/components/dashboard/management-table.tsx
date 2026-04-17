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
import type { ManageableEntity, FormFieldConfig, ColumnConfig } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getSchema } from "@/lib/schemas";
import { useRouter } from "next/navigation";

interface ManagementTableProps<T extends ManageableEntity> {
  entityName: string;
  initialData: T[];
  formFields: FormFieldConfig<T>[];
  columns: ColumnConfig<T>[];
  searchField: keyof T;
}

// Map entity names to API endpoints
const getApiEndpoint = (entityName: string): string => {
  const endpointMap: Record<string, string> = {
    'User': '/api/admin/users',
    'AdminUser': '/api/admin/users',
    'Employee': '/api/admin/employees',
    'DJ': '/api/admin/djs',
  };
  return endpointMap[entityName] || '/api/admin/users';
};

export function ManagementTable<T extends ManageableEntity>({
  entityName,
  initialData,
  formFields,
  columns,
  searchField,
}: ManagementTableProps<T>) {
  const { toast } = useToast();
  const router = useRouter();
  const [data, setData] = React.useState<T[]>(initialData);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isDialogOpen, setDialogOpen] = React.useState(false);
  const [isAlertOpen, setAlertOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<T | null>(null);
  const [itemToDelete, setItemToDelete] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const formSchema = getSchema(entityName);

  const form = useForm<T>({
    resolver: zodResolver(formSchema as unknown as ZodSchema<T>),
  });

  const handleAddNew = () => {
    setSelectedItem(null);
    form.reset({} as T);
    setDialogOpen(true);
  };

  const handleEdit = (item: T) => {
    setSelectedItem(item);
    // Map item data for form based on entity type
    let formData: any = { ...item };
    
    if (entityName === 'User' || entityName === 'AdminUser') {
      // Map User type to AdminUser form fields
      formData = {
        ...item,
        username: (item as any).username || (item as any).name || '',
        full_name: (item as any).full_name || (item as any).name || '',
        email: (item as any).email || '',
        role: (item as any).role?.toLowerCase() || 'member',
        password: '', // Don't pre-fill password for security
      };
    } else if (entityName === 'Employee') {
      // Map date_of_birth to dateOfBirth for form
      formData = {
        ...item,
        full_name: (item as any).full_name || (item as any).name || '',
        dateOfBirth: (item as any).date_of_birth || (item as any).dateOfBirth,
      };
    }
    
    form.reset(formData);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setItemToDelete(id);
    setAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) {
      setAlertOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const apiEndpoint = getApiEndpoint(entityName);
      console.log(`[DELETE] Attempting to delete ${entityName} with ID: ${itemToDelete}`);
      console.log(`[DELETE] API endpoint: ${apiEndpoint}/${itemToDelete}`);
      
      const response = await fetch(`${apiEndpoint}/${itemToDelete}`, {
        method: 'DELETE',
      });

      console.log(`[DELETE] Response status: ${response.status}, ok: ${response.ok}`);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[DELETE] Error response:', errorData);
        
        // Check if it's an RLS/permissions issue
        if (errorData.error && errorData.error.includes('RLS') || errorData.error.includes('permissions')) {
          // Try to check environment setup
          try {
            const envCheck = await fetch('/api/admin/check-env');
            if (envCheck.ok) {
              const envData = await envCheck.json();
              if (!envData.hasServiceRoleKey) {
                throw new Error(
                  'Service Role Key is not configured. Please add SUPABASE_SERVICE_ROLE_KEY to .env.local and restart the server. See ENV_SETUP.md for instructions.'
                );
              }
            }
          } catch (envErr) {
            // Ignore env check errors
          }
        }
        
        throw new Error(errorData.error || 'Failed to delete');
      }

      const result = await response.json();
      console.log('[DELETE] Success response:', result);

      // Remove from local state immediately for better UX
      setData(data.filter((item) => item.id !== itemToDelete));
      
      toast({
        title: `${entityName} Deleted`,
        description: `The ${entityName.toLowerCase()} has been successfully deleted.`,
      });

      // Refresh the page to get updated data
      router.refresh();
    } catch (error: any) {
      console.error('[DELETE] Error deleting:', error);
      console.error('[DELETE] Error stack:', error.stack);
      toast({
        title: 'Error',
        description: error.message || `Failed to delete ${entityName.toLowerCase()}.`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setAlertOpen(false);
      setItemToDelete(null);
    }
  };

  const onSubmit = async (values: T) => {
    const isEditing = !!selectedItem;
    setIsLoading(true);

    try {
      const apiEndpoint = getApiEndpoint(entityName);
      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing ? `${apiEndpoint}/${selectedItem.id}` : apiEndpoint;

      // Prepare payload based on entity type
      let payload: any = { ...values };
      
      // Remove id from payload for POST requests
      if (!isEditing) {
        delete payload.id;
      }

      // Map fields for different entity types
      if (entityName === 'User' || entityName === 'AdminUser') {
        // For new users, password is required
        if (!isEditing && !payload.password) {
          return toast({
            title: 'Error',
            description: 'Password is required when creating a new user.',
            variant: 'destructive',
          });
        }
        // For editing, only include password if provided
        if (isEditing && (!payload.password || payload.password.trim() === '')) {
          delete payload.password; // Don't update password if empty
        }
        // Remove fields not used in API
        delete payload.joinDate;
        delete payload.avatar;
        delete payload.id; // Remove id for POST requests
      } else if (entityName === 'Employee') {
        // Map dateOfBirth to date_of_birth for database
        if (payload.dateOfBirth) {
          payload.date_of_birth = payload.dateOfBirth;
          delete payload.dateOfBirth;
        }
        // Use full_name if available, otherwise use name
        if (payload.full_name || payload.name) {
          payload.full_name = payload.full_name || payload.name;
        }
        // Remove fields not used in API
        delete payload.name; // Remove name, use full_name instead
        delete payload.avatar;
        delete payload.department;
        delete payload.jobTitle;
        delete payload.startDate;
        delete payload.id; // Remove id for POST requests
      } else if (entityName === 'DJ') {
        // For DJs, ensure is_active and status are set
        if (payload.is_active === undefined) {
          payload.is_active = true;
        }
        if (!payload.status) {
          payload.status = 'active';
        }
      }

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

      // Update local state for immediate UI feedback
      if (isEditing) {
        // Map the API result to entity format
        const mappedResult = mapApiResponseToEntity(result, entityName);
        setData(data.map((item) => (item.id === selectedItem.id ? mappedResult : item)));
      } else {
        // Map the result back to our type format
        const mappedResult = mapApiResponseToEntity(result, entityName);
        setData([mappedResult, ...data]);
      }

      toast({
        title: isEditing ? `${entityName} Updated` : `${entityName} Added`,
        description: `The ${entityName.toLowerCase()} has been successfully ${isEditing ? 'updated' : 'added'}.`,
      });

      setDialogOpen(false);
      setSelectedItem(null);
      
      // Refresh the page to get updated data
      router.refresh();
    } catch (error: any) {
      console.error('Error saving:', error);
      toast({
        title: 'Error',
        description: error.message || `Failed to ${isEditing ? 'update' : 'create'} ${entityName.toLowerCase()}.`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to map API response to entity format
  const mapApiResponseToEntity = (apiData: any, entityType: string): T => {
    if (entityType === 'User' || entityType === 'AdminUser') {
      // Map admin_users response to User type
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
        avatar: String(avatarNumber),
        role: mappedRole,
        joinDate: apiData.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        // Include AdminUser fields for form compatibility
        username: apiData.username,
        full_name: apiData.full_name,
      } as T;
    } else if (entityType === 'Employee') {
      return {
        id: apiData.id?.toString() || '',
        name: apiData.full_name || apiData.email?.split('@')[0] || 'Unknown',
        full_name: apiData.full_name,
        email: apiData.email || '',
        avatar: String(Math.floor(Math.random() * 25) + 1),
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
      } as T;
    } else if (entityType === 'DJ') {
      return {
        id: apiData.id?.toString() || '',
        name: apiData.name,
        stageName: apiData.name,
        image_url: apiData.image_url,
        avatar: apiData.image_url || String(Math.floor(Math.random() * 25) + 1),
        bio: apiData.bio,
        genres: apiData.genres || [],
        country: apiData.country,
        user_id: apiData.user_id,
        is_active: apiData.is_active,
        status: apiData.status,
        created_at: apiData.created_at,
        votes_count: 0,
        performanceCount: 0,
      } as T;
    }
    return apiData as T;
  };

  const filteredData = React.useMemo(() => {
    if (!searchTerm) return data;
    return data.filter((item) => {
      const fieldValue = item[searchField];
      if (typeof fieldValue === 'string') {
        return fieldValue.toLowerCase().includes(searchTerm.toLowerCase());
      }
      return false;
    });
  }, [data, searchTerm, searchField]);

  const getAvatarFallback = (item: T) => {
    const name = item.name || item.stageName || 'U';
    return name.substring(0, 2).toUpperCase();
  };

  const renderCellContent = (item: T, accessor: keyof T) => {
    const value = item[accessor];
    if (accessor === 'name' || accessor === 'stageName') {
      return (
        <div className="flex items-center gap-4">
          <Avatar className="hidden h-9 w-9 sm:flex">
            <AvatarImage src={`https://picsum.photos/seed/${item.avatar}/40/40`} alt="Avatar" data-ai-hint="person face" />
            <AvatarFallback>{getAvatarFallback(item)}</AvatarFallback>
          </Avatar>
          <div className="font-medium">{value as string}</div>
        </div>
      );
    }
    if (accessor === 'role' || accessor === 'department') {
      let variant: "default" | "secondary" | "destructive" | "outline" = "default";
      if (value === 'Admin' || value === 'Engineering') variant = "default";
      if (value === 'Member' || value === 'Marketing') variant = "secondary";
      if (value === 'Guest' || value === 'Sales') variant = "outline";
      return <Badge variant={variant}>{value as string}</Badge>;
    }
    if (accessor === 'gender') {
      if (!value) return <span className="text-muted-foreground">-</span>;
      let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
      if (value === 'Male') variant = "default";
      if (value === 'Female') variant = "secondary";
      return <Badge variant={variant}>{value as string}</Badge>;
    }
    if (accessor === 'phone' || accessor === 'address') {
      if (!value || value === '') return <span className="text-muted-foreground">-</span>;
      return value as string;
    }
    if (typeof value === 'number') {
      return value.toString();
    }
    return value as string;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{entityName} Management</CardTitle>
        <CardDescription>
          Manage your {entityName.toLowerCase()}s here. You can add, edit, or delete entries.
        </CardDescription>
        <div className="flex items-center justify-between gap-2 pt-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={`Search by ${String(searchField)}...`}
              className="w-full rounded-lg bg-card pl-8 md:w-[200px] lg:w-[320px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 gap-1" onClick={handleAddNew}>
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Add {entityName}
                </span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {selectedItem ? "Edit" : "Add"} {entityName || "Item"}
                </DialogTitle>
                <DialogDescription>
                  {selectedItem 
                    ? "Update the details below." 
                    : `Enter the details for the new ${entityName?.toLowerCase() || "item"}.`}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                  {formFields.map((field) => (
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
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full justify-start text-left font-normal",
                                      !formField.value && "text-muted-foreground"
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {formField.value ? format(new Date(formField.value), "PPP") : <span>Pick a date</span>}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={formField.value ? new Date(formField.value) : undefined}
                                    onSelect={(date) => formField.onChange(date?.toISOString().split('T')[0])}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            ) : (
                              <Input
                                {...formField}
                                type={field.type}
                                placeholder={field.placeholder}
                                value={formField.value || ''}
                                onChange={e => formField.onChange(field.type === 'number' ? e.target.valueAsNumber : e.target.value)}
                              />
                            )}
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={isLoading}>Cancel</Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Saving...' : `Save ${entityName}`}
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
              {columns.map((col) => <TableHead key={String(col.accessor)}>{col.header}</TableHead>)}
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((item) => (
                <TableRow key={item.id}>
                  {columns.map((col) => (
                    <TableCell key={`${item.id}-${String(col.accessor)}`}>
                      {renderCellContent(item, col.accessor)}
                    </TableCell>
                  ))}
                  <TableCell>
                    <DropdownMenu>
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
                <TableCell colSpan={columns.length + 1} className="h-24 text-center">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
      <AlertDialog open={isAlertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the {entityName.toLowerCase()} and remove their data from our servers.
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

// Re-exporting buttonVariants to be used in AlertDialogAction
import { buttonVariants } from "@/components/ui/button";
