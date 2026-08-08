import { View, ViewProps, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { RADIUS } from '@/constants/design-system';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'default' | 'subtle' | 'bordered';
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.cardSm,
    padding: 20,
  },
  default: {
    backgroundColor: '#1c1c22',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  subtle: {
    backgroundColor: 'rgba(28, 28, 34, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(39, 39, 42, 0.5)',
  },
  bordered: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#fd267a',
  },
});

export function Card({ children, variant = 'default', style, ...props }: CardProps) {
  const { colors } = useTheme();
  const variantStyles = variant === 'default' ? styles.default : variant === 'subtle' ? styles.subtle : styles.bordered;

  return (
    <View style={[styles.card, variantStyles, variant === 'default' && { backgroundColor: colors.card, borderColor: colors.border }, variant === 'subtle' && { backgroundColor: colors.surface, borderColor: colors.border }, style]} {...props}>
      {children}
    </View>
  );
}
