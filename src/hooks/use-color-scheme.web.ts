import { useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

export function useColorScheme() {
  const [hasHydrated] = useState(() => {
    const hasHydrated = typeof window !== 'undefined';
    return hasHydrated;
  });
  const colorScheme = useRNColorScheme();

  if (hasHydrated) {
    return colorScheme;
  }

  return 'light';
}
