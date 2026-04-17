"use client";

import * as React from "react";
import { Download, MoreHorizontal, PlusCircle, Search } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ZodSchema } from "zod";
import { useRouter } from "next/navigation";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownDescriptionField } from "@/components/dashboard/markdown-description-field";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";
import { getSchema } from "@/lib/schemas";
import { ADMIN_CATEGORIES, ADMIN_COUNTRIES, getCitiesForCountry } from "@/lib/venue-filters";
import type { Venue, FormFieldConfig, ColumnConfig } from "@/lib/types";

const SELECT_NONE = "__none__";

interface VenueTableProps {
  initialData: Venue[];
  initialTotal: number;
}

const VENUE_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "draft", label: "Draft" },
] as const;

function normalizeVenueStatus(status: string | undefined): "active" | "inactive" | "draft" {
  const s = (status || "").toLowerCase();
  if (s === "active" || s === "inactive" || s === "draft") return s;
  if (s === "closed") return "inactive";
  return "active";
}

const venueFormFields: FormFieldConfig<Venue>[] = [
  { name: "name", label: "Venue Name", type: "text", placeholder: "Royal KTV" },
  {
    name: "slug",
    label: "Slug (URL path)",
    type: "text",
    placeholder: "royal-ktv-hcmc — leave empty to auto-generate from name",
  } as any,
  { name: "country", label: "Country", type: "text", placeholder: "" },
  { name: "city", label: "City", type: "text", placeholder: "" },
  { name: "category", label: "Entertainment type", type: "text", placeholder: "" },
  { name: "address", label: "Address", type: "text", placeholder: "District 1, HCMC" },
  { name: "price", label: "Price", type: "text", placeholder: "800k - 1.2m" },
  { name: "main_image_url", label: "Main Image URL", type: "text", placeholder: "https://..." },
  { name: "images", label: "Images (one URL per line)", type: "text", placeholder: "https://img1.jpg\nhttps://img2.jpg" } as any,
  { name: "map_embed_url", label: "Map Embed URL", type: "text", placeholder: "https://www.google.com/maps/embed?..." } as any,
  { name: "hours", label: "Hours", type: "text", placeholder: "Daily 4PM - 3AM" } as any,
  {
    name: "description",
    label: "Description",
    type: "text",
    placeholder: "Markdown: **bold**, lists, links. Use Preview to check.",
  } as any,
  { name: "status", label: "Status", type: "text", placeholder: "" },
] as any;

const venueColumns: ColumnConfig<Venue>[] = [
  { accessor: "name", header: "Venue" },
  { accessor: "country", header: "Country" },
  { accessor: "city", header: "City" },
  { accessor: "category", header: "Type" },
  { accessor: "price", header: "Price" },
  { accessor: "status", header: "Status" },
  { accessor: "created_at", header: "Created" },
];

export function VenueTable({ initialData, initialTotal }: VenueTableProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [data, setData] = React.useState<Venue[]>(initialData);
  const [totalItems, setTotalItems] = React.useState(initialTotal);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [isDialogOpen, setDialogOpen] = React.useState(false);
  const [isAlertOpen, setAlertOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<Venue | null>(null);
  const [itemToDelete, setItemToDelete] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isFetching, setIsFetching] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  const formSchema = getSchema("Venue");
  const form = useForm<any>({
    resolver: zodResolver(formSchema as unknown as ZodSchema<any>),
  });

  const watchedCountry = form.watch("country");

  const mapApiResponseToVenue = (apiData: any): Venue => ({
    id: String(apiData.id || ""),
    name: apiData.name,
    slug: apiData.slug ?? "",
    main_image_url: apiData.main_image_url,
    category: apiData.category,
    address: apiData.address,
    price: apiData.price,
    country: apiData.country,
    city: apiData.city,
    phone: apiData.phone,
    hours: apiData.hours,
    description: apiData.description,
    images: Array.isArray(apiData.images) ? apiData.images : [],
    map_embed_url: apiData.map_embed_url,
    status: apiData.status,
    created_at: apiData.created_at,
    updated_at: apiData.updated_at,
  });

  const fetchData = React.useCallback(async (page: number, search: string) => {
    setIsFetching(true);
    try {
      const response = await fetch(`/api/admin/venues?page=${page}&limit=${itemsPerPage}&search=${encodeURIComponent(search)}`);
      if (!response.ok) throw new Error("Failed to fetch venues");
      const result = await response.json();
      setData((result.data || []).map(mapApiResponseToVenue));
      setTotalItems(result.total || 0);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to fetch venues", variant: "destructive" });
    } finally {
      setIsFetching(false);
    }
  }, [itemsPerPage, toast]);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  React.useEffect(() => {
    fetchData(currentPage, debouncedSearch);
  }, [currentPage, debouncedSearch, fetchData]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const handleAddNew = () => {
    setSelectedItem(null);
    form.reset({
      name: "",
      slug: "",
      category: "KTV",
      country: "",
      city: "",
      address: "",
      price: "",
      main_image_url: "",
      images: "",
      map_embed_url: "",
      hours: "",
      description: "",
      status: "active",
    });
    setDialogOpen(true);
  };

  const onSubmit = async (values: any) => {
    const isEditing = !!selectedItem;
    setIsLoading(true);
    try {
      const url = isEditing ? `/api/admin/venues/${selectedItem.id}` : "/api/admin/venues";
      const method = isEditing ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Request failed");
      }
      toast({
        title: isEditing ? "Venue Updated" : "Venue Created",
        description: isEditing ? "Venue updated successfully." : "Venue created successfully.",
      });
      setDialogOpen(false);
      setSelectedItem(null);
      fetchData(currentPage, debouncedSearch);
      router.refresh();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Save failed", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const importFromDataFile = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/venues/import", { method: "POST" });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Import failed");
      }
      toast({
        title: "Import completed",
        description: `Imported ${result.imported || 0} venues from data.ts`,
      });
      setCurrentPage(1);
      fetchData(1, debouncedSearch);
      router.refresh();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Import failed", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/venues/${itemToDelete}`, { method: "DELETE" });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Delete failed");
      }
      toast({ title: "Venue Deleted", description: "Venue deleted successfully." });
      fetchData(currentPage, debouncedSearch);
      router.refresh();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Delete failed", variant: "destructive" });
    } finally {
      setItemToDelete(null);
      setAlertOpen(false);
      setIsLoading(false);
    }
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <Card>
      <CardHeader>
        <CardTitle>KTV/Venue Management</CardTitle>
        <CardDescription>Upload and manage KTV venues for client website.</CardDescription>
        <div className="flex items-center justify-between gap-2 pt-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search venues..."
              className="w-full rounded-lg bg-card pl-8 md:w-[200px] lg:w-[320px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-8 gap-1" onClick={importFromDataFile} disabled={isLoading}>
              <Download className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                {isLoading ? "Importing..." : "Import data.ts"}
              </span>
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 gap-1" onClick={handleAddNew}>
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Add KTV</span>
                </Button>
              </DialogTrigger>
                      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{selectedItem ? "Edit Venue" : "Add Venue"}</DialogTitle>
                  <DialogDescription>Enter venue details to publish on client site.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 py-4 md:grid-cols-2">
                    {venueFormFields.map((field) => (
                      <FormField
                        key={String(field.name)}
                        control={form.control}
                        name={field.name as any}
                        render={({ field: formField }) => {
                          const cityOpts = getCitiesForCountry(watchedCountry || undefined);

                          return (
                          <FormItem
                            className={
                              field.name === "description" || field.name === "images"
                                ? "md:col-span-2"
                                : ""
                            }
                          >
                            <FormLabel>{field.label}</FormLabel>
                            <FormControl>
                              {field.name === "status" ? (
                                <Select
                                  value={normalizeVenueStatus(formField.value)}
                                  onValueChange={formField.onChange}
                                >
                                  <SelectTrigger id={formField.name}>
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {VENUE_STATUS_OPTIONS.map((opt) => (
                                      <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : field.name === "country" ? (
                                <Select
                                  value={formField.value ? String(formField.value) : SELECT_NONE}
                                  onValueChange={(v) => {
                                    formField.onChange(v === SELECT_NONE ? "" : v);
                                    form.setValue("city", "");
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select country" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value={SELECT_NONE}>— Select —</SelectItem>
                                    {ADMIN_COUNTRIES.map((c) => (
                                      <SelectItem key={c.value} value={c.value}>
                                        {c.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : field.name === "city" ? (
                                cityOpts.length > 0 ? (
                                  <Select
                                    value={formField.value ? String(formField.value) : SELECT_NONE}
                                    onValueChange={(v) =>
                                      formField.onChange(v === SELECT_NONE ? "" : v)
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select city" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value={SELECT_NONE}>— Select —</SelectItem>
                                      {cityOpts.map((c) => (
                                        <SelectItem key={c.value} value={c.value}>
                                          {c.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Input
                                    value={formField.value || ""}
                                    onChange={formField.onChange}
                                    placeholder="City (optional)"
                                  />
                                )
                              ) : field.name === "category" ? (
                                (() => {
                                  const cv = String(formField.value || "");
                                  const known =
                                    !cv || ADMIN_CATEGORIES.some((c) => c.value === cv);
                                  return known ? (
                                    <Select value={cv || "KTV"} onValueChange={formField.onChange}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Entertainment type" />
                                      </SelectTrigger>
                                      <SelectContent className="max-h-72">
                                        {ADMIN_CATEGORIES.map((c) => (
                                          <SelectItem key={c.value} value={c.value}>
                                            {c.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    <Input
                                      value={cv}
                                      onChange={formField.onChange}
                                      placeholder="Custom category"
                                    />
                                  );
                                })()
                              ) : field.name === "description" ? (
                                <MarkdownDescriptionField
                                  ref={formField.ref}
                                  name={formField.name}
                                  value={formField.value || ""}
                                  onValueChange={formField.onChange}
                                  onBlur={formField.onBlur}
                                  placeholder={field.placeholder}
                                  rows={5}
                                />
                              ) : field.name === "images" ? (
                                <Textarea
                                  value={formField.value || ""}
                                  onChange={formField.onChange}
                                  placeholder={field.placeholder}
                                  rows={6}
                                />
                              ) : (
                                <Input {...formField} type={field.type} placeholder={field.placeholder} value={formField.value || ""} />
                              )}
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                          );
                        }}
                      />
                    ))}
                    <DialogFooter className="md:col-span-2">
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={isLoading}>Cancel</Button>
                      <Button type="submit" disabled={isLoading}>{isLoading ? "Saving..." : "Save Venue"}</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {venueColumns.map((col) => <TableHead key={String(col.accessor)}>{col.header}</TableHead>)}
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isFetching ? (
              <TableRow><TableCell colSpan={venueColumns.length + 1} className="h-24 text-center">Loading venues...</TableCell></TableRow>
            ) : data.length ? (
              data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.country || "-"}</TableCell>
                  <TableCell>{item.city || "-"}</TableCell>
                  <TableCell>{item.category || "-"}</TableCell>
                  <TableCell>{item.price || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={normalizeVenueStatus(item.status) === "active" ? "default" : "secondary"}>
                      {normalizeVenueStatus(item.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.created_at?.split("T")[0] || "-"}</TableCell>
                  <TableCell>
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => {
                          setSelectedItem(item);
                          form.reset({
                            ...item,
                            slug: item.slug ?? "",
                            city: item.city ?? "",
                            images: Array.isArray(item.images) ? item.images.join("\n") : "",
                            status: normalizeVenueStatus(item.status),
                          });
                          setDialogOpen(true);
                        }}>Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => { setItemToDelete(item.id); setAlertOpen(true); }}>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={venueColumns.length + 1} className="h-24 text-center">No venues found.</TableCell></TableRow>
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
                    onClick={(e) => { e.preventDefault(); setCurrentPage((prev) => Math.max(prev - 1, 1)); }}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => { e.preventDefault(); setCurrentPage(page); }}
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
                    onClick={(e) => { e.preventDefault(); setCurrentPage((prev) => Math.min(prev + 1, totalPages)); }}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>

      <AlertDialog open={isAlertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete venue?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isLoading} className={buttonVariants({ variant: "destructive" })}>
              {isLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
