"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Copy, Edit, Trash2, ExternalLink, DollarSign, MapPin } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import type { Database } from "@/types/database";
import { toast } from "sonner";
import { PaymentLinkForm } from "@/components/payment-links/payment-link-form";

type PaymentLinkRow = Database["public"]["Tables"]["payment_links"]["Row"];

export default function PaymentLinksPage() {
  const [paymentLinks, setPaymentLinks] = useState<PaymentLinkRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedLink, setSelectedLink] = useState<PaymentLinkRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const currency = useMemo(() => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    });
  }, []);

  // Fetch payment links
  useEffect(() => {
    const fetchPaymentLinks = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/admin/payment-links");
        if (!response.ok) throw new Error("Failed to fetch payment links");
        const data = await response.json();
        setPaymentLinks(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        toast.error("Failed to load payment links");
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentLinks();
  }, []);

  // Filter payment links
  const filteredLinks = useMemo(() => {
    return paymentLinks.filter((link) => {
      const matchesSearch =
        link.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        link.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
        link.link_code.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || link.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [paymentLinks, searchQuery, statusFilter]);

  // Paginate
  const paginatedLinks = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLinks.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLinks, currentPage]);

  const totalPages = Math.ceil(filteredLinks.length / itemsPerPage);

  const handleCopyLink = (linkCode: string) => {
    const fullUrl = `${window.location.origin}/pay/${linkCode}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success("Payment link copied to clipboard!");
  };

  const handleDeleteLink = async (id: string) => {
    if (!confirm("Are you sure you want to delete this payment link?")) return;

    try {
      const response = await fetch(`/api/admin/payment-links/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete payment link");

      setPaymentLinks((prev) => prev.filter((link) => link.id !== id));
      toast.success("Payment link deleted successfully");
    } catch (err) {
      toast.error("Failed to delete payment link");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      inactive: "secondary",
      expired: "destructive",
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card className="p-8 text-center">
          <p className="text-red-500">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payment Links</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage custom payment links with personalized pricing
            </p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <Plus className="h-4 w-4" />
                Create Payment Link
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Payment Link</DialogTitle>
                <DialogDescription>
                  Create a new payment link with custom pricing and destination details
                </DialogDescription>
              </DialogHeader>
              <PaymentLinkForm
                onSuccess={() => {
                  setCreateDialogOpen(false);
                  // Refresh the list
                  fetch("/api/admin/payment-links")
                    .then((res) => res.json())
                    .then(setPaymentLinks);
                }}
                onCancel={() => setCreateDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title, destination, or link code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Payment Links Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : paginatedLinks.length === 0 ? (
              <div className="p-12 text-center">
                <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No payment links found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || statusFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Create your first payment link to get started"}
                </p>
                {!searchQuery && statusFilter === "all" && (
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Payment Link
                  </Button>
                )}
              </div>
            ) : (
              <div className="divide-y">
                {paginatedLinks.map((link) => (
                  <div
                    key={link.id}
                    className="p-6 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-lg truncate">
                                {link.title}
                              </h3>
                              {getStatusBadge(link.status)}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                <span>{link.destination}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-3.5 w-3.5" />
                                <span className="font-semibold">
                                  {currency.format(link.price)}
                                </span>
                              </div>
                            </div>
                            {link.destination_description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {link.destination_description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                              <span>
                                Code: <code className="font-mono bg-muted px-2 py-0.5 rounded">{link.link_code}</code>
                              </span>
                              {link.max_uses && (
                                <span>
                                  Uses: {link.current_uses}/{link.max_uses}
                                </span>
                              )}
                              {link.expires_at && (
                                <span>
                                  Expires: {new Date(link.expires_at).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyLink(link.link_code)}
                          className="gap-2"
                        >
                          <Copy className="h-4 w-4" />
                          Copy Link
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/pay/${link.link_code}`, "_blank")}
                          className="gap-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Preview
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedLink(link);
                            setDialogOpen(true);
                          }}
                          className="gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteLink(link.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination>
            <PaginationPrevious
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
            <div className="flex gap-1">
              {[...Array(totalPages)].map((_, i) => (
                <PaginationLink
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  isActive={currentPage === i + 1}
                  className="cursor-pointer"
                >
                  {i + 1}
                </PaginationLink>
              ))}
            </div>
            <PaginationNext
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </Pagination>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Payment Link</DialogTitle>
            <DialogDescription>Update payment link details and settings</DialogDescription>
          </DialogHeader>
          {selectedLink && (
            <PaymentLinkForm
              link={selectedLink}
              onSuccess={() => {
                setDialogOpen(false);
                setSelectedLink(null);
                // Refresh the list
                fetch("/api/admin/payment-links")
                  .then((res) => res.json())
                  .then(setPaymentLinks);
              }}
              onCancel={() => {
                setDialogOpen(false);
                setSelectedLink(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
