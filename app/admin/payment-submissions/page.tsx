"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Download,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  User,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type PaymentSubmission = {
  id: string;
  payment_link_id: string;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone_country_code: string;
  phone_number: string;
  travel_date: string;
  travelers: number;
  notes: string | null;
  amount: number;
  currency: string;
  payment_status: string;
  receipt_url: string | null;
  created_at: string;
  payment_links: {
    id: string;
    title: string;
    destination: string;
    link_code: string;
    price: number;
    currency: string;
    created_by: string;
    admin_email: string | null;
    admin_profiles: {
      id: string;
      full_name: string | null;
    } | null;
  } | null;
};

export default function PaymentSubmissionsPage() {
  const [submissions, setSubmissions] = useState<PaymentSubmission[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch submissions
  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/admin/payment-submissions");
        if (!response.ok) throw new Error("Failed to fetch submissions");
        const data = await response.json();
        setSubmissions(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        toast.error("Failed to load payment submissions");
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  // Filter submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((submission) => {
      const matchesSearch =
        submission.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        submission.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        submission.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        submission.payment_links?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        submission.payment_links?.destination.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || submission.payment_status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [submissions, searchQuery, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const totalRevenue = submissions
      .filter((s) => s.payment_status === "paid")
      .reduce((sum, s) => sum + s.amount, 0);

    const totalPaid = submissions.filter((s) => s.payment_status === "paid").length;
    const totalPending = submissions.filter((s) => s.payment_status === "pending").length;
    const totalFailed = submissions.filter((s) => s.payment_status === "failed").length;

    return { totalRevenue, totalPaid, totalPending, totalFailed };
  }, [submissions]);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      paid: "default",
      pending: "secondary",
      failed: "destructive",
      refunded: "outline",
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Submissions</h1>
          <p className="text-muted-foreground mt-1">
            View and manage all payment submissions with customer details
          </p>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue, "USD")}</div>
              <p className="text-xs text-muted-foreground">From paid submissions</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid</CardTitle>
              <Download className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPaid}</div>
              <p className="text-xs text-muted-foreground">Successful payments</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Calendar className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPending}</div>
              <p className="text-xs text-muted-foreground">Awaiting payment</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <ExternalLink className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalFailed}</div>
              <p className="text-xs text-muted-foreground">Failed payments</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by customer name, email, or destination..."
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
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Submissions Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="p-12 text-center">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No submissions found</h3>
                <p className="text-muted-foreground">
                  {searchQuery || statusFilter !== "all"
                    ? "Try adjusting your filters"
                    : "No payment submissions yet"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Payment Link</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead>Travel Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubmissions.map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell>
                          <div className="font-medium">
                            {submission.first_name} {submission.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(submission.created_at).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 text-sm">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              <span className="truncate max-w-[200px]">{submission.email}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              <span>
                                {submission.phone_country_code} {submission.phone_number}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{submission.payment_links?.title}</div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>{submission.payment_links?.destination}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {submission.payment_links?.admin_profiles?.full_name ||
                              submission.payment_links?.admin_email ||
                              "Unknown"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3" />
                            {new Date(submission.travel_date).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {formatCurrency(submission.amount, submission.currency)}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(submission.payment_status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {submission.receipt_url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(submission.receipt_url!, "_blank")}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
