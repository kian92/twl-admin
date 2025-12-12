import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';

export default getRequestConfig(async () => {
  // Try to get locale from cookie first
  const cookieStore = await cookies();
  let locale = cookieStore.get('NEXT_LOCALE')?.value;

  // If no cookie, check headers
  if (!locale) {
    const headersList = await headers();
    locale = headersList.get('x-next-intl-locale') || undefined;
  }

  // Fallback to 'en' if locale is still undefined
  if (!locale || !['en', 'zh'].includes(locale)) {
    locale = 'en';
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
