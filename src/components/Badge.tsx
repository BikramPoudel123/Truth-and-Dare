import { View, Text, StyleSheet, ViewStyle } from 'react-native';

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
    backgroundColor: 'rgba(30, 58, 138, 0.5)',
    borderWidth: 1,
    borderColor: '#4f46e5',
  },
  dare: {
    backgroundColor: 'rgba(127, 29, 29, 0.5)',
    borderWidth: 1,
    borderColor: '#ef4444',
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
  const badgeStyle = variant === 'truth' ? styles.truth : variant === 'dare' ? styles.dare : styles.info;
  const textStyle = variant === 'truth' ? styles.truthText : variant === 'dare' ? styles.dareText : styles.infoText;

  return (
    <View style={[styles.badge, badgeStyle, style]}>
      <Text style={textStyle}>{children}</Text>
    </View>
  );
}
