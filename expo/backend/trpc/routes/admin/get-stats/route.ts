import { publicProcedure } from '../../../create-context';
import { mockArtisans } from '@/mocks/artisans';
import { mockMissions } from '@/mocks/missions';
import { AdminStats } from '@/types';

export const getStatsAdminProcedure = publicProcedure.query(async (): Promise<AdminStats> => {
  const mockTransactions = [
    {
      id: 'txn-1',
      missionId: 'mis-1',
      clientId: 'cli-1',
      artisanId: 'art-1',
      amount: 150,
      commission: 15,
      commissionAmount: 22.5,
      artisanPayout: 127.5,
      status: 'completed' as const,
      paymentMethod: { id: 'pm-1', type: 'card' as const, last4: '4242', isDefault: true },
      createdAt: new Date('2025-01-10'),
      processedAt: new Date('2025-01-10'),
    },
    {
      id: 'txn-2',
      missionId: 'mis-2',
      clientId: 'cli-2',
      artisanId: 'art-2',
      amount: 200,
      commission: 12,
      commissionAmount: 24,
      artisanPayout: 176,
      status: 'completed' as const,
      paymentMethod: { id: 'pm-2', type: 'card' as const, last4: '5555', isDefault: true },
      createdAt: new Date('2025-01-11'),
      processedAt: new Date('2025-01-11'),
    },
    {
      id: 'txn-3',
      missionId: 'mis-3',
      clientId: 'cli-3',
      artisanId: 'art-3',
      amount: 180,
      commission: 15,
      commissionAmount: 27,
      artisanPayout: 153,
      status: 'completed' as const,
      paymentMethod: { id: 'pm-3', type: 'card' as const, last4: '6666', isDefault: true },
      createdAt: new Date('2025-01-12'),
      processedAt: new Date('2025-01-12'),
    },
  ];

  const completedMissions = mockMissions.filter(m => m.status === 'completed');
  const activeMissions = mockMissions.filter(m => 
    m.status === 'pending' || m.status === 'accepted' || m.status === 'in_progress'
  );

  const totalRevenue = mockTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalCommissions = mockTransactions.reduce((sum, t) => sum + t.commissionAmount, 0);
  
  const totalRatings = mockArtisans.reduce((sum, a) => sum + (a.rating || 0), 0);
  const averageRating = totalRatings / mockArtisans.length;

  return {
    totalUsers: 150,
    totalClients: 100,
    totalArtisans: mockArtisans.length,
    totalMissions: mockMissions.length,
    activeMissions: activeMissions.length,
    completedMissions: completedMissions.length,
    totalRevenue,
    totalCommissions,
    averageRating,
    recentTransactions: mockTransactions,
    recentMissions: mockMissions.slice(0, 5),
  };
});
