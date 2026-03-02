import { getUserFromRequest } from '@/lib/auth';
import { apiResponse, apiError } from '@/lib/utils';

export async function GET(request) {
  const user = getUserFromRequest(request);
  if (!user) {
    return apiError('Unauthorized', 401);
  }
  return apiResponse({ user });
}
