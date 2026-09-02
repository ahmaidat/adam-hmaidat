import React from 'react';
import { UnifiedAuthPortal } from './UnifiedAuthPortal';

interface WelcomeScreenProps {
  onEnterPassenger: () => void;
  onEnterDriver: () => void;
  onEnterDashboard: (targetView?: 'admin' | 'dashboard' | 'simulator') => void;
  onEnterAuth?: (mode?: 'login' | 'register', role?: 'passenger' | 'driver') => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onEnterPassenger,
  onEnterDriver,
  onEnterDashboard,
}) => {
  return (
    <UnifiedAuthPortal
      initialMode="login"
      initialRegRole="passenger"
      onLoginSuccess={(role) => {
        if (role === 'passenger') {
          onEnterPassenger();
        } else if (role === 'driver') {
          onEnterDriver();
        } else if (role === 'admin') {
          onEnterDashboard('admin');
        }
      }}
    />
  );
};
