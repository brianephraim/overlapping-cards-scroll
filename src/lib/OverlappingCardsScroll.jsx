import { Children, useEffect, useMemo, useRef, useState } from 'react'
import './OverlappingCardsScroll.css'

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const toCssDimension = (value) => (typeof value === 'number' ? `${value}px` : value)

export function OverlappingCardsScroll({
  children,
  className = '',
  cardHeight = 300,
  cardWidthRatio = 1 / 3,
  basePeek = 64,
  minPeek = 10,
  maxPeek = 84,
  ariaLabel = 'Overlapping cards scroll',
}) {
  const cards = useMemo(() => Children.toArray(children), [children])
  const cardCount = cards.length

  const containerRef = useRef(null)
  const scrollRef = useRef(null)

  const [viewportWidth, setViewportWidth] = useState(1)
  const [scrollLeft, setScrollLeft] = useState(0)

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

  const layout = useMemo(() => {
    const safeWidth = Math.max(1, viewportWidth)
    const safeRatio = clamp(cardWidthRatio, 0.2, 0.95)
    const width = safeWidth * safeRatio

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
  }, [basePeek, cardCount, cardWidthRatio, maxPeek, minPeek, viewportWidth])

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

  const containerClassName = className
    ? `overlapping-cards-scroll ${className}`
    : 'overlapping-cards-scroll'

  return (
    <section className={containerClassName} aria-label={ariaLabel} ref={containerRef}>
      <div
        className="ocs-stage"
        style={{
          height: toCssDimension(cardHeight),
        }}
      >
        <div
          className="ocs-track"
          style={{
            height: toCssDimension(cardHeight),
          }}
        >
          {cards.map((card, index) => {
            let cardX

            if (index <= activeIndex) {
              cardX = index * layout.peek
            } else {
              cardX =
                activeIndex * layout.peek +
                layout.cardWidth +
                (index - activeIndex - 1) * layout.peek
            }

            if (index === activeIndex + 1) {
              cardX -= transitionProgress * (layout.cardWidth - layout.peek)
            }

            return (
              <div
                key={card.key ?? `ocs-card-${index}`}
                className="ocs-card"
                style={{
                  width: `${layout.cardWidth}px`,
                  height: toCssDimension(cardHeight),
                  transform: `translate3d(${cardX}px, 0, 0)`,
                }}
              >
                {card}
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
    </section>
  )
}
