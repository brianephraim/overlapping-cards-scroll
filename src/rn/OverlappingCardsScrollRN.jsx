import { Children, useEffect, useMemo, useRef, useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

export function OverlappingCardsScrollRN({
  children,
  style,
  cardHeight = 300,
  cardWidthRatio = 1 / 3,
  basePeek = 64,
  minPeek = 10,
  maxPeek = 84,
  showsHorizontalScrollIndicator = true,
}) {
  const cards = useMemo(() => Children.toArray(children), [children])
  const cardCount = cards.length

  const scrollRef = useRef(null)

  const [viewportWidth, setViewportWidth] = useState(1)
  const [scrollLeft, setScrollLeft] = useState(0)

  const layout = useMemo(() => {
    const safeWidth = Math.max(1, viewportWidth)
    const safeRatio = clamp(cardWidthRatio, 0.2, 0.95)
    const cardWidth = safeWidth * safeRatio

    if (cardCount < 2) {
      return {
        cardWidth,
        peek: 0,
        stepDistance: 1,
        scrollRange: 0,
        trackWidth: safeWidth,
      }
    }

    const availableStackWidth = Math.max(0, safeWidth - cardWidth)
    const preferredPeek = clamp(basePeek, minPeek, maxPeek)
    const maxVisiblePeek = availableStackWidth / (cardCount - 1)
    const peek = Math.min(preferredPeek, maxVisiblePeek)

    const stepDistance = Math.max(1, cardWidth - peek)
    const scrollRange = stepDistance * (cardCount - 1)

    return {
      cardWidth,
      peek,
      stepDistance,
      scrollRange,
      trackWidth: safeWidth + scrollRange,
    }
  }, [basePeek, cardCount, cardWidthRatio, maxPeek, minPeek, viewportWidth])

  useEffect(() => {
    if (!scrollRef.current) {
      return
    }

    if (scrollLeft > layout.scrollRange) {
      scrollRef.current.scrollTo({ x: layout.scrollRange, y: 0, animated: false })
      setScrollLeft(layout.scrollRange)
    }
  }, [layout.scrollRange, scrollLeft])

  const progress = cardCount > 1 ? clamp(scrollLeft / layout.stepDistance, 0, cardCount - 1) : 0
  const activeIndex = Math.floor(progress)
  const transitionProgress = progress - activeIndex

  return (
    <View
      style={[styles.root, style, { height: cardHeight }]}
      onLayout={(event) => {
        const width = event.nativeEvent.layout.width || 1
        setViewportWidth(Math.max(1, width))
      }}
    >
      <View pointerEvents="none" style={[styles.cardsLayer, { height: cardHeight }]}>
        {cards.map((card, index) => {
          let cardX

          if (index <= activeIndex) {
            cardX = index * layout.peek
          } else {
            cardX =
              activeIndex * layout.peek + layout.cardWidth + (index - activeIndex - 1) * layout.peek
          }

          if (index === activeIndex + 1) {
            cardX -= transitionProgress * (layout.cardWidth - layout.peek)
          }

          return (
            <View
              key={card.key ?? `rn-ocs-card-${index}`}
              style={[
                styles.card,
                {
                  width: layout.cardWidth,
                  height: cardHeight,
                  transform: [{ translateX: cardX }],
                },
              ]}
            >
              {card}
            </View>
          )
        })}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        style={[styles.controllerLayer, { height: cardHeight }]}
        contentContainerStyle={{ width: layout.trackWidth, height: cardHeight }}
        onScroll={(event) => {
          setScrollLeft(event.nativeEvent.contentOffset.x)
        }}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
      >
        <View style={{ width: layout.trackWidth, height: cardHeight }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    minWidth: 0,
    position: 'relative',
  },
  cardsLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    zIndex: 1,
  },
  controllerLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    zIndex: 2,
  },
  card: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
})
