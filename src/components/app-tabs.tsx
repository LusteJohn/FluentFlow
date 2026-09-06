import { createContext, useContext, useState } from 'react';
import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { useTheme } from '@/contexts/theme-context';

export const TabBarContext = createContext<{
  isTabBarHidden: boolean;
  setIsTabBarHidden: (hidden: boolean) => void;
}>({
  isTabBarHidden: false,
  setIsTabBarHidden: () => {},
});

export default function AppTabs() {
  const colors = useTheme();
  const [isTabBarHidden, setIsTabBarHidden] = useState(false);

  return (
    <TabBarContext.Provider value={{ isTabBarHidden, setIsTabBarHidden }}>
      <NativeTabs
        hidden={isTabBarHidden}
        backgroundColor={colors.background}
        indicatorColor={colors.backgroundElement}
        labelStyle={{ selected: { color: colors.onSurface } }}>
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            src={require('@/assets/images/tabIcons/home.png')}
            renderingMode="template"
          />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="explore">
          <NativeTabs.Trigger.Label>Explore</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            src={require('@/assets/images/tabIcons/explore.png')}
            renderingMode="template"
          />
        </NativeTabs.Trigger>
      </NativeTabs>
    </TabBarContext.Provider>
  );
}
