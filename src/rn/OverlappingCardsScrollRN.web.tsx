import { StyleSheet, View } from 'react-native-web'
import {
  OverlappingCardsScroll,
  OverlappingCardsScrollFocusTrigger,
} from '../lib/OverlappingCardsScroll'

export function OverlappingCardsScrollRNFocusTrigger({
  children = 'Make principal',
  className = '',
  onPress = undefined as undefined | ((event: unknown) => void),
  onClick = undefined as undefined | ((event: unknown) => void),
  ...buttonProps
}: any) {
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

export function OverlappingCardsScrollRN({
  children,
  style = undefined,
  showsHorizontalScrollIndicator = true,
  snapDecelerationRate = 'normal',
  snapDisableIntervalMomentum = false,
  ...overlappingCardsScrollProps
}: any) {
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
