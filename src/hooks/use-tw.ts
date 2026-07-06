import { useMemo } from 'react';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useTw() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return useMemo(
    () => ({
      isDark,
      container: {
        flex: 1,
        backgroundColor: isDark ? '#09090b' : '#ffffff',
      },
      text: {
        color: isDark ? '#ffffff' : '#000000',
      },
    }),
    [isDark]
  );
}
