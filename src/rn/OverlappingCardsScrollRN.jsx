import { Children, useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Platform, StyleSheet, View } from 'react-native'

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
  const scrollX = useRef(new Animated.Value(0)).current
  const scrollXValueRef = useRef(0)

  const [viewportWidth, setViewportWidth] = useState(1)

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
    const id = scrollX.addListener(({ value }) => {
      scrollXValueRef.current = value
    })

    return () => {
      scrollX.removeListener(id)
    }
  }, [scrollX])

  useEffect(() => {
    if (!scrollRef.current) {
      return
    }

    if (scrollXValueRef.current > layout.scrollRange) {
      scrollRef.current.scrollTo({ x: layout.scrollRange, y: 0, animated: false })
      scrollX.setValue(layout.scrollRange)
      scrollXValueRef.current = layout.scrollRange
    }
  }, [layout.scrollRange, scrollX])

  const onScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
        useNativeDriver: Platform.OS !== 'web',
      }),
    [scrollX],
  )

  return (
    <View
      style={[styles.root, style, { height: cardHeight }]}
      onLayout={(event) => {
        const width = event.nativeEvent.layout.width || 1
        setViewportWidth(Math.max(1, width))
      }}
    >
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        style={[styles.scrollRegion, { height: cardHeight }]}
        contentContainerStyle={{ width: layout.trackWidth, height: cardHeight }}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
      >
        <View style={[styles.track, { width: layout.trackWidth, height: cardHeight }]}>
          {cards.map((card, index) => {
            const restingRightX = index === 0 ? 0 : (index - 1) * layout.peek + layout.cardWidth
            const restingLeftX = index * layout.peek

            const animatedCardX =
              index === 0
                ? 0
                : scrollX.interpolate({
                    inputRange:
                      index === 1
                        ? [0, layout.stepDistance]
                        : [(index - 1) * layout.stepDistance, index * layout.stepDistance],
                    outputRange: [restingRightX, restingLeftX],
                    extrapolate: 'clamp',
                  })

            return (
              <Animated.View
                key={card.key ?? `rn-ocs-card-${index}`}
                style={[
                  styles.card,
                  {
                    width: layout.cardWidth,
                    height: cardHeight,
                    transform: [
                      {
                        translateX: Animated.add(scrollX, animatedCardX),
                      },
                    ],
                  },
                ]}
              >
                {card}
              </Animated.View>
            )
          })}
        </View>
      </Animated.ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    minWidth: 0,
  },
  scrollRegion: {
    width: '100%',
    minWidth: 0,
  },
  track: {
    position: 'relative',
    minHeight: 1,
  },
  card: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
})
