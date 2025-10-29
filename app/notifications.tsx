import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { ArrowLeft, Bell, CheckCheck, CreditCard, AlertCircle } from 'lucide-react-native';
import { Notification } from '@/types';

const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    userId: 'client-1',
    type: 'mission_accepted',
    title: 'Mission acceptée',
    message: 'Jean Dupont a accepté votre demande de plomberie',
    missionId: 'mission-1',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 5),
  },
  {
    id: 'notif-2',
    userId: 'client-1',
    type: 'mission_completed',
    title: 'Mission terminée',
    message: 'Marie Laurent a terminé votre intervention électrique',
    missionId: 'mission-2',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
  {
    id: 'notif-3',
    userId: 'client-1',
    type: 'payment',
    title: 'Paiement confirmé',
    message: 'Votre paiement de 150€ a été traité avec succès',
    missionId: 'mission-2',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
  },
  {
    id: 'notif-4',
    userId: 'client-1',
    type: 'mission_request',
    title: 'Nouvelle demande',
    message: 'Votre demande de service a été envoyée aux artisans disponibles',
    missionId: 'mission-3',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
  },
];

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'mission_request':
      return Bell;
    case 'mission_accepted':
      return CheckCheck;
    case 'mission_completed':
      return CheckCheck;
    case 'payment':
      return CreditCard;
    default:
      return AlertCircle;
  }
};

const getNotificationColor = (type: Notification['type']) => {
  switch (type) {
    case 'mission_request':
      return '#3B82F6';
    case 'mission_accepted':
      return '#10B981';
    case 'mission_completed':
      return '#8B5CF6';
    case 'payment':
      return '#F59E0B';
    default:
      return Colors.textSecondary;
  }
};

const formatTimestamp = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 60) {
    return `Il y a ${minutes} min`;
  } else if (hours < 24) {
    return `Il y a ${hours} h`;
  } else {
    return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
  }
};

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
    if (notification.missionId) {
      router.push(`/mission-details?id=${notification.missionId}` as any);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Notifications',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <ArrowLeft size={24} color={Colors.primary} strokeWidth={2} />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        
        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={handleMarkAllAsRead}
            activeOpacity={0.7}
          >
            <CheckCheck size={16} color={Colors.primary} />
            <Text style={styles.markAllText}>Tout marquer comme lu</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Bell size={64} color={Colors.textSecondary} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>Aucune notification</Text>
            <Text style={styles.emptyText}>
              Vous n&apos;avez pas encore reçu de notifications
            </Text>
          </View>
        ) : (
          notifications.map((notification, index) => {
            const Icon = getNotificationIcon(notification.type);
            const iconColor = getNotificationColor(notification.type);
            
            return (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationCard,
                  !notification.read && styles.unreadCard,
                  index === 0 && styles.firstCard,
                ]}
                activeOpacity={0.7}
                onPress={() => handleNotificationPress(notification)}
              >
                <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
                  <Icon size={22} color={iconColor} strokeWidth={2} />
                </View>
                
                <View style={styles.notificationContent}>
                  <View style={styles.notificationHeader}>
                    <Text style={[styles.notificationTitle, !notification.read && styles.unreadTitle]}>
                      {notification.title}
                    </Text>
                    {!notification.read && <View style={styles.unreadDot} />}
                  </View>
                  
                  <Text style={styles.notificationMessage} numberOfLines={2}>
                    {notification.message}
                  </Text>
                  
                  <Text style={styles.notificationTime}>
                    {formatTimestamp(notification.createdAt)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  unreadBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  unreadText: {
    color: Colors.surface,
    fontSize: 12,
    fontWeight: '700' as const,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  markAllText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  firstCard: {
    marginTop: 4,
  },
  unreadCard: {
    borderColor: Colors.primary + '30',
    backgroundColor: Colors.primary + '05',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  unreadTitle: {
    fontWeight: '700' as const,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  notificationMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 6,
  },
  notificationTime: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
