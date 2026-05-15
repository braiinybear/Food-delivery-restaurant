import React, { useMemo, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { Fonts } from '@/constants/typography';

interface OrderProgressBarProps {
  status: string;
  size?: 'small' | 'medium' | 'large';
}

const ORDER_STATUSES = [
  { key: 'PLACED', label: 'Placed', icon: 'list-circle' as const },
  { key: 'ACCEPTED', label: 'Accepted', icon: 'checkmark-circle' as const },
  { key: 'PREPARING', label: 'Preparing', icon: 'restaurant' as const },
  { key: 'READY', label: 'Ready', icon: 'cube' as const },
  { key: 'PICKED_UP', label: 'Picked Up', icon: 'bag-handle' as const },
  { key: 'ON_THE_WAY', label: 'On The Way', icon: 'bicycle' as const },
  { key: 'DELIVERED', label: 'Delivered', icon: 'checkmark-done' as const },
];

/**
 * OrderProgressBar: Shows visual progress of order through stages
 * - Animated bars fill as order progresses
 * - Color-coded stages
 * - Icons for each stage
 */
export function OrderProgressBar({ status, size = 'medium' }: OrderProgressBarProps) {
  const { Colors, isDark } = useTheme();
  const [progressAnim] = useState(new Animated.Value(0));

  const currentStageIndex = useMemo(() => {
    return ORDER_STATUSES.findIndex(s => s.key === status);
  }, [status]);

  const progress = useMemo(() => {
    if (currentStageIndex === -1) return 0;
    return (currentStageIndex + 1) / ORDER_STATUSES.length;
  }, [currentStageIndex]);

  // Animate progress when it changes
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

  const sizeConfig = {
    small: { height: 24, iconSize: 12, labelSize: 10, gap: 4 },
    medium: { height: 40, iconSize: 18, labelSize: 12, gap: 6 },
    large: { height: 60, iconSize: 24, labelSize: 14, gap: 8 },
  };

  const config = sizeConfig[size];

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const getStageColor = (index: number) => {
    if (index < currentStageIndex) return Colors.success; // Completed
    if (index === currentStageIndex) return Colors.primary; // Current
    return Colors.border; // Future
  };

  return (
    <View style={styles.container}>
      {/* Progress Background Bar */}
      <View style={[styles.progressBarBackground, { height: config.height / 8, backgroundColor: isDark ? Colors.border : Colors.light }]}>
        <Animated.View
          style={[
            styles.progressBarFill,
            {
              width: progressWidth,
              backgroundColor: Colors.success,
              height: '100%',
            },
          ]}
        />
      </View>

      {/* Status Icons */}
      <View style={[styles.stagesContainer, { gap: config.gap }]}>
        {ORDER_STATUSES.map((stage, index) => {
          const isCompleted = index < currentStageIndex;
          const isCurrent = index === currentStageIndex;
          const color = getStageColor(index);

          return (
            <View key={stage.key} style={styles.stageWrapper}>
              <View
                style={[
                  styles.stageIcon,
                  {
                    width: config.iconSize * 1.6,
                    height: config.iconSize * 1.6,
                    borderRadius: config.iconSize * 0.8,
                    backgroundColor: isCurrent ? color : isCompleted ? Colors.success : Colors.surface,
                    borderWidth: isCurrent ? 2 : 0,
                    borderColor: color,
                    shadowColor: color,
                    shadowOpacity: isCurrent ? 0.3 : 0,
                    shadowRadius: 4,
                    elevation: isCurrent ? 2 : 0,
                  },
                ]}
              >
                <Ionicons
                  name={stage.icon}
                  size={config.iconSize}
                  color={isCurrent || isCompleted ? (isDark && isCurrent ? Colors.background : 'white') : Colors.muted}
                />
              </View>
              {size !== 'small' && (
                <Text
                  style={[
                    styles.stageLabel,
                    {
                      fontSize: config.labelSize,
                      color: isCurrent ? color : Colors.textSecondary,
                      fontFamily: isCurrent ? Fonts.brandBold : Fonts.brand,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {stage.label}
                </Text>
              )}
            </View>
          );
        })}
      </View>

      {/* Current Status Text */}
      <Text style={[styles.statusText, { color: Colors.muted }]}>
        Current Status: <Text style={[styles.statusBold, { color: Colors.primary }]}>{status.replace(/_/g, ' ')}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  progressBarBackground: {
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBarFill: {
    borderRadius: 6,
  },
  stagesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stageWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  stageIcon: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stageLabel: {
    textAlign: 'center',
    marginTop: 6,
  },
  statusText: {
    fontSize: 12,
    fontFamily: Fonts.brand,
    textAlign: 'center',
    marginTop: 8,
  },
  statusBold: {
    fontFamily: Fonts.brandBold,
  },
});
