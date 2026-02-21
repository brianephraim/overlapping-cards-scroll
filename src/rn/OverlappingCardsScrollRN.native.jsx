import {
  Children,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native'

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const OverlappingCardsScrollRNControllerContext = createContext(null)
const OverlappingCardsScrollRNCardIndexContext = createContext(null)

function useOverlappingCardsScrollRNCardControl() {
  const controller = useContext(OverlappingCardsScrollRNControllerContext)
  const cardIndex = useContext(OverlappingCardsScrollRNCardIndexContext)

  const canFocus = controller !== null && cardIndex !== null
  const focusCard = useCallback(
    (options) => {
      if (!canFocus) {
        return
      }
      controller.focusCard(cardIndex, options)
    },
    [canFocus, cardIndex, controller],
  )

  return {
    cardIndex,
    canFocus,
    focusCard,
  }
}

export function OverlappingCardsScrollRNFocusTrigger({
  children = 'Make principal',
  style,
  textStyle,
  onPress,
  ...pressableProps
}) {
  const { canFocus, focusCard } = useOverlappingCardsScrollRNCardControl()

  const handlePress = (event) => {
    onPress?.(event)
    focusCard({ animated: true })
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.focusTrigger, pressed && styles.focusTriggerPressed, style]}
      disabled={!canFocus}
      onPress={handlePress}
      {...pressableProps}
    >
      <Text style={[styles.focusTriggerText, textStyle]}>{children}</Text>
    </Pressable>
  )
}

const resolveCardWidth = (cardWidth, viewportWidth, fallbackRatio) => {
  if (typeof cardWidth === 'number' && Number.isFinite(cardWidth) && cardWidth > 0) {
    return cardWidth
  }

  if (typeof cardWidth === 'string') {
    const value = cardWidth.trim()
    if (value.endsWith('%')) {
      const percent = Number.parseFloat(value.slice(0, -1))
      if (Number.isFinite(percent) && percent > 0) {
        return (viewportWidth * percent) / 100
      }
    }

    const numeric = Number.parseFloat(value)
    if (Number.isFinite(numeric) && numeric > 0) {
      return numeric
    }
  }

  return viewportWidth * fallbackRatio
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
  showsHorizontalScrollIndicator = true,
  snapToCardOnRelease = true,
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
    const resolvedCardWidth = Math.max(1, resolveCardWidth(cardWidth, safeWidth, safeRatio))

    if (cardCount < 2) {
      return {
        cardWidth: resolvedCardWidth,
        peek: 0,
        stepDistance: 1,
        scrollRange: 0,
        trackWidth: safeWidth,
      }
    }

    const availableStackWidth = Math.max(0, safeWidth - resolvedCardWidth)
    const preferredPeek = clamp(basePeek, minPeek, maxPeek)
    const maxVisiblePeek = availableStackWidth / (cardCount - 1)
    const peek = Math.min(preferredPeek, maxVisiblePeek)

    const stepDistance = Math.max(1, resolvedCardWidth - peek)
    const scrollRange = stepDistance * (cardCount - 1)

    return {
      cardWidth: resolvedCardWidth,
      peek,
      stepDistance,
      scrollRange,
      trackWidth: safeWidth + scrollRange,
    }
  }, [basePeek, cardCount, cardWidth, cardWidthRatio, maxPeek, minPeek, viewportWidth])

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
        useNativeDriver: true,
      }),
    [scrollX],
  )

  const focusCard = useCallback(
    (targetIndex, options = {}) => {
      const scrollElement = scrollRef.current
      if (!scrollElement || cardCount === 0) {
        return
      }

      const safeIndex = clamp(Math.round(targetIndex), 0, cardCount - 1)
      const nextScrollLeft = clamp(safeIndex * layout.stepDistance, 0, layout.scrollRange)

      scrollElement.scrollTo({
        x: nextScrollLeft,
        y: 0,
        animated: options.animated ?? true,
      })

      if ((options.animated ?? true) === false) {
        scrollX.setValue(nextScrollLeft)
        scrollXValueRef.current = nextScrollLeft
      }
    },
    [cardCount, layout.scrollRange, layout.stepDistance, scrollX],
  )

  const controllerContextValue = useMemo(
    () => ({
      focusCard,
    }),
    [focusCard],
  )

  const shouldSnapToCard =
    snapToCardOnRelease && Platform.OS === 'ios' && cardCount > 1 && layout.stepDistance > 1

  return (
    <OverlappingCardsScrollRNControllerContext.Provider value={controllerContextValue}>
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
          snapToInterval={shouldSnapToCard ? layout.stepDistance : undefined}
          snapToAlignment={shouldSnapToCard ? 'start' : undefined}
          decelerationRate={shouldSnapToCard ? 'fast' : 'normal'}
          disableIntervalMomentum={shouldSnapToCard}
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
                  <OverlappingCardsScrollRNCardIndexContext.Provider value={index}>
                    {card}
                  </OverlappingCardsScrollRNCardIndexContext.Provider>
                </Animated.View>
              )
            })}
          </View>
        </Animated.ScrollView>
      </View>
    </OverlappingCardsScrollRNControllerContext.Provider>
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
  focusTrigger: {
    alignSelf: 'flex-start',
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(30, 67, 99, 0.25)',
    backgroundColor: '#f3f8ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 6,
  },
  focusTriggerPressed: {
    opacity: 0.85,
  },
  focusTriggerText: {
    color: '#1f4666',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
})
