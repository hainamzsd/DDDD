# LocationID Tracker - UI Component Library

This component library is extracted from the LocationID Tracker design export and provides reusable, typed React Native components following the official design system.

## Table of Contents

- [Theme System](#theme-system)
- [Components](#components)
  - [Button](#button)
  - [Badge](#badge)
  - [Header](#header)
  - [Input](#input)
  - [Card](#card)
  - [Typography](#typography)

---

## Theme System

The theme system includes:
- **Colors**: Complete color palette with semantic meanings
- **Typography**: Font sizes, weights, and text styles
- **Spacing**: Consistent spacing and border radius values
- **Shadows**: Platform-specific shadow presets

### Usage

```typescript
import { theme, colors, spacing, textStyles } from '../theme';

// Use in StyleSheet
const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary[600],
    padding: spacing.lg,
    borderRadius: theme.borderRadius.xl,
  },
});
```

---

## Components

### Button

Primary action buttons with multiple variants and sizes.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| onPress | () => void | required | Button press handler |
| children | React.ReactNode | required | Button content (usually text) |
| variant | 'primary' \| 'secondary' \| 'outline' \| 'ghost' | 'primary' | Button style variant |
| size | 'small' \| 'medium' \| 'large' | 'medium' | Button size |
| disabled | boolean | false | Disable button interaction |
| loading | boolean | false | Show loading indicator |
| icon | React.ReactNode | - | Icon element |
| iconPosition | 'left' \| 'right' | 'left' | Icon position |
| fullWidth | boolean | false | Make button full width |

#### Examples

```typescript
import { Button } from '../components';
import { Feather } from '@expo/vector-icons';

// Primary button
<Button onPress={() => console.log('pressed')}>
  Start New Survey
</Button>

// Button with icon
<Button
  variant="primary"
  icon={<Feather name="plus-circle" size={20} color="white" />}
  onPress={handleStart}
>
  Start New Survey
</Button>

// Secondary button
<Button variant="secondary" size="large" onPress={handleSubmit}>
  Submit Survey
</Button>

// Outline button
<Button variant="outline" onPress={handleCancel}>
  Cancel
</Button>

// Loading state
<Button loading={true} disabled={true}>
  Processing...
</Button>

// Full width button
<Button fullWidth onPress={handleLogin}>
  Đăng Nhập
</Button>
```

---

### Badge

Display status, counts, or categories.

#### Badge Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| children | React.ReactNode | required | Badge content |
| variant | 'primary' \| 'secondary' \| 'accent' \| 'success' \| 'warning' \| 'error' | 'primary' | Badge color variant |
| size | 'small' \| 'medium' \| 'large' | 'medium' | Badge size |
| icon | React.ReactNode | - | Optional icon |

#### CircularBadge Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| children | React.ReactNode | required | Badge content (usually icon) |
| size | number | 48 | Badge diameter |
| backgroundColor | string | white | Background color |
| iconColor | string | - | Icon color |

#### Examples

```typescript
import { Badge, CircularBadge } from '../components';
import { Feather } from '@expo/vector-icons';

// Simple badge
<Badge variant="accent">3</Badge>

// Badge with icon
<Badge
  variant="warning"
  icon={<Feather name="wifi-off" size={12} color="#78350f" />}
>
  3
</Badge>

// Circular badge (for shield icon)
<CircularBadge size={48}>
  <Feather name="shield" size={32} color="#dc2626" />
</CircularBadge>

// Large circular badge
<CircularBadge size={96}>
  <Feather name="shield" size={56} color="#dc2626" />
</CircularBadge>
```

---

### Header

App header with badge, title, and action button.

#### Header Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| title | string | required | Main title text |
| subtitle | string | - | Subtitle/greeting text |
| badgeIcon | React.ReactNode | - | Icon for badge |
| rightAction | React.ReactNode | - | Right side action (usually settings button) |

#### Examples

```typescript
import { Header, SettingsButton } from '../components';
import { Feather } from '@expo/vector-icons';

// Full header with all props
<Header
  title="Officer J. Martinez"
  subtitle="Xin chào,"
  badgeIcon={<Feather name="shield" size={32} color="#dc2626" />}
  rightAction={
    <SettingsButton
      onPress={() => navigation.navigate('Settings')}
      icon={<Feather name="settings" size={20} color="white" />}
    />
  }
/>

// Simple header
<Header title="Survey Details" />
```

---

### Input

Form inputs with labels, icons, and error states.

#### Input Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | string | - | Input label |
| error | string | - | Error message |
| leftIcon | React.ReactNode | - | Left side icon |
| rightIcon | React.ReactNode | - | Right side icon |
| ...TextInputProps | - | - | All React Native TextInput props |

#### PasswordInput Props

Same as Input, but automatically handles password visibility toggle.

#### Examples

```typescript
import { Input, PasswordInput } from '../components';
import { Feather } from '@expo/vector-icons';

// Text input with icon
<Input
  label="Mã Cán Bộ"
  placeholder="Nhập mã cán bộ"
  leftIcon={<Feather name="user" size={20} color="#15803d" />}
  value={officerId}
  onChangeText={setOfficerId}
/>

// Input with error
<Input
  label="Email"
  placeholder="your@email.com"
  error="Email không hợp lệ"
  value={email}
  onChangeText={setEmail}
/>

// Password input with toggle
<PasswordInput
  label="Mật Khẩu"
  placeholder="Nhập mật khẩu"
  leftIcon={<Feather name="lock" size={20} color="#15803d" />}
  visibilityIcon={<Feather name="eye" size={20} color="#15803d" />}
  visibilityOffIcon={<Feather name="eye-off" size={20} color="#15803d" />}
  value={password}
  onChangeText={setPassword}
/>
```

---

### Card

Container components for content grouping.

#### Card Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| children | React.ReactNode | required | Card content |
| onPress | () => void | - | Make card pressable |
| elevated | boolean | true | Apply shadow elevation |

#### SurveyCard Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| surveyId | string | required | Survey ID/number |
| date | string | required | Survey date/time |
| icon | React.ReactNode | - | Left side icon |
| onPress | () => void | - | Press handler |

#### SectionHeader Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| title | string | required | Section title |
| badge | React.ReactNode | - | Optional badge |

#### EmptyState Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| message | string | required | Empty state message |
| icon | React.ReactNode | - | Optional icon |

#### Examples

```typescript
import { Card, SurveyCard, SectionHeader, EmptyState, Badge } from '../components';
import { Feather } from '@expo/vector-icons';

// Basic card
<Card>
  <Text>Card content here</Text>
</Card>

// Pressable card
<Card onPress={() => navigation.navigate('Details')}>
  <Text>Tap to see details</Text>
</Card>

// Survey card
<SurveyCard
  surveyId="Survey #2024-0847"
  date="Today, 10:32 AM"
  icon={<Feather name="map-pin" size={20} color="#15803d" />}
  onPress={() => handleSurveyPress('2024-0847')}
/>

// Section with header and list
<View>
  <SectionHeader
    title="Unsynced Surveys"
    badge={
      <Badge
        variant="warning"
        icon={<Feather name="wifi-off" size={12} color="#78350f" />}
      >
        3
      </Badge>
    }
  />
  <SurveyCard surveyId="Survey #2024-0847" date="Today, 10:32 AM" />
  <SurveyCard surveyId="Survey #2024-0846" date="Today, 09:15 AM" />
</View>

// Empty state
<EmptyState
  message="Không có khảo sát nào chưa đồng bộ"
  icon={<Feather name="inbox" size={48} color="#15803d" />}
/>
```

---

### Typography

Text components with consistent styling.

#### Typography Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | 'h1' \| 'h2' \| 'h3' \| 'h4' \| 'body' \| 'bodyLarge' \| 'bodySmall' \| 'label' \| 'caption' \| 'captionBold' | 'body' | Text style variant |
| color | TypographyColor \| string | 'primary' | Text color |
| align | 'left' \| 'center' \| 'right' \| 'justify' | 'left' | Text alignment |
| children | React.ReactNode | required | Text content |

#### Examples

```typescript
import {
  Typography,
  Heading1,
  Heading2,
  Body,
  Label,
  Caption,
} from '../components';

// Using Typography component
<Typography variant="h1" color="primary" align="center">
  Ready to Start a New Survey?
</Typography>

// Using convenience components
<Heading1 color="primary">NLIS Field Survey</Heading1>
<Heading2 color="secondary">Login Required</Heading2>
<Body color="primary">Welcome to the application</Body>
<Label color="primary">Officer Name</Label>
<Caption color="accent">Version 1.0.0</Caption>

// Custom color
<Typography variant="body" color="#0f5132">
  Custom colored text
</Typography>
```

---

## Complete Example Screen

Here's a complete example combining multiple components:

```typescript
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  Header,
  SettingsButton,
  Heading1,
  Caption,
  Button,
  SectionHeader,
  Badge,
  SurveyCard,
  EmptyState,
} from '../components';
import { theme } from '../theme';

export const HomeScreen = () => {
  const [surveys, setSurveys] = useState([
    { id: '2024-0847', date: 'Today, 10:32 AM' },
    { id: '2024-0846', date: 'Today, 09:15 AM' },
    { id: '2024-0845', date: 'Yesterday, 4:22 PM' },
  ]);

  return (
    <ScrollView style={styles.container}>
      <Header
        title="Officer J. Martinez"
        subtitle="Xin chào,"
        badgeIcon={<Feather name="shield" size={32} color={theme.colors.secondary[500]} />}
        rightAction={
          <SettingsButton
            onPress={() => {}}
            icon={<Feather name="settings" size={20} color="white" />}
          />
        }
      />

      <Caption color="primary">NLIS FIELD SURVEY</Caption>
      <Heading1 color="primary">Ready to Start a New Survey?</Heading1>

      <Button
        fullWidth
        icon={<Feather name="plus-circle" size={20} color="white" />}
        onPress={() => {}}
      >
        Start New Survey
      </Button>

      <View style={styles.section}>
        <SectionHeader
          title="Unsynced Surveys"
          badge={
            <Badge
              variant="warning"
              icon={<Feather name="wifi-off" size={12} color={theme.colors.accent[900]} />}
            >
              {surveys.length}
            </Badge>
          }
        />

        {surveys.length > 0 ? (
          surveys.map((survey) => (
            <SurveyCard
              key={survey.id}
              surveyId={`Survey #${survey.id}`}
              date={survey.date}
              icon={<Feather name="map-pin" size={20} color={theme.colors.primary[500]} />}
              onPress={() => {}}
            />
          ))
        ) : (
          <EmptyState
            message="Không có khảo sát nào chưa đồng bộ"
            icon={<Feather name="inbox" size={48} color={theme.colors.primary[500]} />}
          />
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[100],
    padding: theme.spacing.lg,
  },
  section: {
    marginTop: theme.spacing['2xl'],
  },
});
```

---

## Color Palette Reference

### Primary Colors (Green)
- `colors.primary[50]` to `colors.primary[900]` - Forest green shades
- Main brand color: `colors.primary[600]` (#0f5132)

### Secondary Colors (Red)
- `colors.secondary[50]` to `colors.secondary[900]` - Red shades
- Main action color: `colors.secondary[500]` (#dc2626)

### Accent Colors (Yellow/Amber)
- `colors.accent[50]` to `colors.accent[900]` - Yellow/amber shades
- Main highlight color: `colors.accent[400]` (#fbbf24)

### Semantic Colors
- Success: `colors.semantic.success` (#15803d)
- Warning: `colors.semantic.warning` (#fbbf24)
- Error: `colors.semantic.error` (#dc2626)
- Info: `colors.semantic.info` (#3b82f6)

### Gradients
```typescript
// Usage with LinearGradient
import { LinearGradient } from 'expo-linear-gradient';

<LinearGradient
  colors={[colors.gradients.primary.start, colors.gradients.primary.end]}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={styles.gradient}
/>
```

---

## Best Practices

1. **Always import from the component index**:
   ```typescript
   import { Button, Header, Input } from '../components';
   ```

2. **Use theme values instead of hardcoded values**:
   ```typescript
   // Good
   padding: theme.spacing.lg,
   backgroundColor: theme.colors.primary[600],

   // Avoid
   padding: 20,
   backgroundColor: '#0f5132',
   ```

3. **Use semantic color names when possible**:
   ```typescript
   // Good
   color: colors.semantic.error

   // Less clear
   color: colors.secondary[500]
   ```

4. **Prefer Typography components over Text**:
   ```typescript
   // Good
   <Heading1 color="primary">Title</Heading1>

   // Less consistent
   <Text style={{ fontSize: 30, fontWeight: 'bold' }}>Title</Text>
   ```

5. **Use variants instead of custom styling**:
   ```typescript
   // Good
   <Button variant="outline" size="large">Cancel</Button>

   // Avoid
   <Button style={{ backgroundColor: 'transparent', borderWidth: 2 }}>Cancel</Button>
   ```
