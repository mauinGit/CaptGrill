import { getUserFromRequest } from '@/lib/auth';
import { apiResponse, apiError } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
  const user = getUserFromRequest(request);
  if (!user) {
    return apiError('Unauthorized', 401);
  }
  return apiResponse({ user });
}
