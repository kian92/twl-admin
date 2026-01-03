'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, X, Trash2, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslations } from 'next-intl';
import { CURRENCIES, formatCurrency } from '@/lib/constants/currencies';
import { convertToUSD, roundCurrency } from '@/lib/utils/currency-converter';
import { BlockedDatesManager } from './BlockedDatesManager';
import type { PackagePricingTier } from '@/types/pricing';

export interface AddOnItem {
  id?: string;
  name: string;
  description: string;
  price: number;
  is_required: boolean;
  max_quantity: number;
  pricing_type?: 'per_person' | 'per_group' | 'per_unit';
  category?: string;
}

export interface CustomPricingTier {
  id?: string;
  tier_type: 'adult' | 'child' | 'infant' | 'senior';
  tier_label: string;
  min_age?: number;
  max_age?: number | null;
  base_price: number;
  selling_price: number;
  supplier_cost?: number;
  description?: string;
}

export interface PackageFormData {
  id?: string;
  package_name: string;
  package_code: string;
  description: string;
  tour_type?: 'group' | 'private';
  min_group_size: number;
  max_group_size: number | null;
  available_from: string;
  available_to: string;
  inclusions: string[];
  exclusions: string[];
  display_order: number;
  is_active: boolean;
  requires_full_payment?: boolean;

  // Markup settings
  markup_type?: 'percentage' | 'fixed' | 'none';
  markup_value?: number;

  // Base prices (cost from supplier)
  base_adult_price?: number;
  base_child_price?: number;
  base_infant_price?: number;
  base_senior_price?: number;

  // Supplier currency fields
  supplier_currency?: string;
  supplier_cost_adult?: number;
  supplier_cost_child?: number;
  supplier_cost_infant?: number;
  supplier_cost_senior?: number;
  exchange_rate?: number;

  // Selling prices (calculated or manual)
  adult_price: number;
  child_price: number;
  infant_price?: number;
  senior_price?: number;

  // Age(child and adult)
  adult_min_age?: number;
  adult_max_age?: number | null;
  child_min_age?: number;
  child_max_age?: number;

  // Custom Pricing Tiers (overrides simple fields when enabled)
  use_custom_tiers?: boolean;
  custom_pricing_tiers?: CustomPricingTier[];

  // Add-ons
  addons?: AddOnItem[];
}

interface PackageFormSectionProps {
  packages: PackageFormData[];
  onChange: (packages: PackageFormData[]) => void;
  userRole?: 'admin' | 'manager' | 'support' | 'sales' | 'supplier';
}

export function PackageFormSection({ packages, onChange, userRole }: PackageFormSectionProps) {
  const t = useTranslations('experiences.form');
  const [expandedPackage, setExpandedPackage] = useState<number>(0);
  const isSupplier = userRole === 'supplier';

  // Generate package code from package name with random unique number
  const generatePackageCode = (name: string): string => {
    if (!name.trim()) return '';

    // Remove special characters but keep letters, numbers, and spaces
    const cleaned = name.trim().replace(/[^\w\s]/g, '');
    const words = cleaned.split(/\s+/);

    let prefix = '';
    if (words.length === 1) {
      // Single word: take first 3-4 characters (including numbers)
      prefix = words[0].substring(0, 4).toUpperCase();
    } else {
      // Multiple words: take first character of each word (letters or numbers)
      // Max 5 characters to accommodate common patterns like "Day 1", "Package 2"
      prefix = words
        .slice(0, 5)
        .map(word => {
          // Prioritize first alphanumeric character
          const match = word.match(/[a-zA-Z0-9]/);
          return match ? match[0] : '';
        })
        .filter(char => char !== '')
        .join('')
        .toUpperCase();
    }

    // Generate random 4-digit number
    const randomNum = Math.floor(1000 + Math.random() * 9000);

    return `${prefix}-${randomNum}`;
  };

  useEffect(() => {
    packages.forEach((pkg, index) => {
      // When unchecked → remove tiers
      if (!pkg.use_custom_tiers && pkg.custom_pricing_tiers?.length) {
        updatePackage(index, 'custom_pricing_tiers', []);
      }

      // When checked first time → ensure array exists
      if (
        pkg.use_custom_tiers &&
        (!pkg.custom_pricing_tiers || pkg.custom_pricing_tiers.length === 0)
      ) {
        updatePackage(index, 'custom_pricing_tiers', []);
      }
    });
  }, [packages.map(p => p.use_custom_tiers).join('|')]);
  
  const addPackage = () => {
    const newPackage: PackageFormData = {
      package_name: '',
      package_code: '',
      description: '',
      tour_type: 'group',
      min_group_size: 1,
      max_group_size: null,
      available_from: '',
      available_to: '',
      inclusions: [],
      exclusions: [],
      display_order: packages.length,
      is_active: true,
      requires_full_payment: false,
      markup_type: 'percentage',
      markup_value: 0,
      base_adult_price: 0,
      base_child_price: 0,
      base_infant_price: 0,
      base_senior_price: 0,
      supplier_currency: 'USD',
      supplier_cost_adult: 0,
      supplier_cost_child: 0,
      supplier_cost_infant: 0,
      supplier_cost_senior: 0,
      exchange_rate: 1.0,
      adult_price: 0,
      child_price: 0,
      adult_min_age: 18,
      adult_max_age: null,
      child_min_age: 3,
      child_max_age: 17,
      infant_price: 0,
      senior_price: 0,
      use_custom_tiers: false,
      custom_pricing_tiers: [],
      addons: [],
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

    // Auto-generate package code when package name changes
    if (field === 'package_name' && typeof value === 'string') {
      updated[index].package_code = generatePackageCode(value);
    }

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

  const calculateSellingPrice = (basePrice: number, markupType: string, markupValue: number): number => {
    if (!basePrice) return 0;
    if (markupType === 'percentage') {
      return basePrice + (basePrice * markupValue / 100);
    } else if (markupType === 'fixed') {
      return basePrice + markupValue;
    }
    return basePrice;
  };

  // Handle supplier currency cost updates and auto-convert to base prices
  const updateSupplierCost = (index: number, field: string, value: any) => {
    const updated = [...packages];
    updated[index] = { ...updated[index], [field]: value };

    const pkg = updated[index];
    const exchangeRate = pkg.exchange_rate || 1.0;

    // Auto-convert supplier costs to base prices (USD)
    if (field.startsWith('supplier_cost_') || field === 'exchange_rate' || field === 'supplier_currency') {
      if (pkg.supplier_cost_adult) {
        updated[index].base_adult_price = roundCurrency(convertToUSD(pkg.supplier_cost_adult, exchangeRate));
      }
      if (pkg.supplier_cost_child) {
        updated[index].base_child_price = roundCurrency(convertToUSD(pkg.supplier_cost_child, exchangeRate));
      }
      if (pkg.supplier_cost_infant) {
        updated[index].base_infant_price = roundCurrency(convertToUSD(pkg.supplier_cost_infant, exchangeRate));
      }
      if (pkg.supplier_cost_senior) {
        updated[index].base_senior_price = roundCurrency(convertToUSD(pkg.supplier_cost_senior, exchangeRate));
      }

      // Also recalculate selling prices with markup
      const markupType = pkg.markup_type || 'none';
      const markupValue = pkg.markup_value || 0;
      updated[index].adult_price = calculateSellingPrice(updated[index].base_adult_price || 0, markupType, markupValue);
      updated[index].child_price = calculateSellingPrice(updated[index].base_child_price || 0, markupType, markupValue);
      updated[index].infant_price = calculateSellingPrice(updated[index].base_infant_price || 0, markupType, markupValue);
      updated[index].senior_price = calculateSellingPrice(updated[index].base_senior_price || 0, markupType, markupValue);
    }

    onChange(updated);
  };

  const updatePricingWithMarkup = (index: number, field: string, value: any) => {
    const updated = [...packages];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-calculate selling prices when base price or markup changes
    const pkg = updated[index];
    const markupType = pkg.markup_type || 'none';
    const markupValue = pkg.markup_value || 0;

    if (field.startsWith('base_') || field === 'markup_type' || field === 'markup_value') {
      updated[index].adult_price = calculateSellingPrice(pkg.base_adult_price || 0, markupType, markupValue);
      updated[index].child_price = calculateSellingPrice(pkg.base_child_price || 0, markupType, markupValue);
      updated[index].infant_price = calculateSellingPrice(pkg.base_infant_price || 0, markupType, markupValue);
      updated[index].senior_price = calculateSellingPrice(pkg.base_senior_price || 0, markupType, markupValue);
    }

    onChange(updated);
  };

  const addAddon = (packageIndex: number) => {
    const updated = [...packages];
    if (!updated[packageIndex].addons) {
      updated[packageIndex].addons = [];
    }
    updated[packageIndex].addons!.push({
      name: '',
      description: '',
      price: 0,
      is_required: false,
      max_quantity: 1,
      pricing_type: 'per_person',
      category: 'Other',
    });
    onChange(updated);
  };

  const updateAddon = (packageIndex: number, addonIndex: number, field: keyof AddOnItem, value: any) => {
    const updated = [...packages];
    if (!updated[packageIndex].addons) return;
    updated[packageIndex].addons![addonIndex] = {
      ...updated[packageIndex].addons![addonIndex],
      [field]: value,
    };
    onChange(updated);
  };

  const removeAddon = (packageIndex: number, addonIndex: number) => {
    const updated = [...packages];
    if (!updated[packageIndex].addons) return;
    updated[packageIndex].addons = updated[packageIndex].addons!.filter((_, i) => i !== addonIndex);
    onChange(updated);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t('packagesAndPricing')}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {t('packagesSubtitle')}
            </p>
          </div>
          <Button type="button" size="sm" onClick={addPackage}>
            <Plus className="w-4 h-4 mr-2" />
            {t('addPackage')}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {packages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>{t('noPackages')}</p>
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
                    <span className="font-medium">{pkg.package_name || t('packageName')}</span>
                    {pkg.package_code && (
                      <Badge variant="outline">{pkg.package_code}</Badge>
                    )}
                    <Badge variant={pkg.tour_type === 'private' ? 'default' : 'secondary'} className={pkg.tour_type === 'private' ? 'bg-purple-600' : 'bg-blue-600'}>
                      {pkg.tour_type === 'private' ? t('packagePrivate') : t('packageGroup')}
                    </Badge>
                    <Badge variant={pkg.is_active ? 'default' : 'secondary'}>
                      {pkg.is_active ? t('packageActive') : t('packageInactive')}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Adult: ${pkg.adult_price}
                    {pkg.adult_min_age !== undefined && (
                      <> ({pkg.adult_min_age}{pkg.adult_max_age ? `–${pkg.adult_max_age}` : '+'})</>
                    )}
                    {" | "}
                    Child: ${pkg.child_price}
                    {pkg.child_min_age !== undefined && pkg.child_max_age !== undefined && (
                      <> ({pkg.child_min_age}–{pkg.child_max_age})</>
                    )}
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
                        <Label>{t('packageName')} *</Label>
                        <Input
                          value={pkg.package_name}
                          onChange={(e) => updatePackage(index, 'package_name', e.target.value)}
                          placeholder={t('packageNamePlaceholder')}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('packageCode')}</Label>
                        <Input
                          value={pkg.package_code}
                          onChange={(e) => updatePackage(index, 'package_code', e.target.value)}
                          placeholder={t('packageCodePlaceholder')}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>{t('description')}</Label>
                      <Textarea
                        value={pkg.description}
                        onChange={(e) => updatePackage(index, 'description', e.target.value)}
                        placeholder={t('packageDescriptionPlaceholder')}
                        rows={3}
                      />
                    </div>

                    {/* Tour Type */}
                    <div className="space-y-2">
                      <Label>{t('tourType')} *</Label>
                      <Select
                        value={pkg.tour_type || 'group'}
                        onValueChange={(value) => updatePackage(index, 'tour_type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('selectTourType')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="group">
                            <div className="flex flex-col">
                              <span className="font-medium">{t('groupTour')}</span>
                              <span className="text-xs text-muted-foreground">{t('groupTourDesc')}</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="private">
                            <div className="flex flex-col">
                              <span className="font-medium">{t('privateTour')}</span>
                              <span className="text-xs text-muted-foreground">{t('privateTourDesc')}</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Requires Full Payment Checkbox */}
                    <div className="flex items-center space-x-2 p-4 bg-muted/20 rounded-lg border">
                      <Checkbox
                        id={`requires-full-payment-${index}`}
                        checked={pkg.requires_full_payment || false}
                        onCheckedChange={(checked) => updatePackage(index, 'requires_full_payment', checked)}
                      />
                      <Label
                        htmlFor={`requires-full-payment-${index}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        <span className="font-medium">{t('requiresFullPayment')}</span>
                        <span className="text-xs text-muted-foreground block mt-1">
                          {t('requiresFullPaymentDesc')}
                        </span>
                      </Label>
                    </div>

                    {/* Markup Configuration - Hidden for suppliers */}
                    {!isSupplier && (
                      <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{t('markupConfiguration')}</h4>
                          <Badge variant="outline">{t('markupOptional')}</Badge>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>{t('markupType')}</Label>
                            <Select
                              value={pkg.markup_type || 'none'}
                              onValueChange={(value) => updatePricingWithMarkup(index, 'markup_type', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={t('selectMarkupType')} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">{t('noMarkup')}</SelectItem>
                                <SelectItem value="percentage">{t('markupPercentage')}</SelectItem>
                                <SelectItem value="fixed">{t('markupFixedAmount')}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {pkg.markup_type && pkg.markup_type !== 'none' && (
                            <div className="space-y-2">
                              <Label>
                                {t('markupValue')} {pkg.markup_type === 'percentage' ? '(%)' : '($)'}
                              </Label>
                              <Input
                                type="number"
                                min="0"
                                step={pkg.markup_type === 'percentage' ? '1' : '0.01'}
                                value={pkg.markup_value ?? ''}
                                onChange={(e) => {
                                  const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                  updatePricingWithMarkup(index, 'markup_value', isNaN(value) ? 0 : value);
                                }}
                                placeholder={pkg.markup_type === 'percentage' ? 'e.g., 20' : 'e.g., 50.00'}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Supplier Currency Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{isSupplier ? t('yourCostPrices') : t('supplierCostPrices')}</h4>
                        <span className="text-xs text-muted-foreground">
                          {isSupplier ? t('enterInYourCurrency') : t('supplierOriginalCurrency')}
                        </span>
                      </div>

                      {/* Currency Selector */}
                      <div className="space-y-2">
                        <Label>{t('currency')}</Label>
                        <Select
                          value={pkg.supplier_currency || 'USD'}
                          onValueChange={(value) => updateSupplierCost(index, 'supplier_currency', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('selectCurrency')} />
                          </SelectTrigger>
                          <SelectContent>
                            {CURRENCIES.map((currency) => (
                              <SelectItem key={currency.code} value={currency.code}>
                                {currency.symbol} {currency.code} - {currency.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Exchange Rate - Only visible to admin/manager */}
                      {!isSupplier && (
                        <div className="space-y-2">
                          <Label>{t('exchangeRate')}</Label>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">1 {pkg.supplier_currency || 'USD'} =</span>
                            <Input
                              type="number"
                              min="0"
                              step="0.000001"
                              value={pkg.exchange_rate ?? 1.0}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value);
                                updateSupplierCost(index, 'exchange_rate', isNaN(value) ? 1.0 : value);
                              }}
                              placeholder="1.0"
                              className="w-32"
                            />
                            <span className="text-sm text-muted-foreground">USD</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {t('exchangeRateHelper')}
                          </p>
                        </div>
                      )}

                      {/* Age Ranges */}
                      <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{t('ageRanges')}</h4>
                          <span className="text-xs text-muted-foreground">
                          {t('usedForPricingTiers')}
                          </span>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                          {/* Child Age */}
                          <div className="space-y-3">
                            <h5 className="text-sm font-medium">{t('child')}</h5>
                            <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
                              <div className="space-y-1">
                                <Label>{t('minAge')}</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={pkg.child_min_age ?? ''}
                                  onChange={(e) =>
                                    updatePackage(
                                      index,
                                      'child_min_age',
                                      e.target.value === '' ? undefined : Number(e.target.value)
                                    )
                                  }
                                  placeholder="e.g. 3"
                                />
                              </div>
                              {/* Dash */}
                              <div className="pb-2 text-sm text-muted-foreground">–</div>
                              <div className="space-y-1">
                                <Label>{t('maxAge')}</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={pkg.child_max_age ?? ''}
                                  onChange={(e) =>
                                    updatePackage(
                                      index,
                                      'child_max_age',
                                      e.target.value === '' ? undefined : Number(e.target.value)
                                    )
                                  }
                                  placeholder="e.g. 17"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Adult Age */}
                          <div className="space-y-3">
                            <h5 className="text-sm font-medium">{t('adult')}</h5>
                            <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
                              <div className="space-y-1">
                                <Label>{t('minAge')}</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={pkg.adult_min_age ?? ''}
                                  onChange={(e) =>
                                    updatePackage(
                                      index,
                                      'adult_min_age',
                                      e.target.value === '' ? undefined : Number(e.target.value)
                                    )
                                  }
                                  placeholder="e.g. 18"
                                />
                              </div>
                              {/* Dash */}
                              <div className="pb-2 text-sm text-muted-foreground">–</div>
                              <div className="space-y-1">
                                <Label>{t('maxAge')}</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={pkg.adult_max_age ?? ''}
                                  onChange={(e) =>
                                    updatePackage(
                                      index,
                                      'adult_max_age',
                                      e.target.value === '' ? null : Number(e.target.value)
                                    )
                                  }
                                  placeholder="No limit"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Supplier Cost Prices */}
                      <div className="grid gap-4 md:grid-cols-4">
                        <div className="space-y-2">
                          <Label>{t('adultCost')} ({pkg.supplier_currency || 'USD'})</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={pkg.supplier_cost_adult ?? ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                              updateSupplierCost(index, 'supplier_cost_adult', isNaN(value) ? 0 : value);
                            }}
                            placeholder="0.00"
                          />
                          {pkg.supplier_cost_adult && pkg.exchange_rate && (
                            <p className="text-xs text-muted-foreground">
                              ≈ {formatCurrency(convertToUSD(pkg.supplier_cost_adult, pkg.exchange_rate), 'USD')}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>{t('childCost')} ({pkg.supplier_currency || 'USD'})</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={pkg.supplier_cost_child ?? ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                              updateSupplierCost(index, 'supplier_cost_child', isNaN(value) ? 0 : value);
                            }}
                            placeholder="0.00"
                          />
                          {pkg.supplier_cost_child && pkg.exchange_rate && (
                            <p className="text-xs text-muted-foreground">
                              ≈ {formatCurrency(convertToUSD(pkg.supplier_cost_child, pkg.exchange_rate), 'USD')}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>{t('infantCost')} ({pkg.supplier_currency || 'USD'})</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={pkg.supplier_cost_infant ?? ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                              updateSupplierCost(index, 'supplier_cost_infant', isNaN(value) ? 0 : value);
                            }}
                            placeholder={t('optional')}
                          />
                          {pkg.supplier_cost_infant && pkg.exchange_rate && (
                            <p className="text-xs text-muted-foreground">
                              ≈ {formatCurrency(convertToUSD(pkg.supplier_cost_infant, pkg.exchange_rate), 'USD')}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>{t('seniorCost')} ({pkg.supplier_currency || 'USD'})</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={pkg.supplier_cost_senior ?? ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                              updateSupplierCost(index, 'supplier_cost_senior', isNaN(value) ? 0 : value);
                            }}
                            placeholder={t('optional')}
                          />
                          {pkg.supplier_cost_senior && pkg.exchange_rate && (
                            <p className="text-xs text-muted-foreground">
                              ≈ {formatCurrency(convertToUSD(pkg.supplier_cost_senior, pkg.exchange_rate), 'USD')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Base Prices - Hidden for suppliers AND when using custom tiers */}
                    {!isSupplier && !pkg.use_custom_tiers && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{t('basePrices')}</h4>
                          <span className="text-xs text-muted-foreground">{t('pricesFromSupplier')}</span>
                        </div>
                        <div className="grid gap-4 md:grid-cols-4">
                          <div className="space-y-2">
                            <Label>{t('adultBasePrice')}</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={pkg.base_adult_price ?? ''}
                              onChange={(e) => {
                                const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                updatePricingWithMarkup(index, 'base_adult_price', isNaN(value) ? 0 : value);
                              }}
                              placeholder="0.00"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>{t('childBasePrice')}</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={pkg.base_child_price ?? ''}
                              onChange={(e) => {
                                const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                updatePricingWithMarkup(index, 'base_child_price', isNaN(value) ? 0 : value);
                              }}
                              placeholder="0.00"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>{t('infantBasePrice')}</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={pkg.base_infant_price ?? ''}
                              onChange={(e) => {
                                const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                updatePricingWithMarkup(index, 'base_infant_price', isNaN(value) ? 0 : value);
                              }}
                              placeholder="Optional"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>{t('seniorBasePrice')}</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={pkg.base_senior_price ?? ''}
                              onChange={(e) => {
                                const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                updatePricingWithMarkup(index, 'base_senior_price', isNaN(value) ? 0 : value);
                              }}
                              placeholder="Optional"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Selling Prices - Hidden for suppliers AND when using custom tiers */}
                    {!isSupplier && !pkg.use_custom_tiers && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{t('sellingPrices')}</h4>
                          <span className="text-xs text-muted-foreground">
                            {pkg.markup_type && pkg.markup_type !== 'none' ? t('autoCalculated') : t('manualEntry')}
                          </span>
                        </div>
                      <div className="grid gap-4 md:grid-cols-4">
                        <div className="space-y-2">
                          <Label>{t('packageAdultPrice')}</Label>
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
                            className="font-semibold"
                            disabled={!isSupplier && pkg.markup_type !== 'none'}
                          />
                          {!isSupplier && pkg.markup_type && pkg.markup_type !== 'none' && pkg.base_adult_price && pkg.markup_value && (
                            <span className="text-xs text-muted-foreground">
                              ${pkg.base_adult_price} + {pkg.markup_type === 'percentage' ? `${pkg.markup_value}%` : `$${pkg.markup_value}`}
                            </span>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>{t('packageChildPrice')}</Label>
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
                            className="font-semibold"
                            disabled={!isSupplier && pkg.markup_type !== 'none'}
                          />
                          {!isSupplier && pkg.markup_type && pkg.markup_type !== 'none' && pkg.base_child_price && pkg.markup_value && (
                            <span className="text-xs text-muted-foreground">
                              ${pkg.base_child_price} + {pkg.markup_type === 'percentage' ? `${pkg.markup_value}%` : `$${pkg.markup_value}`}
                            </span>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>{t('packageInfantPrice')}</Label>
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
                            className="font-semibold"
                            disabled={!isSupplier && pkg.markup_type !== 'none'}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{t('packageSeniorPrice')}</Label>
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
                            className="font-semibold"
                            disabled={!isSupplier && pkg.markup_type !== 'none'}
                          />
                        </div>
                      </div>
                      </div>
                    )}

                    {/* Custom Pricing Tiers Section */}
                    {!isSupplier && (
                      <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 w-full">
                            <div className="flex items-center gap-2 select-none">

                              <Checkbox
                                id={`use-custom-tiers-${index}`}
                                checked={!!pkg.use_custom_tiers}
                                onCheckedChange={(checked) => {
                                  updatePackage(index, 'use_custom_tiers', checked === true);
                                }}
                              />
                              <Label
                                htmlFor={`use-custom-tiers-${index}`}
                                className="text-base font-medium cursor-pointer"
                              >
                                {t('useCustomPricingTiers')}
                              </Label>
                              <Badge variant="secondary" className="ml-2 cursor-pointer">
                                Advanced
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground ml-6">
                              {t('customTiersDescription')}
                            </p>
                          </div>
                        </div>

                        {pkg.use_custom_tiers && (
                          <div className="space-y-3 mt-4">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium">{t('customTiers')}</p>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const currentTiers = pkg.custom_pricing_tiers || [];
                                  const newTier: CustomPricingTier = {
                                    tier_type: 'child',
                                    tier_label: '',
                                    min_age: undefined,
                                    max_age: null,
                                    base_price: 0,
                                    selling_price: 0,
                                    supplier_cost: 0,
                                    description: '',
                                  };
                                  updatePackage(index, 'custom_pricing_tiers', [...currentTiers, newTier]);
                                }}
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                {t('addTier')}
                              </Button>
                            </div>

                            {pkg.custom_pricing_tiers && pkg.custom_pricing_tiers.length > 0 ? (
                              <div className="space-y-3">
                                {pkg.custom_pricing_tiers.map((tier, tierIndex) => (
                                  <div key={tierIndex} className="p-4 border rounded-lg space-y-3 bg-white dark:bg-gray-900">
                                    <div className="flex items-start justify-between">
                                      <Badge variant="outline">{t('tierNumber', { number: tierIndex + 1 })}</Badge>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                          const updated = (pkg.custom_pricing_tiers || []).filter((_, i) => i !== tierIndex);
                                          updatePackage(index, 'custom_pricing_tiers', updated);
                                        }}
                                      >
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                      </Button>
                                    </div>

                                    <div className="grid gap-3 md:grid-cols-2">
                                      <div className="space-y-2">
                                        <Label>{t('tierType')} *</Label>
                                        <Select
                                          value={tier.tier_type}
                                          onValueChange={(value) => {
                                            const updated = [...(pkg.custom_pricing_tiers || [])];
                                            updated[tierIndex] = { ...updated[tierIndex], tier_type: value as any };
                                            updatePackage(index, 'custom_pricing_tiers', updated);
                                          }}
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder={t('selectTierType')} />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="adult">{t('adult')}</SelectItem>
                                            <SelectItem value="child">{t('child')}</SelectItem>
                                            <SelectItem value="infant">{t('infant')}</SelectItem>
                                            <SelectItem value="senior">{t('senior')}</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="space-y-2">
                                        <Label>{t('tierLabel')} *</Label>
                                        <Input
                                          value={tier.tier_label}
                                          onChange={(e) => {
                                            const updated = [...(pkg.custom_pricing_tiers || [])];
                                            updated[tierIndex] = { ...updated[tierIndex], tier_label: e.target.value };
                                            updatePackage(index, 'custom_pricing_tiers', updated);
                                          }}
                                          placeholder={t('tierLabelPlaceholder')}
                                          required
                                        />
                                      </div>
                                    </div>

                                    <div className="grid gap-3 md:grid-cols-2">
                                      <div className="space-y-2">
                                        <Label>{t('ageRange')}</Label>
                                        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                                          <Input
                                            type="number"
                                            min="0"
                                            value={tier.min_age ?? ''}
                                            onChange={(e) => {
                                              const updated = [...(pkg.custom_pricing_tiers || [])];
                                              updated[tierIndex] = {
                                                ...updated[tierIndex],
                                                min_age: e.target.value === '' ? undefined : Number(e.target.value),
                                              };
                                              updatePackage(index, 'custom_pricing_tiers', updated);
                                            }}
                                            placeholder={t('min')}
                                          />
                                          <span className="text-sm text-muted-foreground">–</span>
                                          <Input
                                            type="number"
                                            min="0"
                                            value={tier.max_age ?? ''}
                                            onChange={(e) => {
                                              const updated = [...(pkg.custom_pricing_tiers || [])];
                                              updated[tierIndex] = {
                                                ...updated[tierIndex],
                                                max_age: e.target.value === '' ? null : Number(e.target.value),
                                              };
                                              updatePackage(index, 'custom_pricing_tiers', updated);
                                            }}
                                            placeholder={t('max')}
                                          />
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <Label>{t('supplierCost')} ({pkg.supplier_currency || 'USD'})</Label>
                                        <Input
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          value={tier.supplier_cost ?? ''}
                                          onChange={(e) => {
                                            const updated = [...(pkg.custom_pricing_tiers || [])];
                                            const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                            updated[tierIndex] = {
                                              ...updated[tierIndex],
                                              supplier_cost: isNaN(value) ? 0 : value,
                                            };
                                            updatePackage(index, 'custom_pricing_tiers', updated);
                                          }}
                                          placeholder="0.00"
                                        />
                                      </div>
                                    </div>

                                    <div className="grid gap-3 md:grid-cols-2">
                                      <div className="space-y-2">
                                        <Label>{t('basePrice')} (USD) *</Label>
                                        <Input
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          value={tier.base_price ?? ''}
                                          onChange={(e) => {
                                            const updated = [...(pkg.custom_pricing_tiers || [])];
                                            const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                            updated[tierIndex] = {
                                              ...updated[tierIndex],
                                              base_price: isNaN(value) ? 0 : value,
                                            };
                                            updatePackage(index, 'custom_pricing_tiers', updated);
                                          }}
                                          placeholder="0.00"
                                          required
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label>{t('sellingPrice')} (USD) *</Label>
                                        <Input
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          value={tier.selling_price ?? ''}
                                          onChange={(e) => {
                                            const updated = [...(pkg.custom_pricing_tiers || [])];
                                            const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                            updated[tierIndex] = {
                                              ...updated[tierIndex],
                                              selling_price: isNaN(value) ? 0 : value,
                                            };
                                            updatePackage(index, 'custom_pricing_tiers', updated);
                                          }}
                                          placeholder="0.00"
                                          required
                                        />
                                      </div>
                                    </div>

                                    <div className="space-y-2">
                                      <Label>{t('description')}</Label>
                                      <Textarea
                                        value={tier.description || ''}
                                        onChange={(e) => {
                                          const updated = [...(pkg.custom_pricing_tiers || [])];
                                          updated[tierIndex] = { ...updated[tierIndex], description: e.target.value };
                                          updatePackage(index, 'custom_pricing_tiers', updated);
                                        }}
                                        placeholder={t('tierDescriptionPlaceholder')}
                                        rows={2}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-6 text-muted-foreground border rounded-lg border-dashed">
                                <p className="text-sm">{t('noCustomTiers')}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Group Size */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>{t('packageMinGroupSize')} *</Label>
                        <Input
                          type="number"
                          min="1"
                          value={pkg.min_group_size}
                          onChange={(e) => updatePackage(index, 'min_group_size', Number(e.target.value))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('packageMaxGroupSize')}</Label>
                        <Input
                          type="number"
                          min="1"
                          value={pkg.max_group_size ?? ''}
                          onChange={(e) => updatePackage(index, 'max_group_size', e.target.value ? Number(e.target.value) : null)}
                        />
                      </div>
                    </div>

                    {/* Availability Dates */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>{t('availableFrom')}</Label>
                        <Input
                          type="date"
                          value={pkg.available_from}
                          onChange={(e) => updatePackage(index, 'available_from', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('availableTo')}</Label>
                        <Input
                          type="date"
                          value={pkg.available_to}
                          onChange={(e) => updatePackage(index, 'available_to', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Inclusions */}
                    <div className="space-y-2">
                      <Label>{t('inclusions')}</Label>
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
                            placeholder={t('addInclusion')}
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
                      <Label>{t('exclusions')}</Label>
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
                            placeholder={t('addExclusion')}
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

                    {/* Add-ons / Optional Extras */}
                    <div className="space-y-3 pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base">{t('addonsOptionalExtras')}</Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            {t('addonsDescription')}
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => addAddon(index)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          {t('addItem')}
                        </Button>
                      </div>

                      {pkg.addons && pkg.addons.length > 0 && (
                        <div className="space-y-3">
                          {pkg.addons.map((addon, addonIndex) => (
                            <div key={addonIndex} className="p-4 border rounded-lg space-y-3 bg-muted/30">
                              <div className="flex items-start justify-between">
                                <Badge variant="secondary">{t('addonNumber', { number: addonIndex + 1 })}</Badge>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeAddon(index, addonIndex)}
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </div>

                              <div className="grid gap-3 md:grid-cols-2">
                                <div className="space-y-2">
                                  <Label>{t('addonName')} *</Label>
                                  <Input
                                    value={addon.name}
                                    onChange={(e) => updateAddon(index, addonIndex, 'name', e.target.value)}
                                    placeholder={t('addonNamePlaceholder')}
                                    required
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>{t('addonCategory')}</Label>
                                  <Select
                                    value={addon.category || 'Other'}
                                    onValueChange={(value) => updateAddon(index, addonIndex, 'category', value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder={t('selectCategory')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Transportation">{t('transportation')}</SelectItem>
                                      <SelectItem value="Activities">{t('activities')}</SelectItem>
                                      <SelectItem value="Meals">{t('meals')}</SelectItem>
                                      <SelectItem value="Insurance">{t('insurance')}</SelectItem>
                                      <SelectItem value="Equipment">{t('equipment')}</SelectItem>
                                      <SelectItem value="Accommodation">{t('accommodation')}</SelectItem>
                                      <SelectItem value="Other">{t('other')}</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label>{t('description')}</Label>
                                <Textarea
                                  value={addon.description}
                                  onChange={(e) => updateAddon(index, addonIndex, 'description', e.target.value)}
                                  placeholder={t('addonDescriptionPlaceholder')}
                                  rows={2}
                                />
                              </div>

                              <div className="grid gap-3 md:grid-cols-3">
                                <div className="space-y-2">
                                  <Label>{t('pricingType')}</Label>
                                  <Select
                                    value={addon.pricing_type || 'per_person'}
                                    onValueChange={(value) => updateAddon(index, addonIndex, 'pricing_type', value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder={t('selectType')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="per_person">{t('perPerson')}</SelectItem>
                                      <SelectItem value="per_group">{t('perGroup')}</SelectItem>
                                      <SelectItem value="per_unit">{t('perUnit')}</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label>{t('priceUsd')} *</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={addon.price}
                                    onChange={(e) => updateAddon(index, addonIndex, 'price', parseFloat(e.target.value) || 0)}
                                    placeholder="0.00"
                                    required
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>{t('maxQuantity')}</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={addon.max_quantity}
                                    onChange={(e) => updateAddon(index, addonIndex, 'max_quantity', parseInt(e.target.value) || 1)}
                                    placeholder="1"
                                  />
                                </div>
                              </div>

                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`required-${index}-${addonIndex}`}
                                  checked={addon.is_required}
                                  onCheckedChange={(checked) => updateAddon(index, addonIndex, 'is_required', checked)}
                                />
                                <Label
                                  htmlFor={`required-${index}-${addonIndex}`}
                                  className="text-sm font-normal cursor-pointer"
                                >
                                  {t('requiredAddon')}
                                </Label>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {(!pkg.addons || pkg.addons.length === 0) && (
                        <div className="text-center py-6 text-muted-foreground border rounded-lg border-dashed">
                          <p className="text-sm">{t('noAddons')}</p>
                        </div>
                      )}
                    </div>

                    {/* Blocked Dates Management - Only show if package has an ID (saved) */}
                    {pkg.id ? (
                      <BlockedDatesManager
                        packageId={pkg.id}
                        packageName={pkg.package_name}
                      />
                    ) : (
                      <div className="mt-4 p-4 border border-dashed rounded-lg bg-muted/30">
                        <p className="text-sm text-muted-foreground text-center">
                          💡 Save this package first to manage blocked dates
                        </p>
                      </div>
                    )}

                    {/* Price Calculator - Hidden for now */}
                    {/* {pkg.id && (
                      <div className="mt-4">
                        <details className="group">
                          <summary className="cursor-pointer list-none">
                            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">💰 Price Calculator (Testing Tool)</span>
                                <Badge variant="outline" className="text-xs">Optional</Badge>
                              </div>
                              <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                            </div>
                          </summary>
                          <div className="mt-2">
                            <PriceCalculatorWidget
                              packageId={pkg.id}
                              packageName={pkg.package_name}
                              useCustomTiers={pkg.use_custom_tiers || false}
                              pricingTiers={pkg.pricing_tiers || []}
                              minGroupSize={pkg.min_group_size}
                              maxGroupSize={pkg.max_group_size}
                            />
                          </div>
                        </details>
                      </div>
                    )} */}
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
