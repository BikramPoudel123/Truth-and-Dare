import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'truth' | 'dare' | 'info';
  style?: ViewStyle;
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  truth: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  dare: {
    backgroundColor: 'rgba(220, 38, 38, 0.2)',
    borderWidth: 1,
    borderColor: '#dc2626',
  },
  info: {
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#374151',
  },
  truthText: {
    color: '#93c5fd',
    fontWeight: '700',
    textTransform: 'uppercase',
    fontSize: 14,
  },
  dareText: {
    color: '#fca5a5',
    fontWeight: '700',
    textTransform: 'uppercase',
    fontSize: 14,
  },
  infoText: {
    color: '#9ca3af',
    fontWeight: '700',
    textTransform: 'uppercase',
    fontSize: 14,
  },
});

export function Badge({ children, variant = 'info', style }: BadgeProps) {
  const { colors } = useTheme();
  const badgeStyle = variant === 'truth' ? styles.truth : variant === 'dare' ? styles.dare : styles.info;
  const textStyle = variant === 'truth' ? styles.truthText : variant === 'dare' ? styles.dareText : styles.infoText;

  return (
    <View style={[styles.badge, badgeStyle, variant === 'info' && { backgroundColor: colors.card, borderColor: colors.border }, style]}>
      <Text style={textStyle}>{children}</Text>
    </View>
  );
}
