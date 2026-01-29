'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, X, Trash2, Package, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslations } from 'next-intl';
import { CURRENCIES, formatCurrency } from '@/lib/constants/currencies';
import { DualLanguageInput } from './DualLanguageInput';
import { DualLanguageArrayInput } from './DualLanguageArrayInput';
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
  supplier_currency?: string;
  supplier_cost?: number;
  addon_exchange_rate?: number;
  // Chinese language fields
  name_zh?: string;
  description_zh?: string;
}

export interface CustomPricingTier {
  id?: string;
  tier_type: 'adult' | 'child' | 'infant' | 'senior' | 'vehicle';
  tier_label: string;
  min_age?: number;
  max_age?: number | null;
  base_price: number;
  selling_price: number;
  supplier_cost?: number;
  supplier_currency?: string;
  tier_exchange_rate?: number;
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

  // Chinese language fields
  package_name_zh?: string;
  description_zh?: string;
  inclusions_zh?: string[];
  exclusions_zh?: string[];

  // Markup settings
  markup_type?: 'percentage' | 'fixed' | 'none';
  markup_value?: number;

  // Base prices (cost from supplier)
  base_adult_price?: number;
  base_child_price?: number;
  base_infant_price?: number;
  base_senior_price?: number;
  base_vehicle_price?: number;

  // Supplier currency fields
  supplier_currency?: string;
  supplier_cost_adult?: number;
  supplier_cost_child?: number;
  supplier_cost_infant?: number;
  supplier_cost_senior?: number;
  supplier_cost_vehicle?: number;
  exchange_rate?: number;

  // Selling prices (calculated or manual)
  adult_price: number;
  child_price: number;
  infant_price?: number;
  senior_price?: number;
  vehicle_price?: number;

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
      inclusions_zh: [],
      exclusions_zh: [],
      display_order: packages.length,
      is_active: true,
      requires_full_payment: false,
      markup_type: 'percentage',
      markup_value: 0,
      base_adult_price: 0,
      base_child_price: 0,
      base_infant_price: 0,
      base_senior_price: 0,
      base_vehicle_price: 0,
      supplier_currency: 'USD',
      supplier_cost_adult: 0,
      supplier_cost_child: 0,
      supplier_cost_infant: 0,
      supplier_cost_senior: 0,
      supplier_cost_vehicle: 0,
      exchange_rate: 1.0,
      adult_price: 0,
      child_price: 0,
      adult_min_age: 18,
      adult_max_age: null,
      child_min_age: 3,
      child_max_age: 17,
      infant_price: 0,
      senior_price: 0,
      vehicle_price: 0,
      use_custom_tiers: false,
      custom_pricing_tiers: [],
      addons: [],
    };
    onChange([...packages, newPackage]);
    setExpandedPackage(packages.length);
  };

  const duplicatePackage = (index: number) => {
    const pkgToDuplicate = packages[index];

    // Deep clone the package to avoid reference issues
    const duplicatedPackage: PackageFormData = {
      ...pkgToDuplicate,
      id: undefined, // Remove ID so it creates a new package
      package_name: `${pkgToDuplicate.package_name} (Copy)`,
      package_code: generatePackageCode(`${pkgToDuplicate.package_name} Copy`),
      display_order: packages.length,
      // Deep clone arrays
      inclusions: [...(pkgToDuplicate.inclusions || [])],
      exclusions: [...(pkgToDuplicate.exclusions || [])],
      inclusions_zh: [...(pkgToDuplicate.inclusions_zh || [])],
      exclusions_zh: [...(pkgToDuplicate.exclusions_zh || [])],
      custom_pricing_tiers: pkgToDuplicate.custom_pricing_tiers?.map(tier => ({
        ...tier,
        id: undefined, // Remove tier IDs so they create new records
      })) || [],
      addons: pkgToDuplicate.addons?.map(addon => ({
        ...addon,
        id: undefined, // Remove addon IDs so they create new records
      })) || [],
    };

    const newPackages = [...packages, duplicatedPackage];
    onChange(newPackages);
    setExpandedPackage(packages.length); // Expand the newly duplicated package
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
      if (pkg.supplier_cost_vehicle) {
        updated[index].base_vehicle_price = roundCurrency(convertToUSD(pkg.supplier_cost_vehicle, exchangeRate));
      }

      // Also recalculate selling prices with markup
      const markupType = pkg.markup_type || 'none';
      const markupValue = pkg.markup_value || 0;
      updated[index].adult_price = calculateSellingPrice(updated[index].base_adult_price || 0, markupType, markupValue);
      updated[index].child_price = calculateSellingPrice(updated[index].base_child_price || 0, markupType, markupValue);
      updated[index].infant_price = calculateSellingPrice(updated[index].base_infant_price || 0, markupType, markupValue);
      updated[index].senior_price = calculateSellingPrice(updated[index].base_senior_price || 0, markupType, markupValue);
      updated[index].vehicle_price = calculateSellingPrice(updated[index].base_vehicle_price || 0, markupType, markupValue);
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
      updated[index].vehicle_price = calculateSellingPrice(pkg.base_vehicle_price || 0, markupType, markupValue);
    }

    onChange(updated);
  };

  const addAddon = (packageIndex: number) => {
    const updated = [...packages];
    if (!updated[packageIndex].addons) {
      updated[packageIndex].addons = [];
    }

    // For suppliers, inherit package currency and exchange rate but don't auto-calculate price
    // For admins, inherit both currency and exchange rate for auto-calculation
    const newAddon: AddOnItem = {
      name: '',
      description: '',
      price: 0,
      is_required: false,
      max_quantity: 1,
      pricing_type: 'per_person',
      category: 'Other',
      supplier_currency: updated[packageIndex].supplier_currency || 'USD',
      supplier_cost: undefined,
      addon_exchange_rate: updated[packageIndex].exchange_rate || 1.0,
    };

    updated[packageIndex].addons!.push(newAddon);
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

  const updateAddonWithCurrency = (packageIndex: number, addonIndex: number, field: keyof AddOnItem, value: any) => {
    const updated = [...packages];
    if (!updated[packageIndex].addons) return;

    updated[packageIndex].addons![addonIndex] = {
      ...updated[packageIndex].addons![addonIndex],
      [field]: value,
    };

    const addon = updated[packageIndex].addons![addonIndex];

    // Auto-convert supplier cost to price (USD) only for admin/manager when supplier cost or exchange rate changes
    // Suppliers cannot trigger auto-conversion (they don't see/control exchange rate)
    if (!isSupplier && (field === 'supplier_cost' || field === 'addon_exchange_rate' || field === 'supplier_currency')) {
      if (addon.supplier_cost && addon.addon_exchange_rate) {
        updated[packageIndex].addons![addonIndex].price = roundCurrency(
          convertToUSD(addon.supplier_cost, addon.addon_exchange_rate)
        );
      }
    }

    onChange(updated);
  };

  const removeAddon = (packageIndex: number, addonIndex: number) => {
    const updated = [...packages];
    if (!updated[packageIndex].addons) return;
    updated[packageIndex].addons = updated[packageIndex].addons!.filter((_, i) => i !== addonIndex);
    onChange(updated);
  };

  // Color scheme for different packages
  const packageColors = [
    { border: 'border-l-blue-500', bg: 'bg-blue-50/50 dark:bg-blue-950/20', label: 'bg-blue-100 text-blue-700' },
    { border: 'border-l-purple-500', bg: 'bg-purple-50/50 dark:bg-purple-950/20', label: 'bg-purple-100 text-purple-700' },
    { border: 'border-l-amber-500', bg: 'bg-amber-50/50 dark:bg-amber-950/20', label: 'bg-amber-100 text-amber-700' },
    { border: 'border-l-green-500', bg: 'bg-green-50/50 dark:bg-green-950/20', label: 'bg-green-100 text-green-700' },
    { border: 'border-l-pink-500', bg: 'bg-pink-50/50 dark:bg-pink-950/20', label: 'bg-pink-100 text-pink-700' },
    { border: 'border-l-cyan-500', bg: 'bg-cyan-50/50 dark:bg-cyan-950/20', label: 'bg-cyan-100 text-cyan-700' },
  ];

  const getPackageColor = (index: number) => packageColors[index % packageColors.length];

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
            {packages.map((pkg, index) => {
              const colors = getPackageColor(index);
              return (
              <div key={index} className={`border rounded-lg border-l-4 ${colors.border} ${colors.bg}`}>
                {/* Package Header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
                  onClick={() => setExpandedPackage(expandedPackage === index ? -1 : index)}
                >
                  <div className="flex items-center gap-3">
                    <Badge className={`${colors.label} font-semibold`}>#{index + 1}</Badge>
                    <span className="font-medium">{pkg.package_name || t('packageName')}</span>
                    {pkg.package_code && (
                      <Badge variant="outline">{pkg.package_code}</Badge>
                    )}
                    <Badge variant={pkg.tour_type === 'private' ? 'default' : 'secondary'} className={pkg.tour_type === 'private' ? 'bg-purple-600' : 'bg-blue-400'}>
                      {pkg.tour_type === 'private' ? t('packagePrivate') : t('packageGroup')}
                    </Badge>
                    <Badge variant={pkg.is_active ? 'default' : 'secondary'}>
                      {pkg.is_active ? t('packageActive') : t('packageInactive')}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Adult: ${Math.floor(pkg.adult_price)}
                    {pkg.adult_min_age !== undefined && (
                      <> ({pkg.adult_min_age}{pkg.adult_max_age ? `–${pkg.adult_max_age}` : '+'})</>
                    )}
                    {" | "}
                    Child: ${Math.floor(pkg.child_price)}
                    {pkg.child_min_age !== undefined && pkg.child_max_age !== undefined && (
                      <> ({pkg.child_min_age}–{pkg.child_max_age})</>
                    )}
                  </span>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicatePackage(index);
                      }}
                      title="Duplicate package"
                    >
                      <Copy className="w-4 h-4 text-blue-500" />
                    </Button>

                    {packages.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          removePackage(index);
                        }}
                        title="Delete package"
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
                      <DualLanguageInput
                        label={t('packageName')}
                        id={`package_name_${index}`}
                        type="text"
                        valueEn={pkg.package_name}
                        valueZh={pkg.package_name_zh || ''}
                        onChangeEn={(value) => updatePackage(index, 'package_name', value)}
                        onChangeZh={(value) => updatePackage(index, 'package_name_zh', value)}
                        placeholder={t('packageNamePlaceholder')}
                        placeholderZh="例如：标准套餐"
                        required
                      />
                      <div className="space-y-2">
                        <Label>{t('packageCode')}</Label>
                        <Input
                          value={pkg.package_code}
                          onChange={(e) => updatePackage(index, 'package_code', e.target.value)}
                          placeholder={t('packageCodePlaceholder')}
                        />
                      </div>
                    </div>

                    <DualLanguageInput
                      label={t('description')}
                      id={`package_description_${index}`}
                      type="textarea"
                      valueEn={pkg.description}
                      valueZh={pkg.description_zh || ''}
                      onChangeEn={(value) => updatePackage(index, 'description', value)}
                      onChangeZh={(value) => updatePackage(index, 'description_zh', value)}
                      placeholder={t('packageDescriptionPlaceholder')}
                      placeholderZh="输入套餐描述..."
                      rows={3}
                    />

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
                                  onChange={(e) => {
                                    const value = e.target.value === '' ? undefined : Number(e.target.value);
                                    updatePackage(index, 'child_max_age', value);
                                  }}
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
                                  onChange={(e) => {
                                    const value = e.target.value === '' ? undefined : Number(e.target.value);
                                    updatePackage(index, 'adult_min_age', value);
                                  }}
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
                              const rawValue = e.target.value;
                              const parsedValue = rawValue === '' ? 0 : parseFloat(rawValue);

                              const flooredValue = isNaN(parsedValue)
                                ? 0
                                : Math.floor(parsedValue);

                              updateSupplierCost(index, 'supplier_cost_adult', flooredValue); 
                            }}
                            placeholder="0.00"
                          />
                          {pkg.supplier_cost_adult && pkg.exchange_rate && (
                            <p className="text-xs text-muted-foreground">
                              ≈ {formatCurrency(Math.floor(convertToUSD(pkg.supplier_cost_adult, pkg.exchange_rate)), 'USD')}
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
                              const rawValue = e.target.value;
                              const parsedValue = rawValue === '' ? 0 : parseFloat(rawValue);

                              const flooredValue = isNaN(parsedValue)
                                ? 0
                                : Math.floor(parsedValue);

                              updateSupplierCost(index, 'supplier_cost_child', flooredValue);
                            }}
                            placeholder="0.00"
                          />
                          {pkg.supplier_cost_child && pkg.exchange_rate && (
                            <p className="text-xs text-muted-foreground">
                              ≈ {formatCurrency(Math.floor(convertToUSD(pkg.supplier_cost_child, pkg.exchange_rate)), 'USD')}
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
                              const rawValue = e.target.value;
                              const parsedValue = rawValue === '' ? 0 : parseFloat(rawValue);

                              const flooredValue = isNaN(parsedValue)
                                ? 0
                                : Math.floor(parsedValue);

                              updateSupplierCost(index, 'supplier_cost_infant', flooredValue);
                            }}
                            placeholder={t('optional')}
                          />
                          {pkg.supplier_cost_infant && pkg.exchange_rate && (
                            <p className="text-xs text-muted-foreground">
                              ≈ {formatCurrency(Math.floor(convertToUSD(pkg.supplier_cost_infant, pkg.exchange_rate)), 'USD')}
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
                              const rawValue = e.target.value;
                              const parsedValue = rawValue === '' ? 0 : parseFloat(rawValue);

                              const flooredValue = isNaN(parsedValue)
                                ? 0
                                : Math.floor(parsedValue);

                              updateSupplierCost(index, 'supplier_cost_senior', flooredValue);
                            }}
                            placeholder={t('optional')}
                          />
                          {pkg.supplier_cost_senior && pkg.exchange_rate && (
                            <p className="text-xs text-muted-foreground">
                              ≈ {formatCurrency(Math.floor(convertToUSD(pkg.supplier_cost_senior, pkg.exchange_rate)), 'USD')}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>Vehicle Cost ({pkg.supplier_currency || 'USD'})</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={pkg.supplier_cost_vehicle ?? ''}
                            onChange={(e) => {
                              const rawValue = e.target.value;
                              const parsedValue = rawValue === '' ? 0 : parseFloat(rawValue);

                              const flooredValue = isNaN(parsedValue)
                                ? 0
                                : Math.floor(parsedValue);

                              updateSupplierCost(index, 'supplier_cost_vehicle', flooredValue);
                            }}
                            placeholder={t('optional')}
                          />
                          {pkg.supplier_cost_vehicle && pkg.exchange_rate && (
                            <p className="text-xs text-muted-foreground">
                              ≈ {formatCurrency(Math.floor(convertToUSD(pkg.supplier_cost_vehicle, pkg.exchange_rate)), 'USD')}
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
                                const rawValue = e.target.value;
                                const parsedValue = rawValue === '' ? 0 : parseFloat(rawValue);
                            
                                const flooredValue = isNaN(parsedValue)
                                  ? 0
                                  : Math.floor(parsedValue);
                            
                                updatePricingWithMarkup(index, 'base_adult_price', flooredValue);
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
                                // const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                // updatePricingWithMarkup(index, 'base_child_price', isNaN(value) ? 0 : value);
                                const rawValue = e.target.value;
                                const parsedValue = rawValue === '' ? 0 : parseFloat(rawValue);
                            
                                const flooredValue = isNaN(parsedValue)
                                  ? 0
                                  : Math.floor(parsedValue);
                            
                                updatePricingWithMarkup(index, 'base_child_price', flooredValue);
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
                                const rawValue = e.target.value;
                                const parsedValue = rawValue === '' ? 0 : parseFloat(rawValue);
                            
                                const flooredValue = isNaN(parsedValue)
                                  ? 0
                                  : Math.floor(parsedValue);
                            
                                updatePricingWithMarkup(index, 'base_infant_price', flooredValue);
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
                                const rawValue = e.target.value;
                                const parsedValue = rawValue === '' ? 0 : parseFloat(rawValue);

                                const flooredValue = isNaN(parsedValue)
                                  ? 0
                                  : Math.floor(parsedValue);

                                updatePricingWithMarkup(index, 'base_senior_price', flooredValue);
                              }}
                              placeholder="Optional"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Vehicle Base Price</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={pkg.base_vehicle_price ?? ''}
                              onChange={(e) => {
                                const rawValue = e.target.value;
                                const parsedValue = rawValue === '' ? 0 : parseFloat(rawValue);

                                const flooredValue = isNaN(parsedValue)
                                  ? 0
                                  : Math.floor(parsedValue);

                                updatePricingWithMarkup(index, 'base_vehicle_price', flooredValue);
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
                        <div className="space-y-2">
                          <Label>Vehicle Price (per vehicle)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={pkg.vehicle_price ?? ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                              updatePackage(index, 'vehicle_price', value === undefined || isNaN(value) ? undefined : value);
                            }}
                            placeholder="Optional"
                            className="font-semibold"
                            disabled={!isSupplier && pkg.markup_type !== 'none'}
                          />
                          {!isSupplier && pkg.markup_type && pkg.markup_type !== 'none' && pkg.base_vehicle_price && pkg.markup_value && (
                            <span className="text-xs text-muted-foreground">
                              ${pkg.base_vehicle_price} + {pkg.markup_type === 'percentage' ? `${pkg.markup_value}%` : `$${pkg.markup_value}`}
                            </span>
                          )}
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
                                    supplier_currency: pkg.supplier_currency || 'USD',
                                    tier_exchange_rate: pkg.exchange_rate || 1.0,
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
                                    </div>

                                    {/* Supplier Currency & Cost */}
                                    <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                      <div className="grid gap-3 md:grid-cols-3">
                                        <div className="space-y-2">
                                          <Label>Supplier Currency</Label>
                                          <Select
                                            value={tier.supplier_currency || 'USD'}
                                            onValueChange={(value) => {
                                              const updated = [...(pkg.custom_pricing_tiers || [])];
                                              updated[tierIndex] = {
                                                ...updated[tierIndex],
                                                supplier_currency: value,
                                              };
                                              updatePackage(index, 'custom_pricing_tiers', updated);
                                            }}
                                          >
                                            <SelectTrigger>
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {CURRENCIES.map(curr => (
                                                <SelectItem key={curr.code} value={curr.code}>
                                                  {curr.code} - {curr.name}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className="space-y-2">
                                          <Label>Exchange Rate</Label>
                                          <Input
                                            type="number"
                                            min="0"
                                            step="0.0001"
                                            value={tier.tier_exchange_rate ?? ''}
                                            onChange={(e) => {
                                              const updated = [...(pkg.custom_pricing_tiers || [])];
                                              const value = e.target.value === '' ? 1.0 : parseFloat(e.target.value);
                                              updated[tierIndex] = {
                                                ...updated[tierIndex],
                                                tier_exchange_rate: isNaN(value) ? 1.0 : value,
                                              };
                                              updatePackage(index, 'custom_pricing_tiers', updated);
                                            }}
                                            placeholder="1.0000"
                                          />
                                          <p className="text-xs text-muted-foreground">
                                            1 {tier.supplier_currency || 'USD'} = X USD
                                          </p>
                                        </div>
                                        <div className="space-y-2">
                                          <Label>Supplier Cost ({tier.supplier_currency || 'USD'})</Label>
                                          <Input
                                            type="number"
                                            min="0"
                                            step="1"
                                            value={tier.supplier_cost ?? ''}
                                            onChange={(e) => {
                                              const updated = [...(pkg.custom_pricing_tiers || [])];
                                              const value = Number(e.target.value);
                                          
                                              updated[tierIndex] = {
                                                ...updated[tierIndex],
                                                supplier_cost: isNaN(value) ? 0 : Math.floor(value),
                                              };
                                          
                                              updatePackage(index, 'custom_pricing_tiers', updated);
                                            }}
                                            placeholder="0.00"
                                          />
                                          {tier.supplier_cost && tier.tier_exchange_rate && tier.supplier_currency !== 'USD' && (
                                            <p className="text-xs text-muted-foreground">
                                              ≈ {formatCurrency(Math.floor(convertToUSD(tier.supplier_cost, tier.tier_exchange_rate)), 'USD')}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Base Price & Selling Price with Auto-Convert */}
                                    <div className="grid gap-3 md:grid-cols-2">
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                          <Label>{t('basePrice')} (USD) *</Label>
                                          {tier.supplier_cost && tier.tier_exchange_rate && tier.supplier_currency !== 'USD' && (
                                            <Button
                                              type="button"
                                              variant="outline"
                                              size="sm"
                                              className="h-6 text-xs"
                                              onClick={() => {
                                                const updated = [...(pkg.custom_pricing_tiers || [])];
                                                const convertedPrice = roundCurrency(
                                                  convertToUSD(tier.supplier_cost || 0, tier.tier_exchange_rate || 1.0)
                                                );
                                                updated[tierIndex] = {
                                                  ...updated[tierIndex],
                                                  base_price: convertedPrice,
                                                  selling_price: convertedPrice,
                                                };
                                                updatePackage(index, 'custom_pricing_tiers', updated);
                                              }}
                                            >
                                              Auto-convert
                                            </Button>
                                          )}
                                        </div>
                                        <Input
                                          type="number"
                                          min="0"
                                          step="1"
                                          value={Math.floor(tier.base_price) ?? ''}
                                          onChange={(e) => {
                                            const updated = [...(pkg.custom_pricing_tiers || [])];
                                            const value = parseFloat(e.target.value);
                                        
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
                                        <div className="flex items-center justify-between">
                                          <Label>{t('sellingPrice')} (USD) *</Label>
                                          {tier.base_price > 0 && pkg.markup_type && pkg.markup_type !== 'none' && pkg.markup_value && (
                                            <Button
                                              type="button"
                                              variant="outline"
                                              size="sm"
                                              className="h-6 text-xs"
                                              onClick={() => {
                                                const updated = [...(pkg.custom_pricing_tiers || [])];
                                                let calculatedPrice = tier.base_price;
                                                const markupValue = pkg.markup_value || 0;
                                                if (pkg.markup_type === 'percentage') {
                                                  calculatedPrice = tier.base_price * (1 + (markupValue / 100));
                                                } else if (pkg.markup_type === 'fixed') {
                                                  calculatedPrice = tier.base_price + markupValue;
                                                }
                                                updated[tierIndex] = {
                                                  ...updated[tierIndex],
                                                  selling_price: roundCurrency(calculatedPrice),
                                                };
                                                updatePackage(index, 'custom_pricing_tiers', updated);
                                              }}
                                            >
                                              Apply markup
                                            </Button>
                                          )}
                                        </div>
                                        <Input
                                          type="number"
                                          min="0"
                                          step="1"
                                          value={Math.floor(tier.selling_price) ?? ''}
                                          onChange={(e) => {
                                            const updated = [...(pkg.custom_pricing_tiers || [])];
                                            const value = Number(e.target.value);

                                            updated[tierIndex] = {
                                              ...updated[tierIndex],
                                              selling_price: isNaN(value) ? 0 : Math.floor(value),
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
                    <DualLanguageArrayInput
                      label={t('inclusions')}
                      id={`package-${index}-inclusions`}
                      valuesEn={pkg.inclusions}
                      valuesZh={pkg.inclusions_zh || []}
                      onChangeEn={(values) => updatePackage(index, 'inclusions', values)}
                      onChangeZh={(values) => updatePackage(index, 'inclusions_zh', values)}
                      placeholderEn={t('addInclusion')}
                      placeholderZh="添加包含项目"
                    />

                    {/* Exclusions */}
                    <DualLanguageArrayInput
                      label={t('exclusions')}
                      id={`package-${index}-exclusions`}
                      valuesEn={pkg.exclusions}
                      valuesZh={pkg.exclusions_zh || []}
                      onChangeEn={(values) => updatePackage(index, 'exclusions', values)}
                      onChangeZh={(values) => updatePackage(index, 'exclusions_zh', values)}
                      placeholderEn={t('addExclusion')}
                      placeholderZh="添加不包含项目"
                    />

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
                                <DualLanguageInput
                                  label={t('addonName')}
                                  id={`addon_name_${index}_${addonIndex}`}
                                  type="text"
                                  valueEn={addon.name}
                                  valueZh={addon.name_zh || ''}
                                  onChangeEn={(value) => updateAddon(index, addonIndex, 'name', value)}
                                  onChangeZh={(value) => updateAddon(index, addonIndex, 'name_zh', value)}
                                  placeholder={t('addonNamePlaceholder')}
                                  placeholderZh="例如：私人接送"
                                  required
                                />
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

                              <DualLanguageInput
                                label={t('description')}
                                id={`addon_description_${index}_${addonIndex}`}
                                type="textarea"
                                valueEn={addon.description}
                                valueZh={addon.description_zh || ''}
                                onChangeEn={(value) => updateAddon(index, addonIndex, 'description', value)}
                                onChangeZh={(value) => updateAddon(index, addonIndex, 'description_zh', value)}
                                placeholder={t('addonDescriptionPlaceholder')}
                                placeholderZh="输入附加项描述..."
                                rows={2}
                              />

                              {/* Supplier Currency Section for Add-ons */}
                              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                <div className="space-y-3">
                                  <h5 className="text-sm font-medium">{isSupplier ? t('yourCostPrice') : t('supplierCostPrice')}</h5>
                                  <div className="grid gap-3 md:grid-cols-3">
                                    <div className="space-y-2">
                                      <Label>{t('currency')}</Label>
                                      <Select
                                        value={addon.supplier_currency || 'USD'}
                                        onValueChange={(value) => updateAddonWithCurrency(index, addonIndex, 'supplier_currency', value)}
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {CURRENCIES.map((currency) => (
                                            <SelectItem key={currency.code} value={currency.code}>
                                              {currency.symbol} {currency.code}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    {!isSupplier && (
                                      <div className="space-y-2">
                                        <Label>{t('exchangeRate')}</Label>
                                        <div className="flex items-center gap-1">
                                          <span className="text-xs text-muted-foreground">1 {addon.supplier_currency || 'USD'} =</span>
                                          <Input
                                            type="number"
                                            min="0"
                                            step="0.0001"
                                            value={addon.addon_exchange_rate ?? 1.0}
                                            onChange={(e) => {
                                              const value = parseFloat(e.target.value);
                                              updateAddonWithCurrency(index, addonIndex, 'addon_exchange_rate', isNaN(value) ? 1.0 : value);
                                            }}
                                            placeholder="1.0"
                                            className="text-sm"
                                          />
                                          <span className="text-xs text-muted-foreground">USD</span>
                                        </div>
                                      </div>
                                    )}
                                    <div className="space-y-2">
                                      <Label>{isSupplier ? t('costPrice') : t('supplierCost')} ({addon.supplier_currency || 'USD'})</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={addon.supplier_cost ?? ''}
                                        onChange={(e) => {
                                          const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                                          updateAddonWithCurrency(index, addonIndex, 'supplier_cost', value === undefined || isNaN(value) ? undefined : value);
                                        }}
                                        placeholder="0.00"
                                      />
                                      {addon.supplier_cost && addon.addon_exchange_rate && addon.supplier_currency !== 'USD' && (
                                        <p className="text-xs text-muted-foreground">
                                          ≈ {formatCurrency(convertToUSD(addon.supplier_cost, addon.addon_exchange_rate), 'USD')}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
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
                                    placeholder={isSupplier ? "Will be set by admin" : "0.00"}
                                    required
                                    disabled={isSupplier || (addon.supplier_cost && addon.addon_exchange_rate)}
                                  />
                                  {isSupplier && (
                                    <p className="text-xs text-muted-foreground">
                                      Admin will convert from your cost price
                                    </p>
                                  )}
                                  {!isSupplier && addon.supplier_cost && addon.addon_exchange_rate && (
                                    <p className="text-xs text-muted-foreground">
                                      {t('autoCalculated')}
                                    </p>
                                  )}
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
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
