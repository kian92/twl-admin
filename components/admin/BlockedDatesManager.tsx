'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Trash2, Edit2, X, Plus, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BlockedDate {
  id: string;
  package_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  notes?: string;
  created_at: string;
  created_by?: string;
  auth_users?: {
    email: string;
    full_name?: string;
  };
}

interface BlockedDatesManagerProps {
  packageId: string;
  packageName: string;
}

const BLOCK_REASONS = [
  'Holiday',
  'Maintenance',
  'Weather',
  'Staff Unavailable',
  'Venue Closed',
  'Special Event',
  'Other'
];

export function BlockedDatesManager({ packageId, packageName }: BlockedDatesManagerProps) {
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    reason: '',
    notes: ''
  });

  // Fetch blocked dates
  useEffect(() => {
    if (packageId) {
      fetchBlockedDates();
    }
  }, [packageId]);

  const fetchBlockedDates = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/blocked-dates?package_id=${packageId}`);
      const result = await response.json();

      if (!response.ok) {
        console.error('API Error:', result);
        throw new Error(result.error || 'Failed to fetch blocked dates');
      }

      setBlockedDates(result.data || []);
    } catch (err) {
      console.error('Fetch blocked dates error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent form submission from bubbling to parent form
    setError(null);

    // Validation
    if (!formData.start_date || !formData.end_date || !formData.reason) {
      setError('Please fill in all required fields');
      return;
    }

    if (new Date(formData.start_date) > new Date(formData.end_date)) {
      setError('Start date must be before or equal to end date');
      return;
    }

    setIsLoading(true);

    try {
      const url = editingId
        ? `/api/admin/blocked-dates/${editingId}`
        : '/api/admin/blocked-dates';

      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          package_id: packageId,
          ...formData
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.overlapping) {
          setError(`Date range overlaps with existing blocked dates: ${result.overlapping.map((d: any) => `${d.start_date} to ${d.end_date}`).join(', ')}`);
        } else {
          throw new Error(result.error || 'Failed to save blocked date');
        }
        return;
      }

      // Reset form and refresh list
      setFormData({ start_date: '', end_date: '', reason: '', notes: '' });
      setShowForm(false);
      setEditingId(null);
      await fetchBlockedDates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (blockedDate: BlockedDate) => {
    setFormData({
      start_date: blockedDate.start_date,
      end_date: blockedDate.end_date,
      reason: blockedDate.reason,
      notes: blockedDate.notes || ''
    });
    setEditingId(blockedDate.id);
    setShowForm(true);
    setError(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blocked date range?')) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/blocked-dates/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete blocked date');
      }

      await fetchBlockedDates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({ start_date: '', end_date: '', reason: '', notes: '' });
    setShowForm(false);
    setEditingId(null);
    setError(null);
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (startDate === endDate) {
      return start.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }

    return `${start.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })} - ${end.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })}`;
  };

  const getReasonColor = (reason: string) => {
    const colors: Record<string, string> = {
      'Holiday': 'bg-blue-100 text-blue-800',
      'Maintenance': 'bg-orange-100 text-orange-800',
      'Weather': 'bg-gray-100 text-gray-800',
      'Staff Unavailable': 'bg-purple-100 text-purple-800',
      'Venue Closed': 'bg-red-100 text-red-800',
      'Special Event': 'bg-green-100 text-green-800',
      'Other': 'bg-yellow-100 text-yellow-800'
    };
    return colors[reason] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Blocked Dates
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Manage unavailable dates for {packageName}
            </p>
          </div>
          {!showForm && (
            <Button
              type="button"
              onClick={() => setShowForm(true)}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Blocked Date
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Form */}
        {showForm && (
          <div
            className="space-y-4 mb-6 p-4 border rounded-lg bg-muted/50"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                e.stopPropagation();
                handleSubmit(e);
              }
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">
                {editingId ? 'Edit Blocked Date' : 'Add Blocked Date'}
              </h4>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCancel}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date *</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason *</Label>
              <Select
                value={formData.reason}
                onValueChange={(value) => setFormData({ ...formData, reason: value })}
              >
                <SelectTrigger id="reason">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {BLOCK_REASONS.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Internal Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any additional notes (internal only)..."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                disabled={isLoading}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSubmit(e);
                }}
              >
                {isLoading ? 'Saving...' : editingId ? 'Update' : 'Add Blocked Date'}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* List of blocked dates */}
        <div className="space-y-3">
          {isLoading && !showForm ? (
            <p className="text-center text-muted-foreground py-8">Loading...</p>
          ) : blockedDates.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No blocked dates. Click "Add Blocked Date" to create one.
            </p>
          ) : (
            blockedDates.map((blockedDate) => (
              <div
                key={blockedDate.id}
                className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {formatDateRange(blockedDate.start_date, blockedDate.end_date)}
                    </span>
                    <Badge className={getReasonColor(blockedDate.reason)}>
                      {blockedDate.reason}
                    </Badge>
                  </div>
                  {blockedDate.notes && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {blockedDate.notes}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(blockedDate.created_at).toLocaleDateString()}
                    {blockedDate.auth_users && ` by ${blockedDate.auth_users.full_name || blockedDate.auth_users.email}`}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(blockedDate)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(blockedDate.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
