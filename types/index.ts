export type UserType = 'client' | 'artisan' | 'admin';

export type MissionStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

export type ArtisanCategory = 
  | 'plumber' 
  | 'electrician' 
  | 'carpenter' 
  | 'mason'
  | 'painter' 
  | 'roofer'
  | 'locksmith' 
  | 'hvac'
  | 'glazier'
  | 'cleaner'
  | 'mechanic'
  | 'appliance_repair'
  | 'gardener'
  | 'interior_designer'
  | 'handyman'
  | 'auto_body'
  | 'chimney_sweep'
  | 'framer'
  | 'housekeeper'
  | 'it_tech'
  | 'mover'
  | 'welder'
  | 'pool_tech'
  | 'refrigeration'
  | 'home_automation';

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  photo?: string;
  type: UserType;
  rating?: number;
  reviewCount?: number;
}

export interface Admin extends User {
  type: 'admin';
  role: 'super_admin' | 'moderator';
  permissions: string[];
}

export type SubscriptionTier = 'free' | 'pro' | 'premium';

export interface Subscription {
  id: string;
  artisanId: string;
  tier: SubscriptionTier;
  status: 'active' | 'cancelled' | 'expired';
  startDate: Date;
  endDate?: Date;
  commission: number;
  features: string[];
  monthlyPrice: number;
}

export interface Artisan extends User {
  type: 'artisan';
  category: ArtisanCategory;
  hourlyRate: number;
  travelFee: number;
  interventionRadius: number;
  isAvailable: boolean;
  location?: Location;
  completedMissions: number;
  specialties: string[];
  subscription?: Subscription;
  isSuspended?: boolean;
}

export interface Client extends User {
  type: 'client';
  paymentMethods: PaymentMethod[];
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal';
  last4?: string;
  isDefault: boolean;
}

export interface Mission {
  id: string;
  clientId: string;
  artisanId?: string;
  category: ArtisanCategory;
  title: string;
  description: string;
  photos?: string[];
  location: Location;
  status: MissionStatus;
  estimatedPrice: number;
  finalPrice?: number;
  commission: number;
  createdAt: Date;
  acceptedAt?: Date;
  completedAt?: Date;
  eta?: number;
  artisanLocation?: Location;
}

export interface Review {
  id: string;
  missionId: string;
  fromUserId: string;
  toUserId: string;
  rating: number;
  comment?: string;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'mission_request' | 'mission_accepted' | 'mission_completed' | 'payment';
  title: string;
  message: string;
  missionId?: string;
  read: boolean;
  createdAt: Date;
}

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

export type PaymentProvider = 'stripe' | 'paypal' | 'card';

export interface Transaction {
  id: string;
  missionId: string;
  clientId: string;
  artisanId: string;
  amount: number;
  commission: number;
  commissionAmount: number;
  artisanPayout: number;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  createdAt: Date;
  processedAt?: Date;
  failureReason?: string;
}

export interface PaymentIntent {
  id: string;
  missionId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  clientSecret?: string;
}

export interface ChatMessage {
  id: string;
  missionId: string;
  senderId: string;
  senderName: string;
  senderType: UserType;
  content: string;
  createdAt: Date;
  read: boolean;
}

export interface AdminStats {
  totalUsers: number;
  totalClients: number;
  totalArtisans: number;
  totalMissions: number;
  activeMissions: number;
  completedMissions: number;
  totalRevenue: number;
  totalCommissions: number;
  averageRating: number;
  recentTransactions: Transaction[];
  recentMissions: Mission[];
}

export interface UserManagement {
  users: (Client | Artisan)[];
  totalCount: number;
}

export interface Wallet {
  id: string;
  artisanId: string;
  balance: number;
  pendingBalance: number;
  totalEarnings: number;
  totalWithdrawals: number;
  currency: string;
}

export type WithdrawalStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Withdrawal {
  id: string;
  walletId: string;
  artisanId: string;
  amount: number;
  status: WithdrawalStatus;
  method: 'bank_transfer' | 'paypal';
  createdAt: Date;
  processedAt?: Date;
  failureReason?: string;
}

export interface Invoice {
  id: string;
  missionId: string;
  transactionId: string;
  clientId: string;
  artisanId: string;
  invoiceNumber: string;
  amount: number;
  tax: number;
  totalAmount: number;
  issueDate: Date;
  dueDate: Date;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  pdfUrl?: string;
}
