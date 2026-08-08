import { TouchableOpacity, TouchableOpacityProps, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { BrandGradient } from '@/components/BrandGradient';
import { RADIUS } from '@/constants/design-system';

interface ButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: RADIUS.button,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  secondary: {
    backgroundColor: '#1c1c22',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  danger: {
    backgroundColor: '#ff6036',
  },
  success: {
    backgroundColor: '#34c271',
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
    fontWeight: '800',
  },
  fullWidth: {
    width: '100%',
  },
  gradFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: RADIUS.button,
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
  const { colors } = useTheme();
  const isPrimary = variant === 'primary';
  const variantStyle = isPrimary ? null : variant === 'secondary' ? styles.secondary : variant === 'danger' ? styles.danger : styles.success;
  const sizeStyle = size === 'sm' ? styles.sm : size === 'md' ? styles.md : styles.lg;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        variantStyle,
        sizeStyle,
        fullWidth && styles.fullWidth,
        variant === 'secondary' && { backgroundColor: colors.card, borderColor: colors.border },
        style,
      ]}
      {...props}
    >
      {isPrimary && <BrandGradient variant="primary" style={styles.gradFill} pointerEvents="none" />}
      <Text style={styles.textWhite}>{children}</Text>
    </TouchableOpacity>
  );
}
