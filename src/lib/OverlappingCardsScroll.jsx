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
import './OverlappingCardsScroll.css'

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const toCssDimension = (value) => (typeof value === 'number' ? `${value}px` : value)
const PAGE_DOT_POSITIONS = new Set(['above', 'below', 'overlay'])

const normalizePageDotsPosition = (value) =>
  PAGE_DOT_POSITIONS.has(value) ? value : 'below'

const resolveCardX = (index, principalIndex, transitionProgress, layout) => {
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

const OverlappingCardsScrollControllerContext = createContext(null)
const OverlappingCardsScrollCardIndexContext = createContext(null)

function useOverlappingCardsScrollCardControl() {
  const controller = useContext(OverlappingCardsScrollControllerContext)
  const cardIndex = useContext(OverlappingCardsScrollCardIndexContext)

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

export function OverlappingCardsScrollFocusTrigger({
  children = 'Make principal',
  className = '',
  behavior = 'smooth',
  transitionMode = 'swoop',
  onClick,
  ...buttonProps
}) {
  const { canFocus, focusCard } = useOverlappingCardsScrollCardControl()

  const handleClick = (event) => {
    onClick?.(event)

    if (!event.defaultPrevented) {
      focusCard({ behavior, transitionMode })
    }
  }

  const buttonClassName = className
    ? `ocs-focus-trigger ${className}`
    : 'ocs-focus-trigger'

  return (
    <button type="button" className={buttonClassName} disabled={!canFocus} onClick={handleClick} {...buttonProps}>
      {children}
    </button>
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

export function OverlappingCardsScroll({
  children,
  className = '',
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
  pageDotsClassName = '',
  snapToCardOnRelease = true,
  snapReleaseDelay = 800,
  focusTransitionDuration = 420,
  ariaLabel = 'Overlapping cards scroll',
}) {
  const cards = useMemo(() => Children.toArray(children), [children])
  const cardCount = cards.length

  const containerRef = useRef(null)
  const scrollRef = useRef(null)
  const touchStateRef = useRef(null)
  const snapTimeoutRef = useRef(null)
  const shouldSnapOnMouseMoveRef = useRef(false)
  const focusTransitionTimeoutRef = useRef(null)

  const [viewportWidth, setViewportWidth] = useState(1)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [focusTransition, setFocusTransition] = useState(null)

  const clearSnapTimeout = useCallback(() => {
    if (snapTimeoutRef.current !== null) {
      clearTimeout(snapTimeoutRef.current)
      snapTimeoutRef.current = null
    }
  }, [])

  const clearFocusTransitionTimeout = useCallback(() => {
    if (focusTransitionTimeoutRef.current !== null) {
      clearTimeout(focusTransitionTimeoutRef.current)
      focusTransitionTimeoutRef.current = null
    }
  }, [])

  const cancelFocusTransition = useCallback(() => {
    clearFocusTransitionTimeout()
    setFocusTransition(null)
  }, [clearFocusTransitionTimeout])

  useEffect(() => {
    const containerElement = containerRef.current
    const scrollElement = scrollRef.current
    if (!containerElement || !scrollElement) {
      return undefined
    }

    const syncScroll = () => {
      setScrollLeft(scrollElement.scrollLeft)
    }

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      const width = entry?.contentRect?.width ?? 1
      setViewportWidth(Math.max(1, width))
      syncScroll()
    })

    resizeObserver.observe(containerElement)
    setViewportWidth(Math.max(1, containerElement.getBoundingClientRect().width || 1))
    syncScroll()

    scrollElement.addEventListener('scroll', syncScroll, { passive: true })

    return () => {
      resizeObserver.disconnect()
      scrollElement.removeEventListener('scroll', syncScroll)
    }
  }, [])

  useEffect(() => () => clearSnapTimeout(), [clearSnapTimeout])
  useEffect(() => () => clearFocusTransitionTimeout(), [clearFocusTransitionTimeout])

  useEffect(() => {
    if (snapToCardOnRelease && cardCount > 1) {
      return
    }

    clearSnapTimeout()
    shouldSnapOnMouseMoveRef.current = false
    cancelFocusTransition()
  }, [cancelFocusTransition, cardCount, clearSnapTimeout, snapToCardOnRelease])

  useEffect(() => {
    if (cardCount > 1) {
      return
    }

    cancelFocusTransition()
  }, [cancelFocusTransition, cardCount])

  const layout = useMemo(() => {
    const safeWidth = Math.max(1, viewportWidth)
    const safeRatio = clamp(cardWidthRatio, 0.2, 0.95)
    const width = Math.max(1, resolveCardWidth(cardWidth, safeWidth, safeRatio))

    if (cardCount < 2) {
      return {
        cardWidth: width,
        peek: 0,
        stepDistance: 1,
        scrollRange: 0,
        trackWidth: safeWidth,
      }
    }

    const availableStackWidth = Math.max(0, safeWidth - width)
    const maxVisiblePeek = availableStackWidth / (cardCount - 1)
    const preferredPeek = clamp(basePeek, minPeek, maxPeek)
    const peek = Math.min(preferredPeek, maxVisiblePeek)

    const stepDistance = Math.max(1, width - peek)
    const scrollRange = stepDistance * (cardCount - 1)
    const trackWidth = safeWidth + scrollRange

    return {
      cardWidth: width,
      peek,
      stepDistance,
      scrollRange,
      trackWidth,
    }
  }, [basePeek, cardCount, cardWidth, cardWidthRatio, maxPeek, minPeek, viewportWidth])

  useEffect(() => {
    const scrollElement = scrollRef.current
    if (!scrollElement) {
      return
    }

    if (scrollElement.scrollLeft > layout.scrollRange) {
      scrollElement.scrollLeft = layout.scrollRange
      setScrollLeft(layout.scrollRange)
    }
  }, [layout.scrollRange])

  const progress = cardCount > 1 ? clamp(scrollLeft / layout.stepDistance, 0, cardCount - 1) : 0
  const activeIndex = Math.floor(progress)
  const transitionProgress = progress - activeIndex

  const snapToNearestCard = useCallback(
    (options = {}) => {
      if (!snapToCardOnRelease || cardCount < 2) {
        return
      }

      const scrollElement = scrollRef.current
      if (!scrollElement) {
        return
      }

      const currentScrollLeft = clamp(scrollElement.scrollLeft, 0, layout.scrollRange)
      const nearestIndex = clamp(
        Math.round(currentScrollLeft / layout.stepDistance),
        0,
        cardCount - 1,
      )
      const targetScrollLeft = clamp(
        nearestIndex * layout.stepDistance,
        0,
        layout.scrollRange,
      )

      if (Math.abs(targetScrollLeft - currentScrollLeft) < 1) {
        return
      }

      const behavior = options.behavior ?? 'smooth'
      if (typeof scrollElement.scrollTo === 'function') {
        scrollElement.scrollTo({
          left: targetScrollLeft,
          behavior,
        })
      } else {
        scrollElement.scrollLeft = targetScrollLeft
      }

      if (behavior === 'auto') {
        setScrollLeft(targetScrollLeft)
      }
    },
    [cardCount, layout.scrollRange, layout.stepDistance, snapToCardOnRelease],
  )

  const scheduleSnapToNearestCard = useCallback(
    (delay = snapReleaseDelay) => {
      if (!snapToCardOnRelease || cardCount < 2) {
        return
      }

      const safeDelay = Number.isFinite(delay) ? Math.max(0, delay) : 800
      clearSnapTimeout()
      snapTimeoutRef.current = setTimeout(() => {
        snapTimeoutRef.current = null
        shouldSnapOnMouseMoveRef.current = false
        snapToNearestCard({ behavior: 'smooth' })
      }, safeDelay)
    },
    [cardCount, clearSnapTimeout, snapReleaseDelay, snapToCardOnRelease, snapToNearestCard],
  )

  const markSnapCandidateFromScroll = useCallback(() => {
    if (!snapToCardOnRelease || cardCount < 2) {
      return
    }

    shouldSnapOnMouseMoveRef.current = true
    scheduleSnapToNearestCard()
  }, [cardCount, scheduleSnapToNearestCard, snapToCardOnRelease])

  useEffect(() => {
    if (typeof window === 'undefined' || !snapToCardOnRelease || cardCount < 2) {
      return undefined
    }

    const handleMouseMove = () => {
      if (!shouldSnapOnMouseMoveRef.current) {
        return
      }

      shouldSnapOnMouseMoveRef.current = false
      clearSnapTimeout()
      snapToNearestCard({ behavior: 'smooth' })
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [cardCount, clearSnapTimeout, snapToCardOnRelease, snapToNearestCard])

  const focusCard = useCallback(
    (targetIndex, options = {}) => {
      const scrollElement = scrollRef.current
      if (!scrollElement || cardCount === 0) {
        return
      }

      clearSnapTimeout()
      shouldSnapOnMouseMoveRef.current = false
      cancelFocusTransition()

      const safeIndex = clamp(Math.round(targetIndex), 0, cardCount - 1)
      const nextScrollLeft = clamp(safeIndex * layout.stepDistance, 0, layout.scrollRange)
      const transitionMode = options.transitionMode ?? 'swoop'

      if (transitionMode === 'swoop') {
        const duration = Number.isFinite(options.duration)
          ? Math.max(0, options.duration)
          : focusTransitionDuration

        clearFocusTransitionTimeout()
        setFocusTransition({ duration })

        scrollElement.scrollLeft = nextScrollLeft
        setScrollLeft(nextScrollLeft)

        if (duration <= 0) {
          setFocusTransition(null)
          return
        }

        focusTransitionTimeoutRef.current = setTimeout(() => {
          focusTransitionTimeoutRef.current = null
          setFocusTransition(null)
        }, duration + 40)
        return
      }

      if (typeof scrollElement.scrollTo === 'function') {
        scrollElement.scrollTo({
          left: nextScrollLeft,
          behavior: options.behavior ?? 'smooth',
        })
      } else {
        scrollElement.scrollLeft = nextScrollLeft
      }

      if ((options.behavior ?? 'smooth') === 'auto') {
        setScrollLeft(nextScrollLeft)
      }
    },
    [
      cardCount,
      cancelFocusTransition,
      clearFocusTransitionTimeout,
      clearSnapTimeout,
      focusTransitionDuration,
      layout.scrollRange,
      layout.stepDistance,
    ],
  )

  const controllerContextValue = useMemo(
    () => ({
      focusCard,
    }),
    [focusCard],
  )

  const setControllerScroll = (nextValue) => {
    const scrollElement = scrollRef.current
    if (!scrollElement) {
      return
    }

    const nextScrollLeft = clamp(nextValue, 0, layout.scrollRange)
    if (scrollElement.scrollLeft !== nextScrollLeft) {
      scrollElement.scrollLeft = nextScrollLeft
    }
    setScrollLeft(nextScrollLeft)
  }

  const applyScrollDelta = (delta) => {
    const scrollElement = scrollRef.current
    if (!scrollElement) {
      return
    }

    setControllerScroll(scrollElement.scrollLeft + delta)
  }

  const handleWheel = (event) => {
    if (cardCount < 2) {
      return
    }

    const delta =
      Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY

    if (delta === 0) {
      return
    }

    event.preventDefault()
    cancelFocusTransition()
    applyScrollDelta(delta)
    markSnapCandidateFromScroll()
  }

  const handleTouchStart = (event) => {
    if (cardCount < 2) {
      return
    }

    const scrollElement = scrollRef.current
    const touch = event.touches[0]
    if (!scrollElement || !touch) {
      return
    }

    cancelFocusTransition()

    touchStateRef.current = {
      startX: touch.clientX,
      startScrollLeft: scrollElement.scrollLeft,
    }
  }

  const handleTouchMove = (event) => {
    const touchState = touchStateRef.current
    const touch = event.touches[0]
    if (!touchState || !touch) {
      return
    }

    const delta = touchState.startX - touch.clientX
    if (Math.abs(delta) < 2) {
      return
    }

    event.preventDefault()
    setControllerScroll(touchState.startScrollLeft + delta)
    markSnapCandidateFromScroll()
  }

  const handleTouchEnd = () => {
    if (touchStateRef.current && snapToCardOnRelease && cardCount > 1) {
      scheduleSnapToNearestCard(80)
    }
    touchStateRef.current = null
  }

  const containerClassName = className
    ? `overlapping-cards-scroll ${className}`
    : 'overlapping-cards-scroll'
  const resolvedPageDotsPosition = normalizePageDotsPosition(pageDotsPosition)
  const showNavigationDots = showPageDots && cardCount > 1

  return (
    <OverlappingCardsScrollControllerContext.Provider value={controllerContextValue}>
      <section className={containerClassName} aria-label={ariaLabel} ref={containerRef}>
        {showNavigationDots && resolvedPageDotsPosition === 'above' ? (
          <nav
            className={
              pageDotsClassName
                ? `ocs-page-dots ocs-page-dots--above ${pageDotsClassName}`
                : 'ocs-page-dots ocs-page-dots--above'
            }
            style={{ marginBottom: toCssDimension(pageDotsOffset) }}
            aria-label="Card pages"
          >
            {cards.map((_, index) => {
              const influence = clamp(1 - Math.abs(progress - index), 0, 1)
              const opacity = 0.25 + influence * 0.75
              const scale = 0.9 + influence * 0.22

              return (
                <button
                  key={`ocs-page-dot-above-${index}`}
                  type="button"
                  className="ocs-page-dot"
                  aria-label={`Go to card ${index + 1}`}
                  aria-current={influence > 0.98 ? 'page' : undefined}
                  onClick={() =>
                    focusCard(index, {
                      behavior: pageDotsBehavior,
                      transitionMode: 'swoop',
                    })
                  }
                  style={{ opacity, transform: `scale(${scale})` }}
                />
              )
            })}
          </nav>
        ) : null}
        <div className="ocs-stage-frame">
          <div
            className="ocs-stage"
            style={{
              height: toCssDimension(cardHeight),
            }}
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
          >
            <div
              className="ocs-track"
              style={{
                height: toCssDimension(cardHeight),
              }}
            >
              {cards.map((card, index) => {
                const cardX = resolveCardX(index, activeIndex, transitionProgress, layout)

                return (
                  <div
                    key={card.key ?? `ocs-card-${index}`}
                    className={focusTransition ? 'ocs-card ocs-card--focus-transition' : 'ocs-card'}
                    style={{
                      width: `${layout.cardWidth}px`,
                      height: toCssDimension(cardHeight),
                      transform: `translate3d(${cardX}px, 0, 0)`,
                      transitionDuration: focusTransition ? `${focusTransition.duration}ms` : undefined,
                    }}
                  >
                    <OverlappingCardsScrollCardIndexContext.Provider value={index}>
                      {card}
                    </OverlappingCardsScrollCardIndexContext.Provider>
                  </div>
                )
              })}
            </div>
            <div className="ocs-scroll-region" ref={scrollRef}>
              <div
                className="ocs-scroll-spacer"
                style={{
                  width: `${layout.trackWidth}px`,
                  height: toCssDimension(cardHeight),
                }}
              />
            </div>
          </div>
          {showNavigationDots && resolvedPageDotsPosition === 'overlay' ? (
            <nav
              className={
                pageDotsClassName
                  ? `ocs-page-dots ocs-page-dots--overlay ${pageDotsClassName}`
                  : 'ocs-page-dots ocs-page-dots--overlay'
              }
              style={{ bottom: toCssDimension(pageDotsOffset) }}
              aria-label="Card pages"
            >
              {cards.map((_, index) => {
                const influence = clamp(1 - Math.abs(progress - index), 0, 1)
                const opacity = 0.25 + influence * 0.75
                const scale = 0.9 + influence * 0.22

                return (
                  <button
                    key={`ocs-page-dot-overlay-${index}`}
                    type="button"
                    className="ocs-page-dot"
                    aria-label={`Go to card ${index + 1}`}
                    aria-current={influence > 0.98 ? 'page' : undefined}
                    onClick={() =>
                      focusCard(index, {
                        behavior: pageDotsBehavior,
                        transitionMode: 'swoop',
                      })
                    }
                    style={{ opacity, transform: `scale(${scale})` }}
                  />
                )
              })}
            </nav>
          ) : null}
        </div>
        {showNavigationDots && resolvedPageDotsPosition === 'below' ? (
          <nav
            className={
              pageDotsClassName
                ? `ocs-page-dots ocs-page-dots--below ${pageDotsClassName}`
                : 'ocs-page-dots ocs-page-dots--below'
            }
            style={{ marginTop: toCssDimension(pageDotsOffset) }}
            aria-label="Card pages"
          >
            {cards.map((_, index) => {
              const influence = clamp(1 - Math.abs(progress - index), 0, 1)
              const opacity = 0.25 + influence * 0.75
              const scale = 0.9 + influence * 0.22

              return (
                <button
                  key={`ocs-page-dot-below-${index}`}
                  type="button"
                  className="ocs-page-dot"
                  aria-label={`Go to card ${index + 1}`}
                  aria-current={influence > 0.98 ? 'page' : undefined}
                  onClick={() =>
                    focusCard(index, {
                      behavior: pageDotsBehavior,
                      transitionMode: 'swoop',
                    })
                  }
                  style={{ opacity, transform: `scale(${scale})` }}
                />
              )
            })}
          </nav>
        ) : null}
      </section>
    </OverlappingCardsScrollControllerContext.Provider>
  )
}
