export type UserRole = "ATTENDEE" | "ORGANIZER" | "GATE_STAFF" | "ADMIN" | "SUPER_ADMIN";
export type LoyaltyTier = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND";
export type EventStatus = "DRAFT" | "PUBLISHED" | "PRESALE" | "SOLD_OUT" | "ONGOING" | "POSTPONED" | "CANCELLED" | "PAST";
export type EventCategory = "CLUB_NIGHT" | "FESTIVAL" | "CONCERT" | "COMEDY" | "SPORTS" | "CORPORATE" | "PRIVATE" | "POP_UP" | "BOAT_PARTY" | "ROOFTOP";
export type TierType = "GA" | "VIP" | "VVIP" | "EARLY_BIRD" | "GROUP" | "TABLE" | "BACKSTAGE" | "PRESS" | "COMP" | "WAITLIST";
export type OrderStatus = "PENDING" | "AWAITING_PAYMENT" | "PAID" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED" | "EXPIRED" | "CANCELLED";
export type ScanResult = "APPROVED" | "DENIED_DUPLICATE" | "DENIED_USED" | "DENIED_CANCELLED" | "DENIED_WRONG_EVENT" | "DENIED_REENTRY_NOT_ALLOWED" | "DENIED_EXPIRED" | "DENIED_BLACKLISTED" | "OVERRIDE_APPROVED";
export type GateAction = "ENTRY" | "EXIT" | "RE_ENTRY";

export interface User {
  id: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  role: UserRole;
  isVerified: boolean;
  isActive: boolean;
  loyaltyTier: LoyaltyTier;
  loyaltyPoints: number;
  createdAt: string;
}

export interface TicketTier {
  id: string;
  eventId: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  totalQuantity: number;
  soldCount: number;
  maxPerOrder: number;
  saleStartsAt?: string;
  saleEndsAt?: string;
  tierType: TierType;
  perks: string[];
  color?: string;
  isTransferable: boolean;
  allowReEntry: boolean;
  presaleCode?: string;
  isActive: boolean;
}

export interface Event {
  id: string;
  organizerId: string;
  venueId?: string;
  title: string;
  description: string;
  coverImageUrl?: string;
  promoVideoUrl?: string;
  category: EventCategory;
  genreTags: string[];
  status: EventStatus;
  startDateTime: string;
  endDateTime: string;
  doorsOpenAt?: string;
  timezone: string;
  ageRestriction?: number;
  dressCode?: string;
  maxCapacity: number;
  isPrivate: boolean;
  isOnline: boolean;
  isRecurring: boolean;
  refundPolicy?: string;
  createdAt: string;
  ticketTiers?: TicketTier[];
  organizer?: User;
  totalRevenue?: number;
  ticketsSold?: number;
}

export interface GateScan {
  id: string;
  ticketId: string;
  eventId: string;
  gateId: string;
  gateName: string;
  scannedById: string;
  action: GateAction;
  result: ScanResult;
  denyReason?: string;
  entryNumber: number;
  scannedAt: string;
  user?: {
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  ticketTier?: {
    name: string;
    tierType: TierType;
  };
}

export interface GateDashboard {
  eventId: string;
  eventTitle: string;
  maxCapacity: number;
  currentInside: number;
  totalScans: number;
  totalApproved: number;
  totalDenied: number;
  gates: GateStats[];
  recentScans: GateScan[];
}

export interface GateStats {
  gateId: string;
  gateName: string;
  scannedCount: number;
  approvedCount: number;
  deniedCount: number;
}

export interface DashboardStats {
  totalUsers: number;
  totalEvents: number;
  totalRevenue: number;
  activeEvents: number;
  userGrowth: number;
  revenueGrowth: number;
  salesData: SalesDataPoint[];
  categoryBreakdown: CategoryBreakdown[];
  recentEvents: Event[];
}

export interface SalesDataPoint {
  date: string;
  sales: number;
  revenue: number;
}

export interface CategoryBreakdown {
  category: string;
  count: number;
  value: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}
