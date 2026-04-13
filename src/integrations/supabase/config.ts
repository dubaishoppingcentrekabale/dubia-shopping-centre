const getRequiredEnv = (value: string | undefined, key: string) => {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    throw new Error(`Missing ${key}. Add it to your .env file before starting the app.`);
  }

  return trimmedValue;
};

export const SUPABASE_URL = getRequiredEnv(import.meta.env.VITE_SUPABASE_URL, "VITE_SUPABASE_URL");
export const SUPABASE_PUBLISHABLE_KEY = getRequiredEnv(
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  "VITE_SUPABASE_PUBLISHABLE_KEY",
);
