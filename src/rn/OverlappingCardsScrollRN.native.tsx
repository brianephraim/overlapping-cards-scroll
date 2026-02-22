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
import type { ReactElement } from 'react'
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native'

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)
const PAGE_DOT_POSITIONS = new Set(['above', 'below', 'overlay'])

const normalizePageDotsPosition = (value) =>
  PAGE_DOT_POSITIONS.has(value) ? value : 'below'

const resolveCardXAtProgress = (index, progress, layout) => {
  const principalIndex = Math.floor(progress)
  const transitionProgress = progress - principalIndex

  if (index <= principalIndex) {
    return index * layout.peek
  }

  let cardX =
    principalIndex * layout.peek +
    layout.cardWidth +
    (index - principalIndex - 1) * layout.peek

  if (index === principalIndex + 1) {
    cardX -= transitionProgress * (layout.cardWidth - layout.peek)
  }

  return cardX
}

const OverlappingCardsScrollRNControllerContext = createContext(null)
const OverlappingCardsScrollRNCardIndexContext = createContext(null)

function useOverlappingCardsScrollRNCardControl() {
  const controller = useContext(OverlappingCardsScrollRNControllerContext)
  const cardIndex = useContext(OverlappingCardsScrollRNCardIndexContext)

  const canFocus = controller !== null && cardIndex !== null
  const focusCard = useCallback(
    (options: { animated?: boolean; transitionMode?: string; duration?: number } = {}) => {
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
  style = undefined,
  textStyle = undefined,
  transitionMode = 'swoop',
  onPress = undefined,
  ...pressableProps
}) {
  const { canFocus, focusCard } = useOverlappingCardsScrollRNCardControl()

  const handlePress = (event) => {
    onPress?.(event)
    focusCard({ animated: true, transitionMode })
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
  style = undefined,
  cardHeight = 300,
  cardWidth = undefined,
  cardWidthRatio = 1 / 3,
  basePeek = 64,
  minPeek = 10,
  maxPeek = 84,
  showsHorizontalScrollIndicator = true,
  snapToCardOnRelease = true,
  showPageDots = false,
  pageDotsPosition = 'below',
  pageDotsOffset = 10,
  focusTransitionDuration = 420,
}) {
  const cards = useMemo(() => Children.toArray(children) as ReactElement[], [children])
  const cardCount = cards.length

  const scrollRef = useRef(null)
  const scrollX = useRef(new Animated.Value(0)).current
  const scrollXValueRef = useRef(0)
  const focusTransitionProgress = useRef(new Animated.Value(1)).current
  const focusTransitionAnimationRef = useRef(null)
  const focusTransitionIdRef = useRef(0)

  const [viewportWidth, setViewportWidth] = useState(1)
  const [focusTransition, setFocusTransition] = useState(null)

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

  const stopFocusTransitionAnimation = useCallback(() => {
    if (focusTransitionAnimationRef.current) {
      focusTransitionAnimationRef.current.stop()
      focusTransitionAnimationRef.current = null
    }
    focusTransitionProgress.stopAnimation()
  }, [focusTransitionProgress])

  const cancelFocusTransition = useCallback(() => {
    focusTransitionIdRef.current += 1
    stopFocusTransitionAnimation()
    setFocusTransition(null)
  }, [stopFocusTransitionAnimation])

  useEffect(() => {
    const id = scrollX.addListener(({ value }) => {
      scrollXValueRef.current = value
    })

    return () => {
      scrollX.removeListener(id)
    }
  }, [scrollX])

  useEffect(() => () => stopFocusTransitionAnimation(), [stopFocusTransitionAnimation])

  useEffect(() => {
    if (cardCount > 1) {
      return
    }

    cancelFocusTransition()
  }, [cancelFocusTransition, cardCount])

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
    (
      targetIndex: number,
      options: { animated?: boolean; transitionMode?: string; duration?: number } = {},
    ) => {
      const scrollElement = scrollRef.current
      if (!scrollElement || cardCount === 0) {
        return
      }

      const safeIndex = clamp(Math.round(targetIndex), 0, cardCount - 1)
      const nextScrollLeft = clamp(safeIndex * layout.stepDistance, 0, layout.scrollRange)
      const transitionMode = options.transitionMode ?? 'swoop'

      if (transitionMode === 'swoop' && cardCount > 1) {
        const fromProgress = clamp(
          scrollXValueRef.current / layout.stepDistance,
          0,
          cardCount - 1,
        )
        const toProgress = safeIndex
        const duration = Number.isFinite(options.duration)
          ? Math.max(0, options.duration)
          : focusTransitionDuration

        stopFocusTransitionAnimation()
        const transitionId = focusTransitionIdRef.current + 1
        focusTransitionIdRef.current = transitionId
        focusTransitionProgress.setValue(0)
        setFocusTransition({ fromProgress, toProgress })

        if (duration <= 0 || Math.abs(toProgress - fromProgress) < 0.001) {
          setFocusTransition(null)
          focusTransitionProgress.setValue(1)
          scrollElement.scrollTo({
            x: nextScrollLeft,
            y: 0,
            animated: false,
          })
          scrollX.setValue(nextScrollLeft)
          scrollXValueRef.current = nextScrollLeft
          return
        }

        focusTransitionAnimationRef.current = Animated.timing(focusTransitionProgress, {
          toValue: 1,
          duration,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        })

        focusTransitionAnimationRef.current.start(({ finished }) => {
          if (!finished || focusTransitionIdRef.current !== transitionId) {
            return
          }
          focusTransitionAnimationRef.current = null
          scrollElement.scrollTo({
            x: nextScrollLeft,
            y: 0,
            animated: false,
          })
          scrollX.setValue(nextScrollLeft)
          scrollXValueRef.current = nextScrollLeft
          focusTransitionProgress.setValue(1)
          setFocusTransition(null)
        })
        return
      }

      cancelFocusTransition()
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
    [
      cancelFocusTransition,
      cardCount,
      focusTransitionDuration,
      focusTransitionProgress,
      layout.scrollRange,
      layout.stepDistance,
      scrollX,
      stopFocusTransitionAnimation,
    ],
  )

  const controllerContextValue = useMemo(
    () => ({
      focusCard,
    }),
    [focusCard],
  )

  const shouldSnapToCard =
    snapToCardOnRelease && Platform.OS === 'ios' && cardCount > 1 && layout.stepDistance > 1
  const resolvedPageDotsPosition = normalizePageDotsPosition(pageDotsPosition)
  const showNavigationDots = showPageDots && cardCount > 1
  const dotScrollX = useMemo(() => {
    if (!focusTransition) {
      return scrollX
    }

    const fromX = focusTransition.fromProgress * layout.stepDistance
    const toX = focusTransition.toProgress * layout.stepDistance

    return focusTransitionProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [fromX, toX],
      extrapolate: 'clamp',
    })
  }, [focusTransition, focusTransitionProgress, layout.stepDistance, scrollX])

  const renderPageDots = (placement) => {
    if (!showNavigationDots || resolvedPageDotsPosition !== placement) {
      return null
    }

    const rowStyle =
      placement === 'above'
        ? [styles.pageDotsRow, { marginBottom: pageDotsOffset }]
        : placement === 'below'
          ? [styles.pageDotsRow, { marginTop: pageDotsOffset }]
          : [styles.pageDotsRow, styles.pageDotsOverlay, { bottom: pageDotsOffset }]

    return (
      <View
        pointerEvents={placement === 'overlay' ? 'box-none' : 'auto'}
        style={rowStyle}
      >
        {cards.map((_, index) => {
          const inputRange = [
            (index - 1) * layout.stepDistance,
            index * layout.stepDistance,
            (index + 1) * layout.stepDistance,
          ]
          const opacity = dotScrollX.interpolate({
            inputRange,
            outputRange: [0.25, 1, 0.25],
            extrapolate: 'clamp',
          })
          const scale = dotScrollX.interpolate({
            inputRange,
            outputRange: [0.9, 1.12, 0.9],
            extrapolate: 'clamp',
          })

          return (
            <Pressable
              key={`rn-ocs-page-dot-${placement}-${index}`}
              accessibilityLabel={`Go to card ${index + 1}`}
              onPress={() => focusCard(index, { animated: true, transitionMode: 'swoop' })}
              style={styles.pageDotPressable}
            >
              <Animated.View style={[styles.pageDot, { opacity, transform: [{ scale }] }]} />
            </Pressable>
          )
        })}
      </View>
    )
  }

  return (
    <OverlappingCardsScrollRNControllerContext.Provider value={controllerContextValue}>
      <View style={[styles.shell, style]}>
        {renderPageDots('above')}
        <View
          style={[styles.root, { height: cardHeight }]}
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
            onScrollBeginDrag={cancelFocusTransition}
            onMomentumScrollBegin={cancelFocusTransition}
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

                const cardXDuringNormalScroll =
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

                const cardXDuringFocusTransition = focusTransition
                  ? focusTransitionProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [
                        resolveCardXAtProgress(index, focusTransition.fromProgress, layout),
                        resolveCardXAtProgress(index, focusTransition.toProgress, layout),
                      ],
                      extrapolate: 'clamp',
                    })
                  : null

                const animatedCardX = cardXDuringFocusTransition ?? cardXDuringNormalScroll

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
          {renderPageDots('overlay')}
        </View>
        {renderPageDots('below')}
      </View>
    </OverlappingCardsScrollRNControllerContext.Provider>
  )
}

const styles = StyleSheet.create({
  shell: {
    width: '100%',
    minWidth: 0,
  },
  root: {
    width: '100%',
    minWidth: 0,
    position: 'relative',
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
  pageDotsRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 6,
  },
  pageDotsOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  pageDotPressable: {
    width: 16,
    height: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#1f4666',
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
