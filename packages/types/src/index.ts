// Shared TypeScript interfaces + enums across web, mobile, and api.

export type ID = string;

export const UserRole = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  COACH: "COACH",
  CLIENT: "CLIENT",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const AssignmentStatus = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;
export type AssignmentStatus = (typeof AssignmentStatus)[keyof typeof AssignmentStatus];

export const Difficulty = {
  BEGINNER: "BEGINNER",
  INTERMEDIATE: "INTERMEDIATE",
  ADVANCED: "ADVANCED",
} as const;
export type Difficulty = (typeof Difficulty)[keyof typeof Difficulty];

export const PaymentStatus = {
  PENDING: "PENDING",
  PAID: "PAID",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const PaymentProvider = {
  KHALTI: "KHALTI",
  STRIPE: "STRIPE",
  MANUAL: "MANUAL",
} as const;
export type PaymentProvider = (typeof PaymentProvider)[keyof typeof PaymentProvider];

export interface Organization {
  id: ID;
  name: string;
  slug: string;
  ownerId: ID | null;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: ID;
  clerkId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  organizationId: ID | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CoachProfile {
  id: ID;
  userId: ID;
  bio: string | null;
  specialties: string[];
  yearsOfExperience: number | null;
  hourlyRate: number | null;
  timezone: string | null;
}

export interface ClientProfile {
  id: ID;
  userId: ID;
  dateOfBirth: string | null;
  heightCm: number | null;
  weightKg: number | null;
  goals: string[];
  medicalNotes: string | null;
}

export interface Exercise {
  id: ID;
  name: string;
  primaryMuscle: string;
  secondaryMuscles: string[];
  equipment: string;
  difficulty: Difficulty;
  videoUrl: string | null;
  imageUrl: string | null;
  description: string | null;
  createdById: ID | null;
}

export interface Program {
  id: ID;
  coachId: ID;
  name: string;
  description: string | null;
  durationWeeks: number;
  difficulty: Difficulty;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutSession {
  id: ID;
  programId: ID;
  weekNumber: number;
  dayNumber: number;
  name: string;
  notes: string | null;
  estimatedDurationMin: number | null;
}

export interface NutritionPlan {
  id: ID;
  coachId: ID;
  name: string;
  calorieTarget: number | null;
  proteinTargetG: number | null;
  carbTargetG: number | null;
  fatTargetG: number | null;
  createdAt: string;
}

export interface Payment {
  id: ID;
  clientId: ID;
  coachId: ID | null;
  amountCents: number;
  currency: string;
  status: PaymentStatus;
  provider: PaymentProvider;
  providerRef: string | null;
  createdAt: string;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}