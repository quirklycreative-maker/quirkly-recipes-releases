// src/hooks/useAppFonts.ts
import { useFonts, Inter_400Regular, Inter_500Medium } from '@expo-google-fonts/inter';
import { RobotoSlab_400Regular, RobotoSlab_500Medium } from '@expo-google-fonts/roboto-slab';

/**
 * Hook that loads the selected Google fonts.
 * Returns `[fontsLoaded]` – a boolean indicating when the fonts are ready.
 */
export const useAppFonts = () => {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    RobotoSlab_400Regular,
    RobotoSlab_500Medium,
  });
  return [fontsLoaded] as const;
};
