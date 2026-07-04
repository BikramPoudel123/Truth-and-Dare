import { View, ViewProps, StyleSheet } from 'react-native';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'default' | 'subtle' | 'bordered';
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    padding: 24,
  },
  default: {
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#374151',
  },
  subtle: {
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(55, 65, 81, 0.5)',
  },
  bordered: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#4f46e5',
  },
});

export function Card({ children, variant = 'default', style, ...props }: CardProps) {
  const variantStyles = variant === 'default' ? styles.default : variant === 'subtle' ? styles.subtle : styles.bordered;

  return (
    <View style={[styles.card, variantStyles, style]} {...props}>
      {children}
    </View>
  );
}
