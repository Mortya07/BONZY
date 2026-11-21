import React, { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
  Platform,
} from "react-native";
import { C } from "./ui";
export function Opening() {
  const [visible, setVisible] = useState(true);
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let mounted = true;
    const finish = () => {
      if (mounted) setVisible(false);
    };
    const fallback = setTimeout(finish, 1900);
    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduced) => {
        if (!mounted) return;
        if (reduced) {
          finish();
          return;
        }
        Animated.timing(progress, {
          toValue: 1,
          duration: 1250,
          easing: Easing.linear,
          useNativeDriver: Platform.OS !== "web",
        }).start(finish);
      })
      .catch(finish);
    return () => {
      mounted = false;
      clearTimeout(fallback);
      progress.stopAnimation();
    };
  }, [progress]);
  if (!visible) return null;
  const motion = (range: number[], values: number[]) =>
    progress.interpolate({
      inputRange: range,
      outputRange: values,
      extrapolate: "clamp",
    });
  return (
    <Animated.View
      pointerEvents="none"
      accessible={false}
      style={[
        StyleSheet.absoluteFill,
        {
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: C.green,
          opacity: motion([0, 0.76, 1], [1, 1, 0]),
        },
      ]}
    >
      <Animated.View
        style={{
          position: "absolute",
          width: 160,
          height: 160,
          borderRadius: 80,
          borderWidth: 1,
          borderColor: "#D8EAC0",
          opacity: motion([0, 0.55, 1], [0.7, 0.2, 0]),
          transform: [{ scale: motion([0, 0.8, 1], [0.18, 2.8, 3]) }],
        }}
      />
      <Animated.View
        style={{
          transform: [
            { translateY: motion([0, 0.38, 0.6], [16, -2, 0]) },
            { scale: motion([0, 0.38, 0.62], [0.78, 1.04, 1]) },
          ],
          opacity: motion([0, 0.26], [0, 1]),
        }}
      >
        <Text
          style={{
            fontSize: 66,
            letterSpacing: -5,
            fontWeight: "900",
            color: "#FFF9ED",
          }}
        >
          bonzy<Text style={{ color: "#FF9560" }}>.</Text>
        </Text>
      </Animated.View>
    </Animated.View>
  );
}
