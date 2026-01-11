"use client";

import * as React from "react";
import {
  MoreHorizontal,
  PlusCircle,
  Search,
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
import { useToast } from "@/hooks/use-toast";
import type { DJ, FormFieldConfig, ColumnConfig } from "@/lib/types";
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

interface DJTableProps {
  initialData: DJ[];
  initialTotal: number;
}

const djFormFields: FormFieldConfig<DJ>[] = [
  { name: "name", label: "DJ Name", type: "text", placeholder: "DJ Awesome" },
  { name: "bio", label: "Biography", type: "text", placeholder: "Tell us about yourself..." },
  { name: "country", label: "Country", type: "text", placeholder: "Singapore, Vietnam, Thailand..." },
] as any;

const djColumns: ColumnConfig<DJ>[] = [
  { accessor: "name", header: "DJ Name" },
  { accessor: "country", header: "Country" },
  { accessor: "bio", header: "Bio" },
  { accessor: "votes_count", header: "Votes" },
  { accessor: "created_at", header: "Joined" },
];

export function DJTable({ initialData, initialTotal }: DJTableProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [data, setData] = React.useState<DJ[]>(initialData);
  const [totalItems, setTotalItems] = React.useState(initialTotal);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [isDialogOpen, setDialogOpen] = React.useState(false);
  const [isAlertOpen, setAlertOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<DJ | null>(null);
  const [itemToDelete, setItemToDelete] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isFetching, setIsFetching] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  const formSchema = getSchema('DJ');

  const form = useForm<any>({
    resolver: zodResolver(formSchema as unknown as ZodSchema<any>),
  });

  const handleAddNew = () => {
    setSelectedItem(null);
    form.reset({
        name: '',
        bio: '',
        country: '',
    });
    setDialogOpen(true);
  };

  const handleEdit = (item: DJ) => {
    setSelectedItem(item);
    form.reset({
      ...item,
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setItemToDelete(id);
    setAlertOpen(true);
  };

  const fetchData = React.useCallback(async (page: number, search: string) => {
    setIsFetching(true);
    try {
      const response = await fetch(`/api/admin/djs?page=${page}&limit=${itemsPerPage}&search=${encodeURIComponent(search)}`);
      if (!response.ok) throw new Error('Failed to fetch data');
      const result = await response.json();
      setData(result.data.map(mapApiResponseToDJ));
      setTotalItems(result.total);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || "Failed to fetch DJs.",
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
      const response = await fetch(`/api/admin/djs/${itemToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete');
      }

      toast({
        title: "DJ Deleted",
        description: "The DJ has been successfully deleted.",
      });
      fetchData(currentPage, debouncedSearch);
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || "Failed to delete DJ.",
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
      const url = isEditing ? `/api/admin/djs/${selectedItem.id}` : `/api/admin/djs`;

      let payload = { ...values };
      
      if (!isEditing) {
        delete payload.id;
        if (payload.is_active === undefined) payload.is_active = true;
        if (!payload.status) payload.status = 'active';
      }
      
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
        title: isEditing ? `DJ Updated` : `DJ Added`,
        description: `The DJ has been successfully ${isEditing ? 'updated' : 'added'}.`,
      });

      setDialogOpen(false);
      setSelectedItem(null);
      fetchData(currentPage, debouncedSearch);
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || `Failed to ${isEditing ? 'update' : 'create'} DJ.`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const mapApiResponseToDJ = (apiData: any): DJ => {
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
      votes_count: apiData.votes_count || 0,
      performanceCount: apiData.votes_count || 0,
    };
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Reset to first page when search term changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const renderCellContent = (item: DJ, accessor: keyof DJ) => {
    const value = item[accessor];
    if (accessor === 'name') {
      const avatarSrc = item.image_url || item.avatar || '';
      const finalSrc = avatarSrc && (avatarSrc.startsWith('http') || avatarSrc.includes('/'))
        ? avatarSrc
        : `https://picsum.photos/seed/${avatarSrc || item.id}/40/40`;

      return (
        <div className="flex items-center gap-4">
          <Avatar className="hidden h-9 w-9 sm:flex">
            <AvatarImage src={finalSrc} alt="Avatar" />
            <AvatarFallback>{item.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="font-medium">{value as string}</div>
        </div>
      );
    }
    if (accessor === 'created_at') {
      return (value as string)?.split('T')[0] || '-';
    }
    if (accessor === 'votes_count') {
      return value?.toString() || '0';
    }
    return value as string;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>DJ Management</CardTitle>
        <CardDescription>
          Manage your DJs here.
        </CardDescription>
        <div className="flex items-center justify-between gap-2 pt-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search DJs..."
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
                  Add DJ
                </span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {selectedItem ? "Edit DJ" : "Add DJ"}
                </DialogTitle>
                <DialogDescription>
                  {selectedItem ? "Update DJ details." : "Enter details for the new DJ."}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                  {djFormFields.map((field) => (
                    <FormField
                      key={String(field.name)}
                      control={form.control}
                      name={field.name as any}
                      render={({ field: formField }) => (
                        <FormItem>
                          <FormLabel>{field.label}</FormLabel>
                          <FormControl>
                            <Input
                              {...formField}
                              type={field.type}
                              placeholder={field.placeholder}
                              value={formField.value || ''}
                            />
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
                      {isLoading ? 'Saving...' : 'Save DJ'}
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
              {djColumns.map((col) => <TableHead key={String(col.accessor)}>{col.header}</TableHead>)}
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isFetching ? (
              <TableRow>
                <TableCell colSpan={djColumns.length + 1} className="h-24 text-center">
                  Loading DJs...
                </TableCell>
              </TableRow>
            ) : data.length > 0 ? (
              data.map((item) => (
                <TableRow key={item.id}>
                  {djColumns.map((col) => (
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
                <TableCell colSpan={djColumns.length + 1} className="h-24 text-center">
                  No DJs found.
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
              This action cannot be undone. This will permanently delete the DJ.
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
