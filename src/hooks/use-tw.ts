import { useMemo } from 'react';

export function useTw() {
  return useMemo(
    () => ({
      container: {
        flex: 1,
        backgroundColor: '#ffffff',
      },
      text: {
        color: '#000000',
      },
    }),
    []
  );
}
