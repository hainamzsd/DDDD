/**
 * Component Library Index
 * Export all reusable UI components
 */

// Layout Components
export { SafeScreen } from './SafeScreen';

// Button Components
export { Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button';

// Badge Components
export { Badge, CircularBadge } from './Badge';
export type { BadgeProps, CircularBadgeProps, BadgeVariant, BadgeSize } from './Badge';

// Header Components
export { Header, SettingsButton } from './Header';
export type { HeaderProps, SettingsButtonProps } from './Header';

// Input Components
export { Input, PasswordInput } from './Input';
export type { InputProps, PasswordInputProps } from './Input';

// Card Components
export { Card, SurveyCard, SectionHeader, EmptyState } from './Card';
export type {
  CardProps,
  SurveyCardProps,
  SectionHeaderProps,
  EmptyStateProps,
} from './Card';

// Typography Components
export {
  Typography,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Body,
  BodyLarge,
  BodySmall,
  Label,
  Caption,
  CaptionBold,
  // Aliases for convenience
  Heading1 as H1,
  Heading2 as H2,
  Heading3 as H3,
  Heading4 as H4,
} from './Typography';
export type { TypographyProps, TypographyVariant, TypographyColor } from './Typography';
