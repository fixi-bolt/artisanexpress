import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo } from 'react';

export type CampaignStatus = 'active' | 'scheduled' | 'completed' | 'all';

export const [MarketingContext, useMarketing] = createContextHook(() => {
  const [campaignStatus, setCampaignStatus] = useState<CampaignStatus>('all');

  const campaignsQuery = useMemo(() => ({ 
    data: { campaigns: [], totalCount: 0 }, 
    isLoading: false, 
    refetch: () => Promise.resolve() 
  }), []);

  const createCampaignMutation = useMemo(() => ({
    mutateAsync: async () => {
      console.log('[Marketing] Mode offline - Campaign creation non disponible');
      return Promise.resolve();
    },
    isPending: false,
  }), []);

  const sendNotificationMutation = useMemo(() => ({
    mutateAsync: async () => {
      console.log('[Marketing] Mode offline - Notification non disponible');
      return Promise.resolve();
    },
    isPending: false,
  }), []);

  const createCampaign = useCallback((_campaignData: {
    name: string;
    type: 'email' | 'push' | 'sms' | 'referral';
    targetAudience: string;
    startDate: string;
    endDate: string | null;
    budget: number;
    content: {
      subject?: string;
      body: string;
      cta?: string;
    };
  }) => {
    return createCampaignMutation.mutateAsync();
  }, [createCampaignMutation]);

  const sendPromotionalNotification = useCallback((_data: {
    campaignId: string;
    userIds?: string[];
    targetAudience: string;
    title: string;
    message: string;
    deepLink?: string;
  }) => {
    return sendNotificationMutation.mutateAsync();
  }, [sendNotificationMutation]);

  return useMemo(() => ({
    campaigns: campaignsQuery.data?.campaigns || [],
    totalCampaigns: campaignsQuery.data?.totalCount || 0,
    isLoadingCampaigns: campaignsQuery.isLoading,
    campaignStatus,
    setCampaignStatus,
    createCampaign,
    isCreatingCampaign: createCampaignMutation.isPending,
    sendPromotionalNotification,
    isSendingNotification: sendNotificationMutation.isPending,
    refreshCampaigns: campaignsQuery.refetch,
  }), [
    campaignsQuery.data?.campaigns,
    campaignsQuery.data?.totalCount,
    campaignsQuery.isLoading,
    campaignStatus,
    setCampaignStatus,
    createCampaign,
    createCampaignMutation.isPending,
    sendPromotionalNotification,
    sendNotificationMutation.isPending,
    campaignsQuery.refetch,
  ]);
});
