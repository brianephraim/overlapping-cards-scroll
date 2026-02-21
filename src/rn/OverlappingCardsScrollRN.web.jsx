import { StyleSheet, View } from 'react-native'
import {
  OverlappingCardsScroll,
  OverlappingCardsScrollFocusTrigger,
} from '../lib'

export function OverlappingCardsScrollRNFocusTrigger({
  children = 'Make principal',
  className = '',
  onPress,
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
  style,
  cardHeight = 300,
  cardWidth,
  cardWidthRatio = 1 / 3,
  basePeek = 64,
  minPeek = 10,
  maxPeek = 84,
  showPageDots = false,
  pageDotsPosition = 'below',
  pageDotsOffset = 10,
  pageDotsBehavior = 'smooth',
  snapToCardOnRelease = true,
  snapReleaseDelay = 800,
}) {
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
