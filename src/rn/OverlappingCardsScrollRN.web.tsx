import type { ComponentProps } from 'react'
import { StyleSheet, View } from 'react-native'
import {
  OverlappingCardsScroll,
  OverlappingCardsScrollFocusTrigger,
} from '../lib/OverlappingCardsScroll'
import type {
  OverlappingCardsScrollRNFocusTriggerProps,
  OverlappingCardsScrollRNProps,
} from './OverlappingCardsScrollRN.types'

export type {
  OverlappingCardsScrollRNFocusTransitionMode,
  OverlappingCardsScrollRNFocusTriggerBehavior,
  OverlappingCardsScrollRNFocusTriggerProps,
  OverlappingCardsScrollRNItem,
  OverlappingCardsScrollRNPageDotsPosition,
  OverlappingCardsScrollRNProps,
  OverlappingCardsScrollRNSnapDecelerationRate,
  OverlappingCardsScrollRNTabsContainerProps,
  OverlappingCardsScrollRNTabProps,
  OverlappingCardsScrollRNTabsPosition,
} from './OverlappingCardsScrollRN.types'

export function OverlappingCardsScrollRNFocusTrigger({
  children = 'Make principal',
  className = '',
  style = undefined,
  textStyle = undefined,
  behavior = 'smooth',
  transitionMode = 'swoop',
  disabled = false,
  accessibilityLabel = undefined,
  testID = undefined,
  onPress = undefined,
  onClick = undefined,
  ...buttonProps
}: OverlappingCardsScrollRNFocusTriggerProps) {
  void style
  void textStyle

  const handleClick = (event: unknown) => {
    onClick?.(event)
    onPress?.(event)
  }

  return (
    <OverlappingCardsScrollFocusTrigger
      className={className}
      behavior={behavior}
      transitionMode={transitionMode}
      disabled={disabled}
      aria-label={accessibilityLabel}
      data-testid={testID}
      onClick={handleClick}
      {...buttonProps}
    >
      {children}
    </OverlappingCardsScrollFocusTrigger>
  )
}

export function OverlappingCardsScrollRN({
  style = undefined,
  showsHorizontalScrollIndicator = true,
  snapDecelerationRate = 'normal',
  snapDisableIntervalMomentum = false,
  ...overlappingCardsScrollProps
}: OverlappingCardsScrollRNProps) {
  void showsHorizontalScrollIndicator
  void snapDecelerationRate
  void snapDisableIntervalMomentum

  return (
    <View style={[styles.root, style]}>
      <OverlappingCardsScroll
        {...(overlappingCardsScrollProps as ComponentProps<typeof OverlappingCardsScroll>)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    minWidth: 0,
    flex: 1,
    minHeight: 0,
  },
})
