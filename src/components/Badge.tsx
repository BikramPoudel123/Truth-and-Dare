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
    backgroundColor: 'rgba(253, 38, 122, 0.2)',
    borderWidth: 1,
    borderColor: '#fd267a',
  },
  dare: {
    backgroundColor: 'rgba(255, 77, 77, 0.2)',
    borderWidth: 1,
    borderColor: '#ff4d4d',
  },
  info: {
    backgroundColor: '#1c1c22',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  truthText: {
    color: '#fd267a',
    fontWeight: '700',
    textTransform: 'uppercase',
    fontSize: 14,
  },
  dareText: {
    color: '#ff9b6b',
    fontWeight: '700',
    textTransform: 'uppercase',
    fontSize: 14,
  },
  infoText: {
    color: '#6e6e7a',
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
