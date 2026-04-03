import { publicProcedure } from '../../../create-context';
import { mockArtisans } from '@/mocks/artisans';
import { UserManagement, Client } from '@/types';
import { z } from 'zod';

const mockClients: Client[] = [
  {
    id: 'cli-1',
    name: 'Alexandre Durand',
    email: 'alex.durand@email.com',
    phone: '+33 6 98 76 54 32',
    photo: 'https://i.pravatar.cc/150?img=68',
    type: 'client',
    rating: 4.9,
    reviewCount: 45,
    paymentMethods: [{ id: 'pm-1', type: 'card', last4: '4242', isDefault: true }],
  },
  {
    id: 'cli-2',
    name: 'Sophie Martin',
    email: 'sophie.martin@email.com',
    phone: '+33 6 12 34 56 78',
    photo: 'https://i.pravatar.cc/150?img=45',
    type: 'client',
    rating: 4.8,
    reviewCount: 32,
    paymentMethods: [{ id: 'pm-2', type: 'card', last4: '5555', isDefault: true }],
  },
  {
    id: 'cli-3',
    name: 'Marc Dubois',
    email: 'marc.dubois@email.com',
    phone: '+33 6 87 65 43 21',
    photo: 'https://i.pravatar.cc/150?img=33',
    type: 'client',
    rating: 4.7,
    reviewCount: 28,
    paymentMethods: [{ id: 'pm-3', type: 'card', last4: '6666', isDefault: true }],
  },
];

export const getUsersAdminProcedure = publicProcedure
  .input(
    z.object({
      type: z.enum(['all', 'client', 'artisan']).optional(),
    })
  )
  .query(async ({ input }): Promise<UserManagement> => {
    let users: (Client | typeof mockArtisans[0])[] = [];

    if (!input.type || input.type === 'all') {
      users = [...mockClients, ...mockArtisans];
    } else if (input.type === 'client') {
      users = mockClients;
    } else if (input.type === 'artisan') {
      users = mockArtisans;
    }

    return {
      users,
      totalCount: users.length,
    };
  });
