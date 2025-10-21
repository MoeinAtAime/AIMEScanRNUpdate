// hooks/useFadeAnimation.ts
import {useRef, useCallback} from 'react';
import {Animated} from 'react-native';

interface UseFadeAnimationReturn {
  fadeAnim: Animated.Value;
  startFadeOut: () => void;
}

export function useFadeAnimation(): UseFadeAnimationReturn {
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const startFadeOut = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return {fadeAnim, startFadeOut};
}
