'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils/pricing-calculator';
import type { PriceCalculationResult } from '@/types/pricing';
import { Calculator, Loader2 } from 'lucide-react';

interface PriceCalculatorWidgetProps {
  packageId: string;
  packageName?: string;
}

export function PriceCalculatorWidget({ packageId, packageName }: PriceCalculatorWidgetProps) {
  const [travelDate, setTravelDate] = useState('');
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [adultCount, setAdultCount] = useState(2);
  const [childCount, setChildCount] = useState(0);
  const [infantCount, setInfantCount] = useState(0);
  const [seniorCount, setSeniorCount] = useState(0);
  const [promoCode, setPromoCode] = useState('');
  const [result, setResult] = useState<PriceCalculationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculatePrice = async () => {
    if (!travelDate) {
      setError('Please select a travel date');
      return;
    }

    const totalPax = adultCount + childCount + infantCount + seniorCount;
    if (totalPax === 0) {
      setError('Please select at least one passenger');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/pricing/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          package_id: packageId,
          travel_date: travelDate,
          booking_date: bookingDate,
          adult_count: adultCount,
          child_count: childCount,
          infant_count: infantCount,
          senior_count: seniorCount,
          promo_code: promoCode || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to calculate price');
      }

      const data: PriceCalculationResult = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error('Failed to calculate price:', err);
      setError(err.message || 'Failed to calculate price');
    } finally {
      setLoading(false);
    }
  };

  const totalPassengers = adultCount + childCount + infantCount + seniorCount;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Price Calculator
        </CardTitle>
        {packageName && (
          <p className="text-sm text-muted-foreground">{packageName}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Travel Date */}
        <div className="space-y-2">
          <Label htmlFor="travel-date">Travel Date *</Label>
          <Input
            id="travel-date"
            type="date"
            value={travelDate}
            onChange={(e) => setTravelDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        {/* Booking Date */}
        <div className="space-y-2">
          <Label htmlFor="booking-date">Booking Date</Label>
          <Input
            id="booking-date"
            type="date"
            value={bookingDate}
            onChange={(e) => setBookingDate(e.target.value)}
            max={travelDate || undefined}
          />
          <p className="text-xs text-muted-foreground">
            Used to calculate early bird discounts
          </p>
        </div>

        {/* Passenger Counts */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="adults">Adults (18+)</Label>
            <Input
              id="adults"
              type="number"
              min={0}
              value={adultCount}
              onChange={(e) => setAdultCount(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="children">Children (3-17)</Label>
            <Input
              id="children"
              type="number"
              min={0}
              value={childCount}
              onChange={(e) => setChildCount(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="infants">Infants (0-2)</Label>
            <Input
              id="infants"
              type="number"
              min={0}
              value={infantCount}
              onChange={(e) => setInfantCount(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="seniors">Seniors (65+)</Label>
            <Input
              id="seniors"
              type="number"
              min={0}
              value={seniorCount}
              onChange={(e) => setSeniorCount(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          Total passengers: {totalPassengers}
        </div>

        {/* Promo Code */}
        <div className="space-y-2">
          <Label htmlFor="promo-code">Promo Code (Optional)</Label>
          <Input
            id="promo-code"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
            placeholder="Enter promo code"
          />
        </div>

        {/* Calculate Button */}
        <Button
          onClick={calculatePrice}
          disabled={loading || !travelDate || totalPassengers === 0}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Calculating...
            </>
          ) : (
            'Calculate Price'
          )}
        </Button>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="border-t pt-4 space-y-3">
            <h3 className="font-semibold">Price Breakdown</h3>

            {/* Passenger Breakdown */}
            {result.breakdown.pricing_tiers.map((tier) => (
              <div key={tier.tier_type} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {tier.count} × {tier.tier_type.charAt(0).toUpperCase() + tier.tier_type.slice(1)} @ {formatPrice(tier.unit_price, result.currency)}
                </span>
                <span>{formatPrice(tier.subtotal, result.currency)}</span>
              </div>
            ))}

            <div className="flex justify-between text-sm font-medium pt-2 border-t">
              <span>Base Price</span>
              <span>{formatPrice(result.base_price, result.currency)}</span>
            </div>

            {/* Seasonal Adjustment */}
            {result.seasonal_adjustment !== 0 && result.breakdown.seasonal_pricing && (
              <div className={`flex justify-between text-sm ${result.seasonal_adjustment > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                <span>
                  {result.breakdown.seasonal_pricing.season_name}
                  {' '}({result.breakdown.seasonal_pricing.adjustment_type === 'percentage' ? `${result.breakdown.seasonal_pricing.adjustment_value}%` : formatPrice(result.breakdown.seasonal_pricing.adjustment_value, result.currency)})
                </span>
                <span>
                  {result.seasonal_adjustment > 0 ? '+' : ''}
                  {formatPrice(result.seasonal_adjustment, result.currency)}
                </span>
              </div>
            )}

            {/* Group Discount */}
            {result.group_discount > 0 && result.breakdown.group_pricing && (
              <div className="flex justify-between text-sm text-green-600">
                <span>
                  Group Discount ({result.breakdown.group_pricing.min_pax}-{result.breakdown.group_pricing.max_pax} pax)
                </span>
                <span>-{formatPrice(result.group_discount, result.currency)}</span>
              </div>
            )}

            {/* Early Bird Discount */}
            {result.time_based_discount > 0 && result.breakdown.time_based_discount && (
              <div className="flex justify-between text-sm text-green-600">
                <span>
                  {result.breakdown.time_based_discount.discount_name}
                  {' '}({result.days_before_travel} days in advance)
                </span>
                <span>-{formatPrice(result.time_based_discount, result.currency)}</span>
              </div>
            )}

            {/* Promo Code */}
            {result.promo_discount > 0 && result.breakdown.promotion && (
              <div className="flex justify-between text-sm text-green-600">
                <span>
                  {result.breakdown.promotion.promotion_code}
                  {' '}({result.breakdown.promotion.promotion_name})
                </span>
                <span>-{formatPrice(result.promo_discount, result.currency)}</span>
              </div>
            )}

            {/* Add-ons */}
            {result.addons_total > 0 && result.breakdown.addons && result.breakdown.addons.length > 0 && (
              <>
                <div className="text-sm font-medium pt-2 border-t">Add-ons:</div>
                {result.breakdown.addons.map((addon) => (
                  <div key={addon.addon_id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {addon.addon_name} ({addon.quantity}x)
                    </span>
                    <span>{formatPrice(addon.subtotal, result.currency)}</span>
                  </div>
                ))}
              </>
            )}

            {/* Total */}
            <div className="flex justify-between font-bold text-lg border-t pt-3">
              <span>Total Price</span>
              <span className="text-primary">{formatPrice(result.total_price, result.currency)}</span>
            </div>

            {/* Per Person */}
            {totalPassengers > 1 && (
              <div className="text-sm text-muted-foreground text-right">
                {formatPrice(result.total_price / totalPassengers, result.currency)} per person
              </div>
            )}

            {/* Total Savings */}
            {(result.group_discount + result.time_based_discount + result.promo_discount) > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3 text-center">
                <div className="text-sm text-green-700">💰 Total Savings</div>
                <div className="text-xl font-bold text-green-700">
                  {formatPrice(result.group_discount + result.time_based_discount + result.promo_discount, result.currency)}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
