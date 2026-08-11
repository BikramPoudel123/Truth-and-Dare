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
    backgroundColor: '#f5f5f6',
    borderWidth: 1,
    borderColor: '#e8e8ec',
  },
  subtle: {
    backgroundColor: '#f5f5f6',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
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
