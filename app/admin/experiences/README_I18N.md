# How to Use Translations in Your Components

## For Client Components

```typescript
"use client"

import { useTranslations } from 'next-intl';

export default function ExperiencesPage() {
  const t = useTranslations('experiences');

  return (
    <div>
      <h1>{t('title')}</h1>
      <button>{t('addNew')}</button>
      <p>{t('showing', { filtered: 10, total: 100 })}</p>
    </div>
  );
}
```

## For Server Components

```typescript
import { useTranslations } from 'next-intl';

export default async function ExperiencesPage() {
  const t = await useTranslations('experiences');

  return (
    <div>
      <h1>{t('title')}</h1>
    </div>
  );
}
```

## Translation Keys Reference

All translation keys are defined in:
- `messages/en.json` - English translations
- `messages/zh.json` - Simplified Chinese translations

### Example Usage:

```typescript
// Simple translation
t('common.save') // Returns: "Save" (en) or "保存" (zh)

// With parameters
t('experiences.showing', { filtered: 5, total: 20 })
// Returns: "Showing 5 of 20 experiences" (en) or "显示 5 / 20 个体验" (zh)

// Form fields
t('experiences.form.title') // Returns: "Experience Title" (en) or "体验标题" (zh)
```

## Adding New Translations

1. Add the key to both `messages/en.json` and `messages/zh.json`
2. Use consistent key naming: `section.subsection.key`
3. For parameters, use `{param}` in the translation string

Example:
```json
{
  "experiences": {
    "deleteConfirm": "Delete \"{title}\"? This action cannot be undone."
  }
}
```

Usage:
```typescript
t('experiences.deleteConfirm', { title: 'My Experience' })
```
