'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, X, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface PackageFormData {
  id?: string;
  package_name: string;
  package_code: string;
  description: string;
  min_group_size: number;
  max_group_size: number;
  available_from: string;
  available_to: string;
  inclusions: string[];
  exclusions: string[];
  display_order: number;
  is_active: boolean;

  // Pricing tiers
  adult_price: number;
  child_price: number;
  infant_price?: number;
  senior_price?: number;
}

interface PackageFormSectionProps {
  packages: PackageFormData[];
  onChange: (packages: PackageFormData[]) => void;
}

export function PackageFormSection({ packages, onChange }: PackageFormSectionProps) {
  const [expandedPackage, setExpandedPackage] = useState<number>(0);

  const addPackage = () => {
    const newPackage: PackageFormData = {
      package_name: `Package ${packages.length + 1}`,
      package_code: '',
      description: '',
      min_group_size: 1,
      max_group_size: 15,
      available_from: '',
      available_to: '',
      inclusions: [],
      exclusions: [],
      display_order: packages.length,
      is_active: true,
      adult_price: 0,
      child_price: 0,
    };
    onChange([...packages, newPackage]);
    setExpandedPackage(packages.length);
  };

  const removePackage = (index: number) => {
    const updated = packages.filter((_, i) => i !== index);
    onChange(updated);
    if (expandedPackage >= updated.length) {
      setExpandedPackage(Math.max(0, updated.length - 1));
    }
  };

  const updatePackage = (index: number, field: keyof PackageFormData, value: any) => {
    const updated = [...packages];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const addArrayItem = (index: number, field: 'inclusions' | 'exclusions', value: string) => {
    if (!value.trim()) return;
    const updated = [...packages];
    updated[index][field] = [...updated[index][field], value];
    updatePackage(index, field, updated[index][field]);
  };

  const removeArrayItem = (packageIndex: number, field: 'inclusions' | 'exclusions', itemIndex: number) => {
    const updated = [...packages];
    updated[packageIndex][field] = updated[packageIndex][field].filter((_, i) => i !== itemIndex);
    onChange(updated);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Packages & Pricing</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Create different package tiers (Standard, Premium, Luxury) with separate pricing
            </p>
          </div>
          <Button type="button" size="sm" onClick={addPackage}>
            <Plus className="w-4 h-4 mr-2" />
            Add Package
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {packages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No packages yet. Click "Add Package" to create your first package.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {packages.map((pkg, index) => (
              <div key={index} className="border rounded-lg">
                {/* Package Header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50"
                  onClick={() => setExpandedPackage(expandedPackage === index ? -1 : index)}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{pkg.package_name || `Package ${index + 1}`}</span>
                    {pkg.package_code && (
                      <Badge variant="outline">{pkg.package_code}</Badge>
                    )}
                    <Badge variant={pkg.is_active ? 'default' : 'secondary'}>
                      {pkg.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Adult: ${pkg.adult_price} | Child: ${pkg.child_price}
                    </span>
                    {packages.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          removePackage(index);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Package Content (Expanded) */}
                {expandedPackage === index && (
                  <div className="p-4 border-t space-y-4">
                    {/* Basic Info */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Package Name *</Label>
                        <Input
                          value={pkg.package_name}
                          onChange={(e) => updatePackage(index, 'package_name', e.target.value)}
                          placeholder="e.g., Standard Package, Premium Package"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Package Code</Label>
                        <Input
                          value={pkg.package_code}
                          onChange={(e) => updatePackage(index, 'package_code', e.target.value)}
                          placeholder="e.g., STD, PREM, LUX"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={pkg.description}
                        onChange={(e) => updatePackage(index, 'description', e.target.value)}
                        placeholder="Describe what makes this package special..."
                        rows={3}
                      />
                    </div>

                    {/* Pricing */}
                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="space-y-2">
                        <Label>Adult Price (USD)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={pkg.adult_price ?? ''}
                          onChange={(e) => {
                            const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                            updatePackage(index, 'adult_price', isNaN(value) ? 0 : value);
                          }}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Child Price (USD)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={pkg.child_price ?? ''}
                          onChange={(e) => {
                            const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                            updatePackage(index, 'child_price', isNaN(value) ? 0 : value);
                          }}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Infant Price (USD)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={pkg.infant_price ?? ''}
                          onChange={(e) => {
                            const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                            updatePackage(index, 'infant_price', value === undefined || isNaN(value) ? undefined : value);
                          }}
                          placeholder="Optional"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Senior Price (USD)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={pkg.senior_price ?? ''}
                          onChange={(e) => {
                            const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                            updatePackage(index, 'senior_price', value === undefined || isNaN(value) ? undefined : value);
                          }}
                          placeholder="Optional"
                        />
                      </div>
                    </div>

                    {/* Group Size */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Min Group Size *</Label>
                        <Input
                          type="number"
                          min="1"
                          value={pkg.min_group_size}
                          onChange={(e) => updatePackage(index, 'min_group_size', Number(e.target.value))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Group Size *</Label>
                        <Input
                          type="number"
                          min="1"
                          value={pkg.max_group_size}
                          onChange={(e) => updatePackage(index, 'max_group_size', Number(e.target.value))}
                          required
                        />
                      </div>
                    </div>

                    {/* Availability Dates */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Available From</Label>
                        <Input
                          type="date"
                          value={pkg.available_from}
                          onChange={(e) => updatePackage(index, 'available_from', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Available To</Label>
                        <Input
                          type="date"
                          value={pkg.available_to}
                          onChange={(e) => updatePackage(index, 'available_to', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Inclusions */}
                    <div className="space-y-2">
                      <Label>Inclusions</Label>
                      <div className="space-y-2">
                        {pkg.inclusions.map((item, itemIndex) => (
                          <div key={itemIndex} className="flex gap-2">
                            <Input value={item} disabled />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeArrayItem(index, 'inclusions', itemIndex)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add inclusion (press Enter)"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const value = e.currentTarget.value;
                                addArrayItem(index, 'inclusions', value);
                                e.currentTarget.value = '';
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Exclusions */}
                    <div className="space-y-2">
                      <Label>Exclusions</Label>
                      <div className="space-y-2">
                        {pkg.exclusions.map((item, itemIndex) => (
                          <div key={itemIndex} className="flex gap-2">
                            <Input value={item} disabled />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeArrayItem(index, 'exclusions', itemIndex)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add exclusion (press Enter)"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const value = e.currentTarget.value;
                                addArrayItem(index, 'exclusions', value);
                                e.currentTarget.value = '';
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
