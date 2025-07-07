import { useAuth } from '@clerk/clerk-expo';
import { apiClient } from '@/apis/apiClient';

export function useApiClient() {
  const { getToken } = useAuth();

  const authenticatedGet = async (endpoint: string) => {
    const token = await getToken();
    return apiClient.get(endpoint, token);
  };

  const authenticatedPost = async (endpoint: string, data?: any) => {
    const token = await getToken();
    return apiClient.post(endpoint, data, token);
  };

  const authenticatedPut = async (endpoint: string, data?: any) => {
    const token = await getToken();
    return apiClient.put(endpoint, data, token);
  };

  const authenticatedDelete = async (endpoint: string) => {
    const token = await getToken();
    return apiClient.delete(endpoint, token);
  };

  return {
    get: authenticatedGet,
    post: authenticatedPost,
    put: authenticatedPut,
    delete: authenticatedDelete,
  };
}
