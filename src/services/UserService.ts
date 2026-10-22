import { User, UserCreate, UserUpdate } from '../types';
import { apiGateway } from '../utils/apiGateway';

export const UserService = {
  getUsers: async (): Promise<User[]> => {
    const response = await apiGateway.getUsers();
    return response.data || [];
  },
  getUserById: async (id: string): Promise<User | null> => {
    const response = await apiGateway.getUserById(id);
    return response.data || null;
  },
  createUser: async (userData: UserCreate): Promise<User> => {
    const response = await apiGateway.createUser(userData);
    if (!response.data) throw new Error('User creation failed');
    return response.data;
  },
  updateUser: async (userData: UserUpdate): Promise<User> => {
    const response = await apiGateway.updateUser(userData.id, userData);
    if (!response.data) throw new Error('User update failed');
    return response.data;
  },
  deactivateUser: async (id: string): Promise<User> => {
    const response = await apiGateway.updateUser(id, { id, active: false });
    if (!response.data) throw new Error('User deactivation failed');
    return response.data;
  },
};
