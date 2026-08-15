import { useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';

import { colors, radii } from '../../../theme';

export interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  onSlidingComplete?: (value: number) => void;
  minimumValue?: number;
  maximumValue?: number;
  step?: number;
  isDisabled?: boolean;
}

const THUMB_SIZE = 22;
const TRACK_HEIGHT = 4;

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

// Slider dibangun dari nol dengan PanResponder (bagian dari react-native
// core) karena @react-native-community/slider belum jadi dependency project.
export function Slider({
  value,
  onChange,
  onSlidingComplete,
  minimumValue = 0,
  maximumValue = 100,
  step = 1,
  isDisabled = false,
}: SliderProps) {
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);
  const valueRef = useRef(value);
  const dragStartXRef = useRef(0);
  valueRef.current = value;

  const onLayout = (e: LayoutChangeEvent) => {
    widthRef.current = e.nativeEvent.layout.width;
    setWidth(e.nativeEvent.layout.width);
  };

  function ratioToX(v: number) {
    const trackWidth = Math.max(widthRef.current - THUMB_SIZE, 1);
    return ((v - minimumValue) / (maximumValue - minimumValue)) * trackWidth;
  }

  const xToValue = (x: number) => {
    const trackWidth = Math.max(widthRef.current - THUMB_SIZE, 1);
    const ratio = clamp(x / trackWidth, 0, 1);
    const raw = minimumValue + ratio * (maximumValue - minimumValue);
    const stepped = Math.round(raw / step) * step;
    return clamp(stepped, minimumValue, maximumValue);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !isDisabled,
        onMoveShouldSetPanResponder: () => !isDisabled,
        onPanResponderGrant: () => {
          dragStartXRef.current = ratioToX(valueRef.current);
        },
        onPanResponderMove: (_evt, gesture) => {
          onChange(xToValue(dragStartXRef.current + gesture.dx));
        },
        onPanResponderRelease: () => {
          onSlidingComplete?.(valueRef.current);
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isDisabled, minimumValue, maximumValue, step],
  );

  const thumbX = width > 0 ? ratioToX(value) : 0;
  const fillWidth = thumbX + THUMB_SIZE / 2;

  return (
    <View style={styles.wrapper} onLayout={onLayout}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: fillWidth }]} />
      </View>
      <View
        {...panResponder.panHandlers}
        style={[styles.thumb, { left: thumbX }, isDisabled && styles.thumbDisabled]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { justifyContent: 'center', height: THUMB_SIZE, paddingHorizontal: 0 },
  track: {
    height: TRACK_HEIGHT,
    borderRadius: radii.full,
    backgroundColor: colors.gray[200],
    overflow: 'hidden',
  },
  fill: { height: TRACK_HEIGHT, backgroundColor: colors.primary[600] },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.primary[600],
  },
  thumbDisabled: { borderColor: colors.gray[400] },
});
