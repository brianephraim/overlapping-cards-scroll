import type { ComponentProps, ReactNode } from 'react'
import { StyleSheet, View } from 'react-native-web'
import type { StyleProp, ViewStyle } from 'react-native'
import {
  OverlappingCardsScroll,
  OverlappingCardsScrollFocusTrigger,
} from '../lib/OverlappingCardsScroll'

interface OverlappingCardsScrollRNFocusTriggerProps
  extends Omit<ComponentProps<'button'>, 'onClick'> {
  children?: ReactNode
  className?: string
  onPress?: (event: unknown) => void
  onClick?: (event: unknown) => void
}

export function OverlappingCardsScrollRNFocusTrigger({
  children = 'Make principal',
  className = '',
  onPress = undefined as undefined | ((event: unknown) => void),
  onClick = undefined as undefined | ((event: unknown) => void),
  ...buttonProps
}: OverlappingCardsScrollRNFocusTriggerProps) {
  const handleClick = (event: unknown) => {
    onClick?.(event)
    onPress?.(event)
  }

  return (
    <OverlappingCardsScrollFocusTrigger
      className={className}
      onClick={handleClick}
      {...buttonProps}
    >
      {children}
    </OverlappingCardsScrollFocusTrigger>
  )
}

type OverlappingCardsScrollRNProps = Omit<
  ComponentProps<typeof OverlappingCardsScroll>,
  'items'
> & {
  style?: StyleProp<ViewStyle>
  showsHorizontalScrollIndicator?: boolean
  snapDecelerationRate?: string
  snapDisableIntervalMomentum?: boolean
}

export function OverlappingCardsScrollRN({
  children,
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
      <OverlappingCardsScroll {...overlappingCardsScrollProps}>
        {children}
      </OverlappingCardsScroll>
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
