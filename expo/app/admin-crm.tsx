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
import { CRMContext, useCRM, CustomerSegment, CustomerProfile } from '@/contexts/CRMContext';
import {
  Search,
  Filter,
  User,
  MapPin,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Star,
  MessageCircle,
  X,
  ArrowLeft,
} from 'lucide-react-native';

function CRMContent() {
  const {
    profiles,
    isLoadingProfiles,
    search,
    setSearch,
    segment,
    setSegment,
    selectedCustomerId,
    selectCustomer,
    customerHistory,
    isLoadingHistory,
    addCustomerNote,
    isAddingNote,
  } = useCRM();

  const [showNoteModal, setShowNoteModal] = useState<boolean>(false);
  const [noteText, setNoteText] = useState<string>('');

  const segmentOptions: { label: string; value: CustomerSegment; color: string }[] = [
    { label: 'All', value: 'all', color: colors.textSecondary },
    { label: 'High Value', value: 'high_value', color: colors.success },
    { label: 'At Risk', value: 'at_risk', color: colors.warning },
    { label: 'New', value: 'new', color: colors.info },
    { label: 'Churned', value: 'churned', color: colors.error },
  ];

  const handleAddNote = async () => {
    if (!noteText.trim() || !selectedCustomerId) {
      Alert.alert('Error', 'Please enter a note');
      return;
    }

    try {
      await addCustomerNote(selectedCustomerId, noteText);
      Alert.alert('Success', 'Note added successfully');
      setShowNoteModal(false);
      setNoteText('');
    } catch (error) {
      Alert.alert('Error', 'Failed to add note');
      console.error(error);
    }
  };

  const selectedProfile = profiles.find((p: CustomerProfile) => p.id === selectedCustomerId);

  if (selectedCustomerId && selectedProfile) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Stack.Screen
          options={{
            title: 'Customer Details',
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => selectCustomer(null)}
                style={styles.backButton}
              >
                <ArrowLeft size={24} color={colors.primary} />
              </TouchableOpacity>
            ),
            headerRight: () => (
              <TouchableOpacity
                onPress={() => setShowNoteModal(true)}
                style={styles.headerButton}
              >
                <MessageCircle size={20} color={colors.primary} />
              </TouchableOpacity>
            ),
          }}
        />

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <User size={40} color={colors.white} />
            </View>
            <Text style={styles.profileName}>{selectedProfile.name}</Text>
            <View style={[
              styles.segmentBadge,
              { backgroundColor: segmentOptions.find(s => s.value === selectedProfile.segment)?.color + '15' }
            ]}>
              <Text style={[
                styles.segmentText,
                { color: segmentOptions.find(s => s.value === selectedProfile.segment)?.color }
              ]}>
                {selectedProfile.segment.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.contactCard}>
            <View style={styles.contactItem}>
              <Mail size={18} color={colors.textSecondary} />
              <Text style={styles.contactText}>{selectedProfile.email}</Text>
            </View>
            <View style={styles.contactItem}>
              <Phone size={18} color={colors.textSecondary} />
              <Text style={styles.contactText}>{selectedProfile.phone}</Text>
            </View>
            <View style={styles.contactItem}>
              <Calendar size={18} color={colors.textSecondary} />
              <Text style={styles.contactText}>
                Member since {new Date(selectedProfile.registeredAt).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.contactItem}>
              <Calendar size={18} color={colors.textSecondary} />
              <Text style={styles.contactText}>
                Last active {new Date(selectedProfile.lastActiveAt).toLocaleDateString()}
              </Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <DollarSign size={24} color={colors.success} />
              <Text style={styles.statValue}>€{selectedProfile.lifetimeValue.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Lifetime Value</Text>
            </View>
            <View style={styles.statBox}>
              <MapPin size={24} color={colors.primary} />
              <Text style={styles.statValue}>{selectedProfile.totalMissions}</Text>
              <Text style={styles.statLabel}>Total Missions</Text>
            </View>
            <View style={styles.statBox}>
              <Star size={24} color={colors.warning} />
              <Text style={styles.statValue}>{selectedProfile.averageRating.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Avg Rating</Text>
            </View>
          </View>

          {isLoadingHistory ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : customerHistory ? (
            <>
              {customerHistory.missions && customerHistory.missions.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Recent Missions</Text>
                  {customerHistory.missions.map((mission) => (
                    <View key={mission.id} style={styles.historyCard}>
                      <View style={styles.historyHeader}>
                        <Text style={styles.historyTitle}>{mission.title}</Text>
                        <Text style={styles.historyAmount}>€{mission.amount}</Text>
                      </View>
                      <View style={styles.historyDetails}>
                        <Text style={styles.historyCategory}>{mission.category}</Text>
                        <Text style={styles.historyDate}>
                          {new Date(mission.date).toLocaleDateString()}
                        </Text>
                      </View>
                      {mission.rating && (
                        <View style={styles.ratingRow}>
                          <Star size={14} color={colors.warning} fill={colors.warning} />
                          <Text style={styles.ratingText}>{mission.rating.toFixed(1)}</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {selectedProfile.notes && selectedProfile.notes.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Notes</Text>
                  {selectedProfile.notes.map((note) => (
                    <View key={note.id} style={styles.noteCard}>
                      <Text style={styles.noteContent}>{note.content}</Text>
                      <View style={styles.noteFooter}>
                        <Text style={styles.noteAuthor}>{note.author}</Text>
                        <Text style={styles.noteDate}>
                          {new Date(note.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </>
          ) : null}
        </ScrollView>

        <Modal
          visible={showNoteModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowNoteModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Note</Text>
                <TouchableOpacity onPress={() => setShowNoteModal(false)}>
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.noteInput}
                value={noteText}
                onChangeText={setNoteText}
                placeholder="Enter your note..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddNote}
                disabled={isAddingNote}
              >
                {isAddingNote ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.addButtonText}>Add Note</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Customer Relationship',
        }}
      />

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search customers..."
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <View style={styles.filterContainer}>
        <Filter size={16} color={colors.textSecondary} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {segmentOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.filterButton,
                segment === option.value && { backgroundColor: option.color + '15', borderColor: option.color },
              ]}
              onPress={() => setSegment(option.value)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  segment === option.value && { color: option.color },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {isLoadingProfiles ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {profiles.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No customers found</Text>
            </View>
          ) : (
            profiles.map((profile) => (
              <TouchableOpacity
                key={profile.id}
                style={styles.customerCard}
                onPress={() => selectCustomer(profile.id)}
              >
                <View style={styles.customerHeader}>
                  <View style={styles.avatarSmall}>
                    <User size={24} color={colors.white} />
                  </View>
                  <View style={styles.customerInfo}>
                    <Text style={styles.customerName}>{profile.name}</Text>
                    <Text style={styles.customerEmail}>{profile.email}</Text>
                  </View>
                  <View style={[
                    styles.segmentBadgeSmall,
                    { backgroundColor: segmentOptions.find(s => s.value === profile.segment)?.color + '15' }
                  ]}>
                    <Text style={[
                      styles.segmentTextSmall,
                      { color: segmentOptions.find(s => s.value === profile.segment)?.color }
                    ]}>
                      {profile.segment.replace('_', ' ')}
                    </Text>
                  </View>
                </View>

                <View style={styles.customerStats}>
                  <View style={styles.customerStat}>
                    <DollarSign size={14} color={colors.success} />
                    <Text style={styles.customerStatText}>
                      €{profile.lifetimeValue.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.customerStat}>
                    <MapPin size={14} color={colors.primary} />
                    <Text style={styles.customerStatText}>
                      {profile.totalMissions} missions
                    </Text>
                  </View>
                  {profile.averageRating > 0 && (
                    <View style={styles.customerStat}>
                      <Star size={14} color={colors.warning} fill={colors.warning} />
                      <Text style={styles.customerStatText}>
                        {profile.averageRating.toFixed(1)}
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={styles.lastActive}>
                  Last active {new Date(profile.lastActiveAt).toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

export default function AdminCRMScreen() {
  return (
    <CRMContext>
      <CRMContent />
    </CRMContext>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backButton: {
    padding: 8,
    marginLeft: 8,
  },
  headerButton: {
    padding: 8,
    marginRight: 8,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  filterScroll: {
    gap: 8,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
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
    fontSize: 16,
    color: colors.textSecondary,
  },
  customerCard: {
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
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarSmall: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 4,
  },
  customerEmail: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  segmentBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  segmentTextSmall: {
    fontSize: 10,
    fontWeight: '600' as const,
    textTransform: 'capitalize',
  },
  customerStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  customerStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  customerStatText: {
    fontSize: 12,
    color: colors.text,
  },
  lastActive: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: colors.white,
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 8,
  },
  segmentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  contactCard: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactText: {
    fontSize: 14,
    color: colors.text,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  historyCard: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  historyTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.success,
  },
  historyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  historyCategory: {
    fontSize: 13,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  historyDate: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.text,
  },
  noteCard: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
  },
  noteContent: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 12,
    lineHeight: 20,
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  noteAuthor: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  noteDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
  },
  noteInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
    height: 120,
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  addButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
