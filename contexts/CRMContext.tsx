import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo } from 'react';
import { trpc } from '@/lib/trpc';

export type CustomerSegment = 'all' | 'high_value' | 'at_risk' | 'new' | 'churned';

export const [CRMContext, useCRM] = createContextHook(() => {
  const [search, setSearch] = useState<string>('');
  const [segment, setSegment] = useState<CustomerSegment>('all');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const profilesQuery = trpc.crm.getCustomerProfiles.useQuery({
    search: search || undefined,
    segment,
    limit: 50,
    offset: 0,
  }, { enabled: false });

  const customerHistoryQuery = trpc.crm.getCustomerHistory.useQuery(
    { userId: selectedCustomerId! },
    { enabled: !!selectedCustomerId }
  );

  const addNoteMutation = trpc.crm.addCustomerNote.useMutation({
    onSuccess: () => {
      console.log('[CRM] Note added successfully');
      if (selectedCustomerId) {
        customerHistoryQuery.refetch();
        profilesQuery.refetch();
      }
    },
    onError: (error) => {
      console.error('[CRM] Error adding note:', error);
    },
  });

  const addCustomerNote = useCallback((userId: string, content: string) => {
    return addNoteMutation.mutateAsync({ userId, content });
  }, [addNoteMutation]);

  const selectCustomer = useCallback((customerId: string | null) => {
    console.log('[CRM] Selecting customer:', customerId);
    setSelectedCustomerId(customerId);
  }, []);

  return useMemo(() => ({
    profiles: profilesQuery.data?.profiles || [],
    totalProfiles: profilesQuery.data?.totalCount || 0,
    isLoadingProfiles: profilesQuery.isLoading,
    search,
    setSearch,
    segment,
    setSegment,
    selectedCustomerId,
    selectCustomer,
    customerHistory: customerHistoryQuery.data,
    isLoadingHistory: customerHistoryQuery.isLoading,
    addCustomerNote,
    isAddingNote: addNoteMutation.isPending,
    refreshProfiles: profilesQuery.refetch,
    refreshHistory: customerHistoryQuery.refetch,
  }), [
    profilesQuery.data?.profiles,
    profilesQuery.data?.totalCount,
    profilesQuery.isLoading,
    search,
    setSearch,
    segment,
    setSegment,
    selectedCustomerId,
    selectCustomer,
    customerHistoryQuery.data,
    customerHistoryQuery.isLoading,
    addCustomerNote,
    addNoteMutation.isPending,
    profilesQuery.refetch,
    customerHistoryQuery.refetch,
  ]);
});
