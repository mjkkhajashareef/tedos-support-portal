import { apiGateway } from '../utils/apiGateway';
import { User } from '../types';

export const userRepository = {
  fetchUsers: async (): Promise<User[]> => {
    const response = await apiGateway.getUsers();
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to fetch users');
  },
};
