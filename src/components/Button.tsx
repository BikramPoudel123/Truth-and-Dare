import { TouchableOpacity, TouchableOpacityProps, Text, StyleSheet } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: '#4f46e5',
  },
  secondary: {
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#374151',
  },
  danger: {
    backgroundColor: '#ef4444',
  },
  success: {
    backgroundColor: '#22c55e',
  },
  sm: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  md: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  lg: {
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  textWhite: {
    color: 'white',
    fontWeight: '700',
  },
  fullWidth: {
    width: '100%',
  },
});

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  style,
  ...props
}: ButtonProps) {
  const variantStyle = variant === 'primary' ? styles.primary : variant === 'secondary' ? styles.secondary : variant === 'danger' ? styles.danger : styles.success;
  const sizeStyle = size === 'sm' ? styles.sm : size === 'md' ? styles.md : styles.lg;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        variantStyle,
        sizeStyle,
        fullWidth && styles.fullWidth,
        style,
      ]}
      {...props}
    >
      <Text style={styles.textWhite}>{children}</Text>
    </TouchableOpacity>
  );
}
