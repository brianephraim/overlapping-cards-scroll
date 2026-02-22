import { StyleSheet, View } from 'react-native'
import {
  OverlappingCardsScroll,
  OverlappingCardsScrollFocusTrigger,
} from '../lib'

export function OverlappingCardsScrollRNFocusTrigger({
  children = 'Make principal',
  className = '',
  onPress = undefined,
  ...buttonProps
}) {
  const handleClick = (event) => {
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
  cardHeight = 300,
  cardWidth = undefined,
  cardWidthRatio = 1 / 3,
  basePeek = 64,
  minPeek = 10,
  maxPeek = 84,
  showsHorizontalScrollIndicator = true,
  snapDecelerationRate = 'normal',
  snapDisableIntervalMomentum = false,
  showPageDots = false,
  pageDotsPosition = 'below' as const,
  pageDotsOffset = 10,
  pageDotsBehavior = 'smooth' as const,
  snapToCardOnRelease = true,
  snapReleaseDelay = 800,
  focusTransitionDuration = 420,
}) {
  void showsHorizontalScrollIndicator
  void snapDecelerationRate
  void snapDisableIntervalMomentum

  return (
    <View style={[styles.root, style]}>
      <OverlappingCardsScroll
        cardHeight={cardHeight}
        cardWidth={cardWidth}
        cardWidthRatio={cardWidthRatio}
        basePeek={basePeek}
        minPeek={minPeek}
        maxPeek={maxPeek}
        showPageDots={showPageDots}
        pageDotsPosition={pageDotsPosition}
        pageDotsOffset={pageDotsOffset}
        pageDotsBehavior={pageDotsBehavior}
        snapToCardOnRelease={snapToCardOnRelease}
        snapReleaseDelay={snapReleaseDelay}
        focusTransitionDuration={focusTransitionDuration}
      >
        {children}
      </OverlappingCardsScroll>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    minWidth: 0,
  },
})
