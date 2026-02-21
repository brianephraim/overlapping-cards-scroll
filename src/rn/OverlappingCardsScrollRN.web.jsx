import { StyleSheet, View } from 'react-native'
import { OverlappingCardsScroll } from '../lib'

export function OverlappingCardsScrollRN({
  children,
  style,
  cardHeight = 300,
  cardWidth,
  cardWidthRatio = 1 / 3,
  basePeek = 64,
  minPeek = 10,
  maxPeek = 84,
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
