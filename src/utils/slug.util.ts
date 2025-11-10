import slugify from 'slugify';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUUID(val: string | undefined | null) {
  return !!val && UUID_REGEX.test(String(val));
}

/**
 * Generates a base slug from a string (title/name).
 */
export function generateBaseSlug(input: string): string {
  return slugify(input, {
    replacement: '-',
    remove: undefined,
    lower: true,
    strict: true,
    trim: true,
  });
}

/**
 * Ensures the slug is unique by checking with the provided async exists function.
 * If the base slug exists, appends a numeric suffix (e.g., slug-2, slug-3, ...).
 *
 * @param baseSlug The initial slug to try
 * @param existsFn Async function that returns true if the slug exists
 */
export async function generateUniqueSlug(
  baseSlug: string,
  existsFn: (slug: string) => Promise<boolean>,
): Promise<string> {
  let slug = baseSlug;
  let randomSuffix = generateRandomString(7);
  while (await existsFn(slug)) {
    slug = `${baseSlug}-${randomSuffix}`;
    randomSuffix = generateRandomString(7);
  }
  return slug;
}

function generateRandomString(length: number = 7): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
