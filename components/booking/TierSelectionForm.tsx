'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Minus, AlertCircle, Users, Info } from 'lucide-react';
import { formatPrice } from '@/lib/utils/pricing-calculator';
import type { PackagePricingTier, TierSelection } from '@/types/pricing';

interface TierSelectionFormProps {
  packageId: string;
  packageName?: string;
  pricingTiers: PackagePricingTier[];
  minGroupSize: number;
  maxGroupSize: number | null;
  currency?: string;
  onChange: (selections: TierSelection[]) => void;
  showValidation?: boolean;
}

export function TierSelectionForm({
  packageId,
  packageName,
  pricingTiers,
  minGroupSize,
  maxGroupSize,
  currency = 'USD',
  onChange,
  showValidation = true,
}: TierSelectionFormProps) {
  const [selections, setSelections] = useState<Record<string, number>>({});
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  // Sort tiers by display order
  const sortedTiers = [...pricingTiers]
    .filter(t => t.is_active)
    .sort((a, b) => {
      const orderA = a.display_order !== undefined ? a.display_order : 999;
      const orderB = b.display_order !== undefined ? b.display_order : 999;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return a.tier_type.localeCompare(b.tier_type);
    });

  // Calculate totals
  const totalPax = Object.values(selections).reduce((sum, qty) => sum + qty, 0);
  const adultsCount = Object.entries(selections)
    .filter(([tierId, qty]) => {
      const tier = pricingTiers.find(t => t.id === tierId);
      return tier?.tier_type === 'adult' && qty > 0;
    })
    .reduce((sum, [_, qty]) => sum + qty, 0);

  const totalPrice = Object.entries(selections).reduce((sum, [tierId, quantity]) => {
    if (quantity <= 0) return sum;
    const tier = pricingTiers.find(t => t.id === tierId);
    if (!tier) return sum;
    const price = tier.selling_price || tier.base_price;
    return sum + (price * quantity);
  }, 0);

  const isValidSize = totalPax >= minGroupSize && (maxGroupSize === null || totalPax <= maxGroupSize);

  // Validate selections
  useEffect(() => {
    if (!showValidation) {
      setValidationMessage(null);
      return;
    }

    if (totalPax === 0) {
      setValidationMessage(null);
      return;
    }

    // Check group size
    if (totalPax < minGroupSize) {
      setValidationMessage(`Minimum ${minGroupSize} travelers required`);
      return;
    }

    if (maxGroupSize && totalPax > maxGroupSize) {
      setValidationMessage(`Maximum ${maxGroupSize} travelers allowed`);
      return;
    }

    // Check adult accompaniment
    const childrenRequiringAdults = Object.entries(selections)
      .filter(([tierId, qty]) => {
        const tier = pricingTiers.find(t => t.id === tierId);
        return tier?.requires_adult_accompaniment && qty > 0;
      });

    if (childrenRequiringAdults.length > 0 && adultsCount === 0) {
      setValidationMessage('At least one adult is required when booking children');
      return;
    }

    // Check max per booking
    for (const [tierId, quantity] of Object.entries(selections)) {
      const tier = pricingTiers.find(t => t.id === tierId);
      if (tier?.max_per_booking && quantity > tier.max_per_booking) {
        setValidationMessage(`${tier.tier_label}: Maximum ${tier.max_per_booking} per booking`);
        return;
      }
    }

    setValidationMessage(null);
  }, [selections, totalPax, adultsCount, minGroupSize, maxGroupSize, pricingTiers, showValidation]);

  // Update quantity
  const updateQuantity = (tierId: string, quantity: number) => {
    const tier = pricingTiers.find(t => t.id === tierId);
    const maxAllowed = tier?.max_per_booking || 99;
    const newQuantity = Math.max(0, Math.min(quantity, maxAllowed));

    const updated = { ...selections, [tierId]: newQuantity };
    setSelections(updated);

    // Convert to TierSelection array for parent
    const tierSelections: TierSelection[] = Object.entries(updated)
      .filter(([_, qty]) => qty > 0)
      .map(([tierId, quantity]) => {
        const tier = pricingTiers.find(t => t.id === tierId);
        return {
          tier_id: tierId,
          tier_label: tier?.tier_label || '',
          quantity,
        };
      });

    onChange(tierSelections);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Select Travelers
            </CardTitle>
            {packageName && (
              <p className="text-sm text-muted-foreground mt-1">{packageName}</p>
            )}
          </div>
          <Badge variant="outline" className="text-xs">
            {minGroupSize}{maxGroupSize ? `-${maxGroupSize}` : '+'} people
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Tier Selection Cards */}
        <div className="space-y-3">
          {sortedTiers.map((tier) => {
            const price = tier.selling_price || tier.base_price;
            const quantity = selections[tier.id] || 0;

            return (
              <div
                key={tier.id}
                className={`
                  relative p-4 border rounded-lg transition-all duration-200
                  ${quantity > 0 ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}
                `}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Tier Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-base">{tier.tier_label}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {tier.tier_type}
                      </Badge>
                    </div>

                    {/* Age Range */}
                    {(tier.min_age !== undefined || tier.max_age !== undefined) && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Ages {tier.min_age !== undefined ? tier.min_age : '0'}
                        {tier.max_age !== undefined && tier.max_age !== null
                          ? `-${tier.max_age}`
                          : '+'}
                      </p>
                    )}

                    {/* Description */}
                    {tier.description && (
                      <p className="text-sm text-gray-600 mt-1">{tier.description}</p>
                    )}

                    {/* Requirements */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tier.requires_adult_accompaniment && (
                        <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Requires adult
                        </Badge>
                      )}
                      {tier.max_per_booking && (
                        <Badge variant="outline" className="text-xs">
                          Max {tier.max_per_booking} per booking
                        </Badge>
                      )}
                    </div>

                    {/* Booking Notes */}
                    {tier.booking_notes && quantity > 0 && (
                      <div className="mt-2 flex items-start gap-1 text-xs text-blue-600">
                        <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>{tier.booking_notes}</span>
                      </div>
                    )}

                    {/* Price */}
                    <p className="text-lg font-bold text-primary mt-2">
                      {formatPrice(price, currency)}
                      <span className="text-sm text-muted-foreground font-normal ml-1">
                        per person
                      </span>
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => updateQuantity(tier.id, quantity - 1)}
                        disabled={quantity === 0}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>

                      <Input
                        type="number"
                        min={0}
                        max={tier.max_per_booking || 99}
                        value={quantity}
                        onChange={(e) => updateQuantity(tier.id, Number(e.target.value))}
                        className="w-16 text-center font-semibold"
                      />

                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => updateQuantity(tier.id, quantity + 1)}
                        disabled={
                          (tier.max_per_booking && quantity >= tier.max_per_booking) ||
                          false
                        }
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Subtotal */}
                    {quantity > 0 && (
                      <p className="text-sm font-semibold text-gray-700">
                        {formatPrice(price * quantity, currency)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="border-t pt-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-700">Total Travelers:</span>
            <span
              className={`text-lg font-bold ${
                isValidSize ? 'text-green-600' : totalPax > 0 ? 'text-red-600' : 'text-gray-500'
              }`}
            >
              {totalPax} {totalPax === 1 ? 'person' : 'people'}
            </span>
          </div>

          {totalPax > 0 && (
            <div className="flex justify-between items-center text-lg">
              <span className="font-semibold text-gray-700">Estimated Total:</span>
              <span className="text-2xl font-bold text-primary">
                {formatPrice(totalPrice, currency)}
              </span>
            </div>
          )}

          {totalPax > 1 && (
            <div className="text-sm text-muted-foreground text-right">
              {formatPrice(totalPrice / totalPax, currency)} per person average
            </div>
          )}

          {/* Validation Message */}
          {showValidation && validationMessage && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{validationMessage}</AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {showValidation && !validationMessage && totalPax > 0 && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-700">
                ✓ Valid group size selected
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
