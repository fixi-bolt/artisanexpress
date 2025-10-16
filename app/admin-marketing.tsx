import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '@/constants/colors';
import { MarketingContext, useMarketing, CampaignStatus } from '@/contexts/MarketingContext';
import {
  Plus,
  Mail,
  Bell,
  MessageSquare,
  Users,
  TrendingUp,
  DollarSign,
  X,
  Send,
} from 'lucide-react-native';

function MarketingContent() {
  const {
    campaigns,
    isLoadingCampaigns,
    campaignStatus,
    setCampaignStatus,
    createCampaign,
    isCreatingCampaign,
    sendPromotionalNotification,
  } = useMarketing();

  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showNotificationModal, setShowNotificationModal] = useState<boolean>(false);
  const [selectedCampaignForNotif, setSelectedCampaignForNotif] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    name: string;
    type: 'email' | 'push' | 'sms' | 'referral';
    targetAudience: string;
    budget: string;
    subject: string;
    body: string;
    cta: string;
  }>({
    name: '',
    type: 'email',
    targetAudience: 'all_users',
    budget: '',
    subject: '',
    body: '',
    cta: '',
  });

  const [notifForm, setNotifForm] = useState<{
    title: string;
    message: string;
  }>({
    title: '',
    message: '',
  });

  const statusOptions: { label: string; value: CampaignStatus }[] = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Scheduled', value: 'scheduled' },
    { label: 'Completed', value: 'completed' },
  ];

  const getCampaignTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return Mail;
      case 'push':
        return Bell;
      case 'sms':
        return MessageSquare;
      case 'referral':
        return Users;
      default:
        return Mail;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return colors.success;
      case 'scheduled':
        return colors.warning;
      case 'completed':
        return colors.textSecondary;
      default:
        return colors.textSecondary;
    }
  };

  const handleCreateCampaign = async () => {
    if (!formData.name || !formData.budget || !formData.body) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      await createCampaign({
        name: formData.name,
        type: formData.type,
        targetAudience: formData.targetAudience,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        budget: parseFloat(formData.budget),
        content: {
          subject: formData.subject || undefined,
          body: formData.body,
          cta: formData.cta || undefined,
        },
      });

      Alert.alert('Success', 'Campaign created successfully');
      setShowCreateModal(false);
      setFormData({
        name: '',
        type: 'email',
        targetAudience: 'all_users',
        budget: '',
        subject: '',
        body: '',
        cta: '',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to create campaign');
      console.error(error);
    }
  };

  const handleSendNotification = async () => {
    if (!notifForm.title || !notifForm.message || !selectedCampaignForNotif) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      const result = await sendPromotionalNotification({
        campaignId: selectedCampaignForNotif,
        targetAudience: 'all_users',
        title: notifForm.title,
        message: notifForm.message,
      });

      Alert.alert(
        'Success',
        `Notification scheduled for ${result.recipients} recipients`
      );
      setShowNotificationModal(false);
      setNotifForm({ title: '', message: '' });
      setSelectedCampaignForNotif(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to send notification');
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Marketing Campaigns',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => setShowCreateModal(true)}
              style={styles.headerButton}
            >
              <Plus size={24} color={colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {statusOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.filterButton,
                campaignStatus === option.value && styles.filterButtonActive,
              ]}
              onPress={() => setCampaignStatus(option.value)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  campaignStatus === option.value && styles.filterButtonTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {isLoadingCampaigns ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {campaigns.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No campaigns found</Text>
              <Text style={styles.emptySubtext}>
                Create your first marketing campaign
              </Text>
            </View>
          ) : (
            campaigns.map((campaign) => {
              const Icon = getCampaignTypeIcon(campaign.type);
              const statusColor = getStatusColor(campaign.status);
              
              return (
                <View key={campaign.id} style={styles.campaignCard}>
                  <View style={styles.campaignHeader}>
                    <View style={styles.campaignTitleRow}>
                      <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
                        <Icon size={20} color={colors.primary} />
                      </View>
                      <View style={styles.campaignTitleContainer}>
                        <Text style={styles.campaignName}>{campaign.name}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
                          <Text style={[styles.statusText, { color: statusColor }]}>
                            {campaign.status}
                          </Text>
                        </View>
                      </View>
                    </View>
                    {campaign.status === 'active' && (
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedCampaignForNotif(campaign.id);
                          setShowNotificationModal(true);
                        }}
                        style={styles.sendButton}
                      >
                        <Send size={18} color={colors.primary} />
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.campaignMetrics}>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricValue}>
                        {campaign.impressions.toLocaleString()}
                      </Text>
                      <Text style={styles.metricLabel}>Impressions</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricValue}>
                        {campaign.clicks.toLocaleString()}
                      </Text>
                      <Text style={styles.metricLabel}>Clicks</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricValue}>
                        {campaign.conversions.toLocaleString()}
                      </Text>
                      <Text style={styles.metricLabel}>Conversions</Text>
                    </View>
                  </View>

                  <View style={styles.campaignFinancials}>
                    <View style={styles.financialItem}>
                      <DollarSign size={16} color={colors.textSecondary} />
                      <Text style={styles.financialLabel}>Budget:</Text>
                      <Text style={styles.financialValue}>€{campaign.budget.toLocaleString()}</Text>
                    </View>
                    <View style={styles.financialItem}>
                      <DollarSign size={16} color={colors.textSecondary} />
                      <Text style={styles.financialLabel}>Spent:</Text>
                      <Text style={styles.financialValue}>€{campaign.spent.toLocaleString()}</Text>
                    </View>
                    <View style={styles.financialItem}>
                      <TrendingUp size={16} color={colors.success} />
                      <Text style={styles.financialLabel}>ROI:</Text>
                      <Text style={[styles.financialValue, { color: colors.success }]}>
                        {campaign.roi}%
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Campaign</Text>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.inputLabel}>Campaign Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Summer Promotion 2025"
            />

            <Text style={styles.inputLabel}>Type</Text>
            <View style={styles.typeSelector}>
              {(['email', 'push', 'sms', 'referral'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    formData.type === type && styles.typeButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, type })}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      formData.type === type && styles.typeButtonTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Budget (€) *</Text>
            <TextInput
              style={styles.input}
              value={formData.budget}
              onChangeText={(text) => setFormData({ ...formData, budget: text })}
              placeholder="5000"
              keyboardType="numeric"
            />

            {formData.type === 'email' && (
              <>
                <Text style={styles.inputLabel}>Subject</Text>
                <TextInput
                  style={styles.input}
                  value={formData.subject}
                  onChangeText={(text) => setFormData({ ...formData, subject: text })}
                  placeholder="Special offer just for you!"
                />
              </>
            )}

            <Text style={styles.inputLabel}>Message *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.body}
              onChangeText={(text) => setFormData({ ...formData, body: text })}
              placeholder="Enter your campaign message..."
              multiline
              numberOfLines={4}
            />

            <Text style={styles.inputLabel}>Call to Action</Text>
            <TextInput
              style={styles.input}
              value={formData.cta}
              onChangeText={(text) => setFormData({ ...formData, cta: text })}
              placeholder="Shop Now"
            />

            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateCampaign}
              disabled={isCreatingCampaign}
            >
              {isCreatingCampaign ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.createButtonText}>Create Campaign</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={showNotificationModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowNotificationModal(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Send Notification</Text>
            <TouchableOpacity onPress={() => setShowNotificationModal(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.inputLabel}>Title *</Text>
            <TextInput
              style={styles.input}
              value={notifForm.title}
              onChangeText={(text) => setNotifForm({ ...notifForm, title: text })}
              placeholder="Special Offer!"
            />

            <Text style={styles.inputLabel}>Message *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notifForm.message}
              onChangeText={(text) => setNotifForm({ ...notifForm, message: text })}
              placeholder="Enter notification message..."
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity
              style={styles.createButton}
              onPress={handleSendNotification}
            >
              <Text style={styles.createButtonText}>Send Notification</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

export default function AdminMarketingScreen() {
  return (
    <MarketingContext>
      <MarketingContent />
    </MarketingContext>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerButton: {
    padding: 8,
    marginRight: 8,
  },
  filterContainer: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  filterButtonTextActive: {
    color: colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  campaignCard: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  campaignHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  campaignTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  campaignTitleContainer: {
    flex: 1,
  },
  campaignName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600' as const,
    textTransform: 'capitalize',
  },
  sendButton: {
    padding: 8,
  },
  campaignMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  campaignFinancials: {
    gap: 8,
  },
  financialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  financialLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  financialValue: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.text,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  typeButtonTextActive: {
    color: colors.white,
  },
  createButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  createButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
