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

interface ManagementTableProps<T extends ManageableEntity> {
  entityName: string;
  initialData: T[];
  formFields: FormFieldConfig<T>[];
  columns: ColumnConfig<T>[];
  searchField: keyof T;
}

export function ManagementTable<T extends ManageableEntity>({
  entityName,
  initialData,
  formFields,
  columns,
  searchField,
}: ManagementTableProps<T>) {
  const { toast } = useToast();
  const [data, setData] = React.useState<T[]>(initialData);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isDialogOpen, setDialogOpen] = React.useState(false);
  const [isAlertOpen, setAlertOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<T | null>(null);
  const [itemToDelete, setItemToDelete] = React.useState<string | null>(null);

  const formSchema = getSchema(entityName);

  const form = useForm<T>({
    resolver: zodResolver(formSchema as ZodSchema<T>),
  });

  const handleAddNew = () => {
    setSelectedItem(null);
    form.reset({} as T);
    setDialogOpen(true);
  };

  const handleEdit = (item: T) => {
    setSelectedItem(item);
    form.reset(item);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setItemToDelete(id);
    setAlertOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      setData(data.filter((item) => item.id !== itemToDelete));
      toast({
        title: `${entityName} Deleted`,
        description: `The ${entityName.toLowerCase()} has been successfully deleted.`,
      });
    }
    setAlertOpen(false);
    setItemToDelete(null);
  };

  const onSubmit = (values: T) => {
    const isEditing = !!selectedItem;
    const newValues = { ...values, id: selectedItem?.id || `new-${Date.now()}` };

    if (isEditing) {
      setData(data.map((item) => (item.id === selectedItem.id ? newValues : item)));
    } else {
      setData([newValues, ...data]);
    }
    
    toast({
        title: isEditing ? `${entityName} Updated` : `${entityName} Added`,
        description: `The ${entityName.toLowerCase()} has been successfully ${isEditing ? 'updated' : 'added'}.`,
    });
    setDialogOpen(false);
    setSelectedItem(null);
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
        if (value === 'Admin' || value === 'Engineering') variant = "primary";
        if (value === 'Member' || value === 'Marketing') variant = "secondary";
        if (value === 'Guest' || value === 'Sales') variant = "outline";
        return <Badge variant={variant}>{value as string}</Badge>;
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
                <DialogTitle>{selectedItem ? "Edit" : "Add"} {entityName}</DialogTitle>
                <DialogDescription>
                  {selectedItem ? "Update the details below." : `Enter the details for the new ${entityName.toLowerCase()}.`}
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
                                onChange={ e => formField.onChange(field.type === 'number' ? e.target.valueAsNumber : e.target.value)}
                              />
                            )}
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button type="submit">Save {entityName}</Button>
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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className={buttonVariants({variant: "destructive"})}>
                Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

// Re-exporting buttonVariants to be used in AlertDialogAction
import { buttonVariants } from "@/components/ui/button";
