import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type DisclaimerContextType = {
  hasAccepted: boolean;
  showBanner: boolean;
  acceptDisclaimer: () => Promise<void>;
  setShowBanner: (value: boolean) => void;
};

const DisclaimerContext = createContext<DisclaimerContextType | undefined>(undefined);

export const DisclaimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasAccepted, setHasAccepted] = useState(false);
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    const loadDisclaimerState = async () => {
      const shown = await AsyncStorage.getItem('disclaimerShown');
      if (shown === 'true') {
        setHasAccepted(true);
        setShowBanner(false);
      }
    };
    loadDisclaimerState();
  }, []);

  const acceptDisclaimer = async () => {
    await AsyncStorage.setItem('disclaimerShown', 'true');
    setHasAccepted(true);
    setShowBanner(false);
  };

  return (
    <DisclaimerContext.Provider value={{ hasAccepted, showBanner, acceptDisclaimer, setShowBanner }}>
      {children}
    </DisclaimerContext.Provider>
  );
};

export const useDisclaimer = () => {
  const context = useContext(DisclaimerContext);
  if (!context) {
    throw new Error('useDisclaimer must be used within a DisclaimerProvider');
  }
  return context;
};
