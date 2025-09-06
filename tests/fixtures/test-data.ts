/**
 * Test Data Fixtures for iPEC Coach Connect
 * 
 * Comprehensive test data factory providing realistic, consistent data for:
 * - User profiles (clients, coaches, admins)
 * - Coach specializations and certifications
 * - Session types and booking data
 * - Community content (discussions, groups, events)
 * - Learning resources and courses
 * - Payment and subscription data
 * 
 * This factory ensures test data isolation and provides helper functions
 * for generating realistic test scenarios across all user flows.
 */

import { faker } from '@faker-js/faker';

// Seed faker for consistent test data
faker.seed(12345);

export interface TestUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone?: string;
  profileImage?: string;
  timezone: string;
  role: 'client' | 'coach' | 'admin';
  createdAt: string;
  preferences?: ClientPreferences;
  coachData?: CoachData;
}

export interface ClientPreferences {
  coachingType: string[];
  priceRange: {
    min: number;
    max: number;
  };
  location: {
    type: 'remote' | 'in-person' | 'hybrid';
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  goals: string[];
}

export interface CoachData {
  bio: string;
  specialties: string[];
  certifications: {
    type: string;
    level: 'Associate' | 'Professional' | 'Master';
    issueDate: string;
    verificationId: string;
  }[];
  pricing: {
    hourlyRate: number;
    packageRates?: {
      sessions: number;
      price: number;
    }[];
  };
  availability: {
    timezone: string;
    schedule: {
      day: string;
      slots: string[];
    }[];
  };
  location: {
    type: 'remote' | 'in-person' | 'hybrid';
    address?: {
      street: string;
      city: string;
      state: string;
      country: string;
      coordinates: {
        latitude: number;
        longitude: number;
      };
    };
  };
  rating: number;
  reviewCount: number;
  experienceYears: number;
  languages: string[];
  isActive: boolean;
}

export interface TestSession {
  id: string;
  clientId: string;
  coachId: string;
  type: 'discovery' | 'coaching' | 'group' | 'workshop';
  title: string;
  description: string;
  scheduledAt: string;
  duration: number; // minutes
  price: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  meetingLink?: string;
  notes?: string;
}

export interface TestCommunityContent {
  discussions: TestDiscussion[];
  groups: TestGroup[];
  events: TestEvent[];
}

export interface TestDiscussion {
  id: string;
  title: string;
  content: string;
  authorId: string;
  categoryId: string;
  tags: string[];
  createdAt: string;
  replies: TestReply[];
  upvotes: number;
  views: number;
}

export interface TestReply {
  id: string;
  content: string;
  authorId: string;
  createdAt: string;
  upvotes: number;
}

export interface TestGroup {
  id: string;
  name: string;
  description: string;
  category: string;
  memberCount: number;
  isPrivate: boolean;
  adminId: string;
  createdAt: string;
}

export interface TestEvent {
  id: string;
  title: string;
  description: string;
  organizerId: string;
  scheduledAt: string;
  duration: number;
  maxAttendees?: number;
  currentAttendees: number;
  isVirtual: boolean;
  location?: string;
  price?: number;
}

/**
 * Coaching specializations commonly available in iPEC
 */
export const COACHING_SPECIALTIES = [
  'Life Coaching',
  'Career Coaching',
  'Executive Coaching',
  'Relationship Coaching',
  'Health & Wellness Coaching',
  'Stress Management',
  'Goal Achievement',
  'Personal Development',
  'Leadership Development',
  'Work-Life Balance',
  'Communication Skills',
  'Confidence Building',
  'Time Management',
  'Mindfulness & Meditation',
  'Spiritual Coaching',
] as const;

/**
 * Common coaching goals for clients
 */
export const CLIENT_GOALS = [
  'Improve work-life balance',
  'Build confidence',
  'Career advancement',
  'Stress management',
  'Better relationships',
  'Health and wellness',
  'Time management',
  'Goal achievement',
  'Leadership skills',
  'Communication improvement',
  'Personal growth',
  'Mindfulness practice',
  'Financial wellness',
  'Life transitions',
  'Productivity enhancement',
] as const;

/**
 * Session types available for booking
 */
export const SESSION_TYPES = [
  { 
    type: 'discovery', 
    name: 'Discovery Session', 
    duration: 30, 
    description: 'Initial consultation to understand goals and fit' 
  },
  { 
    type: 'coaching', 
    name: 'Individual Coaching', 
    duration: 60, 
    description: 'One-on-one coaching session' 
  },
  { 
    type: 'group', 
    name: 'Group Coaching', 
    duration: 90, 
    description: 'Small group coaching session' 
  },
  { 
    type: 'workshop', 
    name: 'Workshop', 
    duration: 120, 
    description: 'Interactive workshop on specific topics' 
  },
] as const;

/**
 * Generate a realistic test user
 */
export function createTestUser(overrides: Partial<TestUser> = {}): TestUser {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const role = overrides.role || 'client';
  
  const baseUser: TestUser = {
    id: faker.string.uuid(),
    email: faker.internet.email({ firstName, lastName }).toLowerCase(),
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    phone: faker.phone.number(),
    profileImage: faker.image.avatar(),
    timezone: faker.location.timeZone(),
    role,
    createdAt: faker.date.past({ years: 2 }).toISOString(),
    ...overrides,
  };

  // Add role-specific data
  if (role === 'client') {
    baseUser.preferences = createClientPreferences();
  } else if (role === 'coach') {
    baseUser.coachData = createCoachData();
  }

  return baseUser;
}

/**
 * Generate client preferences
 */
export function createClientPreferences(): ClientPreferences {
  return {
    coachingType: faker.helpers.arrayElements(COACHING_SPECIALTIES, { min: 1, max: 3 }),
    priceRange: {
      min: faker.number.int({ min: 50, max: 100 }),
      max: faker.number.int({ min: 150, max: 300 }),
    },
    location: {
      type: faker.helpers.arrayElement(['remote', 'in-person', 'hybrid']),
      coordinates: {
        latitude: faker.location.latitude(),
        longitude: faker.location.longitude(),
      },
    },
    goals: faker.helpers.arrayElements(CLIENT_GOALS, { min: 2, max: 4 }),
  };
}

/**
 * Generate coach data
 */
export function createCoachData(): CoachData {
  const hourlyRate = faker.number.int({ min: 75, max: 250 });
  
  return {
    bio: faker.lorem.paragraphs(2),
    specialties: faker.helpers.arrayElements(COACHING_SPECIALTIES, { min: 2, max: 4 }),
    certifications: [
      {
        type: 'iPEC Core Energy Coaching',
        level: faker.helpers.arrayElement(['Associate', 'Professional', 'Master']),
        issueDate: faker.date.past({ years: 5 }).toISOString().split('T')[0],
        verificationId: `IPEC-${faker.string.alphanumeric(8).toUpperCase()}`,
      },
    ],
    pricing: {
      hourlyRate,
      packageRates: [
        { sessions: 3, price: hourlyRate * 3 * 0.9 },
        { sessions: 6, price: hourlyRate * 6 * 0.85 },
        { sessions: 12, price: hourlyRate * 12 * 0.8 },
      ],
    },
    availability: {
      timezone: faker.location.timeZone(),
      schedule: [
        { day: 'Monday', slots: ['09:00', '10:00', '14:00', '15:00'] },
        { day: 'Tuesday', slots: ['09:00', '10:00', '11:00', '14:00'] },
        { day: 'Wednesday', slots: ['10:00', '14:00', '15:00', '16:00'] },
        { day: 'Thursday', slots: ['09:00', '10:00', '14:00', '15:00'] },
        { day: 'Friday', slots: ['09:00', '10:00', '11:00'] },
      ],
    },
    location: {
      type: faker.helpers.arrayElement(['remote', 'in-person', 'hybrid']),
      address: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        country: 'United States',
        coordinates: {
          latitude: faker.location.latitude(),
          longitude: faker.location.longitude(),
        },
      },
    },
    rating: faker.number.float({ min: 4.0, max: 5.0, fractionDigits: 1 }),
    reviewCount: faker.number.int({ min: 5, max: 150 }),
    experienceYears: faker.number.int({ min: 1, max: 15 }),
    languages: faker.helpers.arrayElements(['English', 'Spanish', 'French', 'German'], { min: 1, max: 2 }),
    isActive: true,
  };
}

/**
 * Generate a test session
 */
export function createTestSession(clientId: string, coachId: string, overrides: Partial<TestSession> = {}): TestSession {
  const sessionType = faker.helpers.arrayElement(SESSION_TYPES);
  const scheduledAt = faker.date.future({ days: 30 });
  
  return {
    id: faker.string.uuid(),
    clientId,
    coachId,
    type: sessionType.type,
    title: sessionType.name,
    description: sessionType.description,
    scheduledAt: scheduledAt.toISOString(),
    duration: sessionType.duration,
    price: faker.number.int({ min: 75, max: 200 }),
    status: 'scheduled',
    meetingLink: `https://meet.ipeccoach.com/${faker.string.alphanumeric(10)}`,
    ...overrides,
  };
}

/**
 * Generate community content
 */
export function createCommunityContent(): TestCommunityContent {
  return {
    discussions: Array.from({ length: 10 }, () => createTestDiscussion()),
    groups: Array.from({ length: 5 }, () => createTestGroup()),
    events: Array.from({ length: 8 }, () => createTestEvent()),
  };
}

/**
 * Generate a test discussion
 */
export function createTestDiscussion(): TestDiscussion {
  return {
    id: faker.string.uuid(),
    title: faker.lorem.sentence({ min: 4, max: 8 }),
    content: faker.lorem.paragraphs(2),
    authorId: faker.string.uuid(),
    categoryId: faker.string.uuid(),
    tags: faker.helpers.arrayElements(['coaching', 'wellness', 'career', 'relationships', 'goals'], { min: 1, max: 3 }),
    createdAt: faker.date.past({ days: 90 }).toISOString(),
    replies: Array.from({ length: faker.number.int({ min: 0, max: 8 }) }, () => createTestReply()),
    upvotes: faker.number.int({ min: 0, max: 25 }),
    views: faker.number.int({ min: 10, max: 200 }),
  };
}

/**
 * Generate a test reply
 */
export function createTestReply(): TestReply {
  return {
    id: faker.string.uuid(),
    content: faker.lorem.paragraph(),
    authorId: faker.string.uuid(),
    createdAt: faker.date.past({ days: 30 }).toISOString(),
    upvotes: faker.number.int({ min: 0, max: 10 }),
  };
}

/**
 * Generate a test group
 */
export function createTestGroup(): TestGroup {
  return {
    id: faker.string.uuid(),
    name: `${faker.company.name()  } Coaching Circle`,
    description: faker.lorem.paragraph(),
    category: faker.helpers.arrayElement(['Career', 'Wellness', 'Relationships', 'Personal Growth', 'Leadership']),
    memberCount: faker.number.int({ min: 5, max: 50 }),
    isPrivate: faker.datatype.boolean(),
    adminId: faker.string.uuid(),
    createdAt: faker.date.past({ days: 180 }).toISOString(),
  };
}

/**
 * Generate a test event
 */
export function createTestEvent(): TestEvent {
  const scheduledAt = faker.date.future({ days: 60 });
  const maxAttendees = faker.number.int({ min: 10, max: 100 });
  
  return {
    id: faker.string.uuid(),
    title: faker.lorem.sentence({ min: 3, max: 6 }),
    description: faker.lorem.paragraphs(2),
    organizerId: faker.string.uuid(),
    scheduledAt: scheduledAt.toISOString(),
    duration: faker.helpers.arrayElement([60, 90, 120, 180]),
    maxAttendees,
    currentAttendees: faker.number.int({ min: 0, max: maxAttendees }),
    isVirtual: faker.datatype.boolean(),
    location: faker.datatype.boolean() ? faker.location.city() : undefined,
    price: faker.datatype.boolean() ? faker.number.int({ min: 25, max: 150 }) : undefined,
  };
}

/**
 * Create a set of test users for comprehensive testing
 */
export function createTestUserSet() {
  return {
    client: createTestUser({ role: 'client' }),
    coach: createTestUser({ role: 'coach' }),
    admin: createTestUser({ role: 'admin' }),
    additionalClients: Array.from({ length: 3 }, () => createTestUser({ role: 'client' })),
    additionalCoaches: Array.from({ length: 5 }, () => createTestUser({ role: 'coach' })),
  };
}

/**
 * Create realistic payment test data
 */
export function createPaymentTestData() {
  return {
    validCard: {
      number: '4242424242424242', // Stripe test card
      expiry: '12/25',
      cvc: '123',
      zip: '12345',
    },
    declinedCard: {
      number: '4000000000000002', // Stripe test declined card
      expiry: '12/25',
      cvc: '123',
      zip: '12345',
    },
    insufficientFundsCard: {
      number: '4000000000009995', // Stripe insufficient funds card
      expiry: '12/25',
      cvc: '123',
      zip: '12345',
    },
  };
}

/**
 * Export commonly used test data collections
 */
export const testData = {
  users: createTestUserSet(),
  community: createCommunityContent(),
  payment: createPaymentTestData(),
  specialties: COACHING_SPECIALTIES,
  goals: CLIENT_GOALS,
  sessionTypes: SESSION_TYPES,
};