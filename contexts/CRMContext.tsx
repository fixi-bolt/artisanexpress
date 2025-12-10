import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo } from 'react';

export type CustomerSegment = 'all' | 'high_value' | 'at_risk' | 'new' | 'churned';

export interface CustomerNote {
  id: string;
  content: string;
  author: string;
  createdAt: string;
}

export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  segment: CustomerSegment;
  lifetimeValue: number;
  totalMissions: number;
  averageRating: number;
  registeredAt: string;
  lastActiveAt: string;
  notes: CustomerNote[];
}

export interface MissionHistory {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  rating?: number;
}

export interface CustomerHistory {
  missions: MissionHistory[];
}

export const [CRMContext, useCRM] = createContextHook(() => {
  const [search, setSearch] = useState<string>('');
  const [segment, setSegment] = useState<CustomerSegment>('all');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const profilesQuery = useMemo(() => ({ 
    data: { profiles: [] as CustomerProfile[], totalCount: 0 }, 
    isLoading: false, 
    refetch: () => Promise.resolve() 
  }), []);

  const customerHistoryQuery = useMemo(() => ({ 
    data: null as CustomerHistory | null, 
    isLoading: false, 
    refetch: () => Promise.resolve() 
  }), []);

  const addNoteMutation = useMemo(() => ({
    mutateAsync: async () => {
      console.log('[CRM] Mode offline - Note non disponible');
      return Promise.resolve();
    },
    isPending: false,
  }), []);

  const addCustomerNote = useCallback((_userId: string, _content: string) => {
    return addNoteMutation.mutateAsync();
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
