// Base skeleton components
export {
  BaseSkeleton,
  TextSkeleton,
  ImageSkeleton,
  ButtonSkeleton,
  AvatarSkeleton,
  type BaseSkeletonProps
} from './BaseSkeleton';

// Coach-specific skeletons
export {
  CoachCardSkeleton,
  FeaturedCoachSkeleton,
  CoachListItemSkeleton,
  CoachGridSkeleton,
  type CoachCardSkeletonProps
} from './CoachCardSkeleton';

// Profile skeletons
export {
  ProfileSkeleton,
  CoachProfileSkeleton,
  UserProfileSkeleton,
  MemberCardSkeleton,
  type ProfileSkeletonProps
} from './ProfileSkeleton';

// Community skeletons
export {
  MessageSkeleton,
  DiscussionSkeleton,
  EventSkeleton,
  GroupSkeleton,
  type MessageSkeletonProps,
  type DiscussionSkeletonProps,
  type EventSkeletonProps
} from './CommunitySkeletons';

// Form and navigation skeletons
export {
  FormSkeleton,
  LoginFormSkeleton,
  RegistrationFormSkeleton,
  ContactFormSkeleton,
  ProfileSettingsFormSkeleton,
  NavigationSkeleton,
  type FormSkeletonProps,
  type NavigationSkeletonProps
} from './FormSkeleton';

// Re-export loading types for convenience
export type {
  SkeletonVariant,
  LoadingState,
  LoadingOptions,
  UseLoadingReturn,
  UseSkeletonReturn
} from '../../../types/loading';