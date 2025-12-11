# How to Use the New Pricing System

## ✅ What's Now Working

I've successfully integrated the **Package & Pricing** section into your experience creation form!

---

## 🎯 Where to Find It

Go to: **`/admin/experiences/new`**

You'll now see a new section called **"Packages & Pricing"** between the "Basic Information" and "Images" sections.

---

## 📝 How to Use It

### Step 1: Fill in Basic Information
- Title: "Bali Volcano Sunrise Trek"
- Location: "Bali, Indonesia"
- Country: Indonesia
- Duration: "8h"
- Category: Adventure
- Description: Your experience description

### Step 2: Configure Package & Pricing

The **"Packages & Pricing"** section now appears with a default "Standard Package":

#### Click on the package header to expand it and you'll see:

**Package Details:**
- Package Name: "Standard Package" (you can change this)
- Package Code: "STD" (optional - e.g., STD, PREM, LUX)
- Description: Describe what makes this package special

**Pricing (Required):**
- Adult Price (USD): e.g., 85
- Child Price (USD): e.g., 60
- Infant Price (USD): (optional) e.g., 20
- Senior Price (USD): (optional) e.g., 75

**Group Size:**
- Min Group Size: e.g., 2
- Max Group Size: e.g., 12

**Availability:**
- Available From: (optional date)
- Available To: (optional date)

**Inclusions:**
- Type inclusions and press Enter (e.g., "Hotel pickup", "Guide", "Meals")

**Exclusions:**
- Type exclusions and press Enter (e.g., "Personal expenses", "Tips")

#### Add More Package Variants (Optional)

Click the **"Add Package"** button to create additional packages like:
- Premium Package (higher price, more inclusions)
- Luxury Package (premium price, all-inclusive)

### Step 3: Complete the Rest of the Form
- Upload images
- Add highlights
- Configure itinerary
- Add FAQs
- etc.

### Step 4: Submit
Click **"Create Experience & Packages"**

The system will:
1. Create your experience
2. Create all your packages
3. Set up pricing tiers automatically

---

## 🎨 What You'll See

### Collapsed View:
```
┌─────────────────────────────────────────────┐
│  Packages & Pricing                         │
│  [+ Add Package]                            │
├─────────────────────────────────────────────┤
│  📦 Standard Package [STD] [Active]        │
│  Adult: $85 | Child: $60           [🗑️]    │
└─────────────────────────────────────────────┘
```

### Expanded View:
Click on the package to expand and see all fields for:
- Package name, code, description
- All pricing tiers (Adult, Child, Infant, Senior)
- Group size constraints
- Availability dates
- Inclusions/Exclusions

---

## 💡 Examples

### Example 1: Simple Package
```
Package Name: Standard Package
Package Code: STD
Adult Price: $85
Child Price: $60
Min Group: 2
Max Group: 12
```

### Example 2: Multiple Packages
Create 3 packages for the same experience:

**Standard Package:**
- Adult: $85, Child: $60
- Min: 2, Max: 15
- Basic transport, group guide

**Premium Package:**
- Adult: $120, Child: $85
- Min: 2, Max: 10
- Private transport, expert guide, better meals

**Luxury Package:**
- Adult: $200, Child: $140
- Min: 2, Max: 6
- Helicopter access, personal photographer, 5-star service

---

## 🚀 Next Steps (After Creating Experiences)

### 1. Apply Database Migration (First Time Only)

Before you can use the new system, run:

```bash
cd /Users/chooweikian/Desktop/Work/Freelance/TWL/twl-admin
supabase db push
```

This creates all the pricing tables in your database.

### 2. View Your Packages

After creation, you can view/manage packages via:
- Database: Check `experience_packages` and `package_pricing_tiers` tables
- API: `GET /api/admin/packages?experience_id={id}`

### 3. Calculate Prices

Use the pricing calculator API:

```typescript
const response = await fetch('/api/pricing/calculate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    package_id: 'pkg-123',
    travel_date: '2025-07-15',
    adult_count: 2,
    child_count: 1,
  }),
});

const result = await response.json();
console.log('Total:', result.total_price);
```

---

## 🎯 Key Features Available

### ✅ Now Working:
- Multiple package variants per experience
- Age-based pricing (Adult, Child, Infant, Senior)
- Group size constraints per package
- Availability date ranges
- Custom inclusions/exclusions per package
- Package activation/deactivation

### 🔜 Coming Soon (Optional Enhancements):
- Seasonal pricing configuration UI
- Group discount setup UI
- Early bird discount configuration
- Add-ons management
- Promo code management
- Departure scheduling

---

## 📚 Full Documentation

For more details, see:
- **Complete System**: [docs/PRICING_SYSTEM.md](docs/PRICING_SYSTEM.md)
- **Implementation Guide**: [docs/IMPLEMENTATION_GUIDE.md](docs/IMPLEMENTATION_GUIDE.md)
- **Real Examples**: [docs/PRICING_EXAMPLES.md](docs/PRICING_EXAMPLES.md)
- **API Reference**: [FRONTEND_IMPLEMENTATION_COMPLETE.md](FRONTEND_IMPLEMENTATION_COMPLETE.md)

---

## 🐛 Troubleshooting

**Q: I don't see the "Packages & Pricing" section**
**A:** Make sure you're on the latest code. The section appears between "Basic Information" and "Images".

**Q: Can't create experience - packages error**
**A:** Make sure you've run `supabase db push` to create the pricing tables.

**Q: Package fields are empty**
**A:** Click on the package header to expand it and see all the fields.

**Q: Want to add more packages**
**A:** Click the "+ Add Package" button at the top of the Packages & Pricing section.

**Q: How do I delete a package?**
**A:** Click the trash icon (🗑️) on the right side of the package header.

---

## 🎉 You're All Set!

The pricing system is now fully integrated into your experience creation form. Just:
1. Run the database migration (one time)
2. Go to `/admin/experiences/new`
3. Fill in the form including the new Packages & Pricing section
4. Submit!

Your packages will be created automatically with all the pricing configured! 🚀
