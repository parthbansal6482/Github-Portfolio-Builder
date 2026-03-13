// Revalidation helper — calls the frontend's /api/revalidate webhook
// Used after publish/unpublish to bust the ISR cache

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET || '';

interface RevalidateResult {
  success: boolean;
  error?: string;
}

export async function revalidatePath(path: string): Promise<RevalidateResult> {
  const url = `${FRONTEND_URL}/api/revalidate`;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-revalidate-secret': REVALIDATE_SECRET,
        },
        body: JSON.stringify({ path }),
      });

      if (response.ok) {
        return { success: true };
      }

      const errorText = await response.text();
      console.warn(
        `Revalidation attempt ${attempt + 1} failed: ${response.status} — ${errorText}`
      );
    } catch (error) {
      console.warn(
        `Revalidation attempt ${attempt + 1} error:`,
        error instanceof Error ? error.message : error
      );
    }

    // Wait 1 second before retry
    if (attempt === 0) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  // Both attempts failed — log warning but don't throw (Rule 6)
  console.warn(`Revalidation failed for path: ${path} after 2 attempts`);
  return { success: false, error: 'Revalidation failed after 2 attempts' };
}
