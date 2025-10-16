import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo } from 'react';
import { trpc } from '@/lib/trpc';

export type CampaignStatus = 'active' | 'scheduled' | 'completed' | 'all';

export const [MarketingContext, useMarketing] = createContextHook(() => {
  const [campaignStatus, setCampaignStatus] = useState<CampaignStatus>('all');

  const campaignsQuery = trpc.marketing.getCampaigns.useQuery({
    status: campaignStatus,
  });

  const createCampaignMutation = trpc.marketing.createCampaign.useMutation({
    onSuccess: () => {
      console.log('[Marketing] Campaign created successfully');
      campaignsQuery.refetch();
    },
    onError: (error) => {
      console.error('[Marketing] Error creating campaign:', error);
    },
  });

  const sendNotificationMutation = trpc.marketing.sendPromotionalNotification.useMutation({
    onSuccess: (data: { recipients: number }) => {
      console.log('[Marketing] Notification sent to', data.recipients, 'recipients');
    },
    onError: (error) => {
      console.error('[Marketing] Error sending notification:', error);
    },
  });

  const createCampaign = useCallback((campaignData: {
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
    return createCampaignMutation.mutateAsync(campaignData);
  }, [createCampaignMutation]);

  const sendPromotionalNotification = useCallback((data: {
    campaignId: string;
    userIds?: string[];
    targetAudience: string;
    title: string;
    message: string;
    deepLink?: string;
  }) => {
    return sendNotificationMutation.mutateAsync(data);
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
