import React from 'react';
import { View, Text } from 'react-native';

export const NgoVerificationLockScreen: React.FC<any> = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>NGO Verification is disabled.</Text>
    </View>
  );
};

export default NgoVerificationLockScreen;
