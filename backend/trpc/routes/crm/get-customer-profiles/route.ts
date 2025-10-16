import { z } from "zod";
import { protectedProcedure } from "../../../create-context";

export const getCustomerProfilesProcedure = protectedProcedure
  .input(
    z.object({
      search: z.string().optional(),
      segment: z.enum(['all', 'high_value', 'at_risk', 'new', 'churned']).optional(),
      limit: z.number().optional(),
      offset: z.number().optional(),
    })
  )
  .query(async ({ input }) => {
    console.log('[CRM] Getting customer profiles:', input);

    const mockProfiles = [
      {
        id: 'user_1',
        name: 'Marie Dubois',
        email: 'marie.dubois@example.com',
        phone: '+33 6 12 34 56 78',
        type: 'client' as const,
        registeredAt: new Date('2024-11-15').toISOString(),
        lastActiveAt: new Date('2025-10-14').toISOString(),
        segment: 'high_value',
        lifetimeValue: 4850,
        totalMissions: 12,
        completedMissions: 11,
        averageRating: 4.8,
        preferredCategories: ['plumber', 'electrician'],
        lastMission: {
          id: 'mission_1',
          category: 'plumber',
          date: new Date('2025-10-10').toISOString(),
          amount: 450,
        },
        notes: [
          {
            id: 'note_1',
            content: 'Excellent client, always pays on time',
            createdAt: new Date('2025-09-15').toISOString(),
            author: 'Admin',
          },
        ],
      },
      {
        id: 'user_2',
        name: 'Jean Martin',
        email: 'jean.martin@example.com',
        phone: '+33 6 23 45 67 89',
        type: 'artisan' as const,
        registeredAt: new Date('2024-08-20').toISOString(),
        lastActiveAt: new Date('2025-10-13').toISOString(),
        segment: 'high_value',
        lifetimeValue: 18900,
        totalMissions: 45,
        completedMissions: 43,
        averageRating: 4.9,
        category: 'electrician',
        subscription: 'pro',
        lastMission: {
          id: 'mission_2',
          category: 'electrician',
          date: new Date('2025-10-12').toISOString(),
          amount: 520,
        },
        notes: [
          {
            id: 'note_2',
            content: 'Top performer, excellent ratings from clients',
            createdAt: new Date('2025-08-01').toISOString(),
            author: 'Admin',
          },
        ],
      },
      {
        id: 'user_3',
        name: 'Sophie Bernard',
        email: 'sophie.bernard@example.com',
        phone: '+33 6 34 56 78 90',
        type: 'client' as const,
        registeredAt: new Date('2025-09-01').toISOString(),
        lastActiveAt: new Date('2025-09-15').toISOString(),
        segment: 'at_risk',
        lifetimeValue: 280,
        totalMissions: 2,
        completedMissions: 1,
        averageRating: 4.5,
        preferredCategories: ['carpenter'],
        lastMission: {
          id: 'mission_3',
          category: 'carpenter',
          date: new Date('2025-09-10').toISOString(),
          amount: 280,
        },
        notes: [],
      },
      {
        id: 'user_4',
        name: 'Pierre Lefebvre',
        email: 'pierre.lefebvre@example.com',
        phone: '+33 6 45 67 89 01',
        type: 'client' as const,
        registeredAt: new Date('2025-10-01').toISOString(),
        lastActiveAt: new Date('2025-10-14').toISOString(),
        segment: 'new',
        lifetimeValue: 0,
        totalMissions: 0,
        completedMissions: 0,
        averageRating: 0,
        preferredCategories: [],
        lastMission: null,
        notes: [
          {
            id: 'note_3',
            content: 'New user, signed up from summer campaign',
            createdAt: new Date('2025-10-01').toISOString(),
            author: 'System',
          },
        ],
      },
    ];

    let filtered = mockProfiles;

    if (input.search) {
      const searchLower = input.search.toLowerCase();
      filtered = filtered.filter(
        p => p.name.toLowerCase().includes(searchLower) ||
             p.email.toLowerCase().includes(searchLower) ||
             p.phone.includes(searchLower)
      );
    }

    if (input.segment && input.segment !== 'all') {
      filtered = filtered.filter(p => p.segment === input.segment);
    }

    const limit = input.limit || 20;
    const offset = input.offset || 0;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      profiles: paginated,
      totalCount: filtered.length,
    };
  });
