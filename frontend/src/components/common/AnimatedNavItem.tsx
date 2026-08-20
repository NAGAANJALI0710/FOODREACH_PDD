import React, { useEffect, useRef } from 'react';
import { Animated, TouchableWithoutFeedback, View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';

interface AnimatedNavItemProps {
  id?: string;
  isActive: boolean;
  onPress: () => void;
  icon: (color: string) => React.ReactNode;
  label: string;
  activeColor?: string;
  inactiveColor?: string;
  style?: StyleProp<ViewStyle>;
}

export const AnimatedNavItem: React.FC<AnimatedNavItemProps> = ({
  id,
  isActive,
  onPress,
  icon,
  label,
  activeColor = '#22C55E',
  inactiveColor = '#64748B',
  style,
}) => {
  const scaleAnim = useRef(new Animated.Value(isActive ? 1.10 : 1.0)).current;
  const translateYAnim = useRef(new Animated.Value(isActive ? -5 : 0)).current;
  const pillOpacity = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: isActive ? 1.10 : 1.0,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(translateYAnim, {
        toValue: isActive ? -5 : 0,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(pillOpacity, {
        toValue: isActive ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, [isActive]);

  const currentColor = isActive ? activeColor : inactiveColor;

  return (
    <TouchableWithoutFeedback id={id} onPress={onPress}>
      <View style={[styles.navTabBtn, style]}>
        <Animated.View
          style={[
            styles.navIconWrapper,
            {
              transform: [
                { translateY: translateYAnim },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.pillBackground,
              {
                backgroundColor: activeColor + '1F',
                opacity: pillOpacity,
              },
            ]}
          />
          {icon(currentColor)}
        </Animated.View>
        <Animated.Text
          style={[
            styles.navLabel,
            {
              color: currentColor,
              fontWeight: isActive ? '700' : '500',
              transform: [{ translateY: translateYAnim }],
            },
          ]}
        >
          {label}
        </Animated.Text>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  navTabBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    flex: 1,
  },
  navIconWrapper: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pillBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
  },
  navLabel: {
    fontSize: 10.5,
    marginTop: 2,
  },
});

export default AnimatedNavItem;
