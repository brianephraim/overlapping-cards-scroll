import {
  Children,
  Fragment,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type React from "react";
import type {
  ComponentProps,
  ComponentType,
  CSSProperties,
  ReactElement,
  ReactNode,
} from "react";
import "./OverlappingCardsScroll.css";

export interface CardItem {
  name: string;
  id: string | number;
  jsx: ReactElement;
}

export type TabsPositionSide = "top" | "bottom" | "left" | "right";
export type TabsPositionAlign = "start" | "center" | "end";

export type TabsPosition =
  | "top-left" | "top-center" | "top-right"
  | "bottom-left" | "bottom-center" | "bottom-right"
  | "left-top" | "left-center" | "left-bottom"
  | "right-top" | "right-center" | "right-bottom"
  | "above" | "below";

export interface OverlappingCardsScrollTabProps {
  name: string;
  index: number;
  position: TabsPositionSide;
  align: TabsPositionAlign;
  isPrincipal: boolean;
  influence: number;
  animate: { opacity: number };
  className: string;
  style: CSSProperties;
  ariaLabel: string;
  ariaCurrent?: "page";
  onClick: () => void;
}

export interface OverlappingCardsScrollTabsContainerProps {
  children: ReactNode;
  position: TabsPositionSide;
  align: TabsPositionAlign;
  className: string;
  style: CSSProperties;
  ariaLabel: string;
  cardNames: string[];
  activeIndex: number;
  progress: number;
}

type SharedProps = {
  className?: string;
  cardHeight?: number | string;
  cardWidth?: number | string;
  cardWidthRatio?: number;
  basePeek?: number;
  minPeek?: number;
  maxPeek?: number;
  showPageDots?: boolean;
  pageDotsPosition?: "above" | "below" | "overlay";
  pageDotsOffset?: number | string;
  pageDotsBehavior?: "smooth" | "auto";
  pageDotsClassName?: string;
  cardContainerClassName?: string;
  cardContainerStyle?: CSSProperties;
  snapToCardOnRelease?: boolean;
  snapReleaseDelay?: number;
  focusTransitionDuration?: number;
  ariaLabel?: string;
  showTabs?: boolean;
  tabsPosition?: TabsPosition;
  tabsOffset?: number | string;
  tabsBehavior?: "smooth" | "auto";
  tabsClassName?: string;
  tabsComponent?: ComponentType<OverlappingCardsScrollTabProps>;
  tabsContainerComponent?: ComponentType<OverlappingCardsScrollTabsContainerProps>;
};

type WithChildren = SharedProps & {
  children: ReactNode;
  items?: never;
};

type WithItems = SharedProps & {
  items: CardItem[];
  children?: never;
};

type OverlappingCardsScrollProps = WithChildren | WithItems;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const toCssDimension = (value) =>
  typeof value === "number" ? `${value}px` : value;
const PAGE_DOT_POSITIONS = new Set(["above", "below", "overlay"]);

const normalizePageDotsPosition = (value) =>
  PAGE_DOT_POSITIONS.has(value) ? value : "below";

interface ParsedTabsPosition {
  side: TabsPositionSide;
  align: TabsPositionAlign;
  orientation: "horizontal" | "vertical";
}

const TABS_POSITION_MAP: Record<string, ParsedTabsPosition> = {
  "top-left":      { side: "top",    align: "start",  orientation: "horizontal" },
  "top-center":    { side: "top",    align: "center", orientation: "horizontal" },
  "top-right":     { side: "top",    align: "end",    orientation: "horizontal" },
  "bottom-left":   { side: "bottom", align: "start",  orientation: "horizontal" },
  "bottom-center": { side: "bottom", align: "center", orientation: "horizontal" },
  "bottom-right":  { side: "bottom", align: "end",    orientation: "horizontal" },
  "left-top":      { side: "left",   align: "start",  orientation: "vertical" },
  "left-center":   { side: "left",   align: "center", orientation: "vertical" },
  "left-bottom":   { side: "left",   align: "end",    orientation: "vertical" },
  "right-top":     { side: "right",  align: "start",  orientation: "vertical" },
  "right-center":  { side: "right",  align: "center", orientation: "vertical" },
  "right-bottom":  { side: "right",  align: "end",    orientation: "vertical" },
  "above":         { side: "top",    align: "center", orientation: "horizontal" },
  "below":         { side: "bottom", align: "center", orientation: "horizontal" },
};

const DEFAULT_TABS_POSITION: ParsedTabsPosition = { side: "top", align: "center", orientation: "horizontal" };

const parseTabsPosition = (value: string | undefined): ParsedTabsPosition =>
  (value && TABS_POSITION_MAP[value]) || DEFAULT_TABS_POSITION;

// Persist across HMR so remount gets a valid fallback instead of 1
let lastKnownViewportWidth = 1;

function DefaultTabsContainerComponent({
  children,
  className,
  style,
  ariaLabel,
}: OverlappingCardsScrollTabsContainerProps) {
  return (
    <nav className={className} style={style} aria-label={ariaLabel}>
      {children}
    </nav>
  );
}

function DefaultTabsComponent({
  name,
  className,
  style,
  ariaLabel,
  ariaCurrent,
  onClick,
}: OverlappingCardsScrollTabProps) {
  return (
    <button
      type="button"
      className={className}
      aria-label={ariaLabel}
      aria-current={ariaCurrent}
      onClick={onClick}
      style={style}
    >
      {name}
    </button>
  );
}

const resolveCardX = (index, principalIndex, transitionProgress, layout) => {
  if (index <= principalIndex) {
    return index * layout.peek;
  }

  let cardX =
    principalIndex * layout.peek +
    layout.cardWidth +
    (index - principalIndex - 1) * layout.peek;

  if (index === principalIndex + 1) {
    cardX -= transitionProgress * (layout.cardWidth - layout.peek);
  }

  return cardX;
};

const OverlappingCardsScrollControllerContext = createContext(null);
const OverlappingCardsScrollCardIndexContext = createContext(null);

function useOverlappingCardsScrollCardControl() {
  const controller = useContext(OverlappingCardsScrollControllerContext);
  const cardIndex = useContext(OverlappingCardsScrollCardIndexContext);

  const canFocus = controller !== null && cardIndex !== null;
  const focusCard = useCallback(
    (
      options: {
        behavior?: string;
        transitionMode?: string;
        duration?: number;
      } = {},
    ) => {
      if (!canFocus) {
        return;
      }
      controller.focusCard(cardIndex, options);
    },
    [canFocus, cardIndex, controller],
  );

  return {
    cardIndex,
    canFocus,
    focusCard,
  };
}

export interface OverlappingCardsScrollFocusTriggerProps extends Omit<
  ComponentProps<"button">,
  "onClick"
> {
  children?: ReactNode;
  className?: string;
  behavior?: "smooth" | "auto";
  transitionMode?: "swoop" | "instant";
  onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

export function OverlappingCardsScrollFocusTrigger({
  children = "Make principal",
  className = "",
  behavior = "smooth",
  transitionMode = "swoop",
  onClick = undefined,
  ...buttonProps
}: OverlappingCardsScrollFocusTriggerProps) {
  const { canFocus, focusCard } = useOverlappingCardsScrollCardControl();

  const handleClick = (event) => {
    onClick?.(event);

    if (!event.defaultPrevented) {
      focusCard({ behavior, transitionMode });
    }
  };

  const buttonClassName = className
    ? `ocs-focus-trigger ${className}`
    : "ocs-focus-trigger";

  return (
    <button
      type="button"
      className={buttonClassName}
      disabled={!canFocus}
      onClick={handleClick}
      {...buttonProps}
    >
      {children}
    </button>
  );
}

const resolveCardWidth = (cardWidth, viewportWidth, fallbackRatio) => {
  if (
    typeof cardWidth === "number" &&
    Number.isFinite(cardWidth) &&
    cardWidth > 0
  ) {
    return cardWidth;
  }

  if (typeof cardWidth === "string") {
    const value = cardWidth.trim();
    if (value.endsWith("%")) {
      const percent = Number.parseFloat(value.slice(0, -1));
      if (Number.isFinite(percent) && percent > 0) {
        return (viewportWidth * percent) / 100;
      }
    }

    const numeric = Number.parseFloat(value);
    if (Number.isFinite(numeric) && numeric > 0) {
      return numeric;
    }
  }

  return viewportWidth * fallbackRatio;
};

export function OverlappingCardsScroll(props: OverlappingCardsScrollProps) {
  const {
    className = "",
    cardHeight = 300,
    cardWidth = undefined,
    cardWidthRatio = 1 / 3,
    basePeek = 64,
    minPeek = 10,
    maxPeek = 84,
    showPageDots = false,
    pageDotsPosition = "below",
    pageDotsOffset = 10,
    pageDotsBehavior = "smooth",
    pageDotsClassName = "",
    cardContainerClassName = "",
    cardContainerStyle = {},
    snapToCardOnRelease = true,
    snapReleaseDelay = 800,
    focusTransitionDuration = 420,
    ariaLabel = "Overlapping cards scroll",
    showTabs = false,
    tabsPosition = "top-center",
    tabsOffset = 10,
    tabsBehavior = "smooth",
    tabsClassName = "",
    tabsComponent: TabsComponent = DefaultTabsComponent,
    tabsContainerComponent:
      TabsContainerComponent = DefaultTabsContainerComponent,
  } = props;

  const hasItems = "items" in props && Array.isArray(props.items);
  const hasChildren = "children" in props && props.children != null;

  useEffect(() => {
    if (hasItems && hasChildren) {
      console.warn(
        "OverlappingCardsScroll: Both `items` and `children` were provided. `items` takes precedence.",
      );
    }
  }, [hasItems, hasChildren]);

  const itemsProp = hasItems ? props.items : null;
  const childrenProp = hasChildren ? props.children : null;

  const cards = useMemo(() => {
    if (itemsProp) {
      return itemsProp.map((item) => (
        <Fragment key={item.id}>{item.jsx}</Fragment>
      ));
    }
    return Children.toArray(childrenProp) as ReactElement[];
  }, [itemsProp, childrenProp]);

  const cardNames: string[] | null = useMemo(() => {
    if (itemsProp) {
      return itemsProp.map((item) => item.name);
    }
    return null;
  }, [itemsProp]);

  const cardCount = cards.length;

  const containerRef = useRef(null);
  const scrollRef = useRef(null);
  const touchStateRef = useRef(null);
  const snapTimeoutRef = useRef(null);
  const shouldSnapOnMouseMoveRef = useRef(false);
  const focusTransitionTimeoutRef = useRef(null);

  const [viewportWidth, setViewportWidth] = useState(lastKnownViewportWidth);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [focusTransition, setFocusTransition] = useState(null);

  const clearSnapTimeout = useCallback(() => {
    if (snapTimeoutRef.current !== null) {
      clearTimeout(snapTimeoutRef.current);
      snapTimeoutRef.current = null;
    }
  }, []);

  const clearFocusTransitionTimeout = useCallback(() => {
    if (focusTransitionTimeoutRef.current !== null) {
      clearTimeout(focusTransitionTimeoutRef.current);
      focusTransitionTimeoutRef.current = null;
    }
  }, []);

  const cancelFocusTransition = useCallback(() => {
    clearFocusTransitionTimeout();
    setFocusTransition(null);
  }, [clearFocusTransitionTimeout]);

  useEffect(() => {
    const containerElement = containerRef.current;
    const scrollElement = scrollRef.current;
    if (!containerElement || !scrollElement) {
      return undefined;
    }

    const syncScroll = () => {
      setScrollLeft(scrollElement.scrollLeft);
    };

    const applyWidth = (width: number) => {
      const w = Math.max(0, width);
      if (w > 10) {
        lastKnownViewportWidth = w;
        setViewportWidth(w);
      }
      // Ignore bogus 0/small values during HMR; keep lastKnownViewportWidth
    };

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      const width = entry?.contentRect?.width ?? 0;
      applyWidth(width);
      syncScroll();
    });

    resizeObserver.observe(containerElement);
    applyWidth(containerElement.getBoundingClientRect().width ?? 0);
    syncScroll();

    scrollElement.addEventListener("scroll", syncScroll, { passive: true });

    return () => {
      resizeObserver.disconnect();
      scrollElement.removeEventListener("scroll", syncScroll);
    };
  }, []);

  useEffect(() => () => clearSnapTimeout(), [clearSnapTimeout]);
  useEffect(
    () => () => clearFocusTransitionTimeout(),
    [clearFocusTransitionTimeout],
  );

  useEffect(() => {
    if (snapToCardOnRelease && cardCount > 1) {
      return;
    }

    clearSnapTimeout();
    shouldSnapOnMouseMoveRef.current = false;
    cancelFocusTransition();
  }, [cancelFocusTransition, cardCount, clearSnapTimeout, snapToCardOnRelease]);

  useEffect(() => {
    if (cardCount > 1) {
      return;
    }

    cancelFocusTransition();
  }, [cancelFocusTransition, cardCount]);

  const layout = useMemo(() => {
    const safeWidth = Math.max(1, viewportWidth);
    const safeRatio = clamp(cardWidthRatio, 0.2, 0.95);
    const width = Math.max(
      1,
      resolveCardWidth(cardWidth, safeWidth, safeRatio),
    );

    if (cardCount < 2) {
      return {
        cardWidth: width,
        peek: 0,
        stepDistance: 1,
        scrollRange: 0,
        trackWidth: safeWidth,
      };
    }

    const availableStackWidth = Math.max(0, safeWidth - width);
    const maxVisiblePeek = availableStackWidth / (cardCount - 1);
    const preferredPeek = clamp(basePeek, minPeek, maxPeek);
    const peek = Math.min(preferredPeek, maxVisiblePeek);

    const stepDistance = Math.max(1, width - peek);
    const scrollRange = stepDistance * (cardCount - 1);
    const trackWidth = safeWidth + scrollRange;

    return {
      cardWidth: width,
      peek,
      stepDistance,
      scrollRange,
      trackWidth,
    };
  }, [
    basePeek,
    cardCount,
    cardWidth,
    cardWidthRatio,
    maxPeek,
    minPeek,
    viewportWidth,
  ]);

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) {
      return;
    }

    if (scrollElement.scrollLeft > layout.scrollRange) {
      scrollElement.scrollLeft = layout.scrollRange;
      setScrollLeft(layout.scrollRange);
    }
  }, [layout.scrollRange]);

  const progress =
    cardCount > 1
      ? clamp(scrollLeft / layout.stepDistance, 0, cardCount - 1)
      : 0;
  const activeIndex = Math.floor(progress);
  const transitionProgress = progress - activeIndex;

  const snapToNearestCard = useCallback(
    (options: { behavior?: string } = {}) => {
      if (!snapToCardOnRelease || cardCount < 2) {
        return;
      }

      const scrollElement = scrollRef.current;
      if (!scrollElement) {
        return;
      }

      const currentScrollLeft = clamp(
        scrollElement.scrollLeft,
        0,
        layout.scrollRange,
      );
      const nearestIndex = clamp(
        Math.round(currentScrollLeft / layout.stepDistance),
        0,
        cardCount - 1,
      );
      const targetScrollLeft = clamp(
        nearestIndex * layout.stepDistance,
        0,
        layout.scrollRange,
      );

      if (Math.abs(targetScrollLeft - currentScrollLeft) < 1) {
        return;
      }

      const behavior = options.behavior ?? "smooth";
      if (typeof scrollElement.scrollTo === "function") {
        scrollElement.scrollTo({
          left: targetScrollLeft,
          behavior: behavior as ScrollBehavior,
        });
      } else {
        scrollElement.scrollLeft = targetScrollLeft;
      }

      if (behavior === "auto") {
        setScrollLeft(targetScrollLeft);
      }
    },
    [cardCount, layout.scrollRange, layout.stepDistance, snapToCardOnRelease],
  );

  const scheduleSnapToNearestCard = useCallback(
    (delay = snapReleaseDelay) => {
      if (!snapToCardOnRelease || cardCount < 2) {
        return;
      }

      const safeDelay = Number.isFinite(delay) ? Math.max(0, delay) : 800;
      clearSnapTimeout();
      snapTimeoutRef.current = setTimeout(() => {
        snapTimeoutRef.current = null;
        shouldSnapOnMouseMoveRef.current = false;
        snapToNearestCard({ behavior: "smooth" });
      }, safeDelay);
    },
    [
      cardCount,
      clearSnapTimeout,
      snapReleaseDelay,
      snapToCardOnRelease,
      snapToNearestCard,
    ],
  );

  const markSnapCandidateFromScroll = useCallback(() => {
    if (!snapToCardOnRelease || cardCount < 2) {
      return;
    }

    shouldSnapOnMouseMoveRef.current = true;
    scheduleSnapToNearestCard();
  }, [cardCount, scheduleSnapToNearestCard, snapToCardOnRelease]);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !snapToCardOnRelease ||
      cardCount < 2
    ) {
      return undefined;
    }

    const handleMouseMove = () => {
      if (!shouldSnapOnMouseMoveRef.current) {
        return;
      }

      shouldSnapOnMouseMoveRef.current = false;
      clearSnapTimeout();
      snapToNearestCard({ behavior: "smooth" });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [cardCount, clearSnapTimeout, snapToCardOnRelease, snapToNearestCard]);

  const focusCard = useCallback(
    (
      targetIndex: number,
      options: {
        behavior?: string;
        transitionMode?: string;
        duration?: number;
      } = {},
    ) => {
      const scrollElement = scrollRef.current;
      if (!scrollElement || cardCount === 0) {
        return;
      }

      clearSnapTimeout();
      shouldSnapOnMouseMoveRef.current = false;
      cancelFocusTransition();

      const safeIndex = clamp(Math.round(targetIndex), 0, cardCount - 1);
      const nextScrollLeft = clamp(
        safeIndex * layout.stepDistance,
        0,
        layout.scrollRange,
      );
      const transitionMode = options.transitionMode ?? "swoop";

      if (transitionMode === "swoop") {
        const duration = Number.isFinite(options.duration)
          ? Math.max(0, options.duration)
          : focusTransitionDuration;

        clearFocusTransitionTimeout();
        setFocusTransition({ duration });

        scrollElement.scrollLeft = nextScrollLeft;
        setScrollLeft(nextScrollLeft);

        if (duration <= 0) {
          setFocusTransition(null);
          return;
        }

        focusTransitionTimeoutRef.current = setTimeout(() => {
          focusTransitionTimeoutRef.current = null;
          setFocusTransition(null);
        }, duration + 40);
        return;
      }

      if (typeof scrollElement.scrollTo === "function") {
        scrollElement.scrollTo({
          left: nextScrollLeft,
          behavior: (options.behavior ?? "smooth") as ScrollBehavior,
        });
      } else {
        scrollElement.scrollLeft = nextScrollLeft;
      }

      if ((options.behavior ?? "smooth") === "auto") {
        setScrollLeft(nextScrollLeft);
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
  );

  const controllerContextValue = useMemo(
    () => ({
      focusCard,
    }),
    [focusCard],
  );

  const setControllerScroll = useCallback(
    (nextValue) => {
      const scrollElement = scrollRef.current;
      if (!scrollElement) {
        return;
      }

      const nextScrollLeft = clamp(nextValue, 0, layout.scrollRange);
      if (scrollElement.scrollLeft !== nextScrollLeft) {
        scrollElement.scrollLeft = nextScrollLeft;
      }
      setScrollLeft(nextScrollLeft);
    },
    [layout.scrollRange],
  );

  const applyScrollDelta = useCallback(
    (delta) => {
      const scrollElement = scrollRef.current;
      if (!scrollElement) {
        return;
      }

      setControllerScroll(scrollElement.scrollLeft + delta);
    },
    [setControllerScroll],
  );

  const handleWheel = useCallback(
    (event: WheelEvent) => {
      if (cardCount < 2) {
        return;
      }

      const absX = Math.abs(event.deltaX);
      const absY = Math.abs(event.deltaY);

      if (absX === 0 && absY === 0) {
        return;
      }

      // Let vertical-dominant scrolls pass through to child scrollables
      if (absY > absX) {
        return;
      }

      event.preventDefault();
      cancelFocusTransition();
      applyScrollDelta(event.deltaX);
      markSnapCandidateFromScroll();
    },
    [
      cardCount,
      cancelFocusTransition,
      applyScrollDelta,
      markSnapCandidateFromScroll,
    ],
  );

  const handleTouchStart = (event) => {
    if (cardCount < 2) {
      return;
    }

    const scrollElement = scrollRef.current;
    const touch = event.touches[0];
    if (!scrollElement || !touch) {
      return;
    }

    cancelFocusTransition();

    touchStateRef.current = {
      startX: touch.clientX,
      startScrollLeft: scrollElement.scrollLeft,
    };
  };

  const handleTouchMove = (event) => {
    const touchState = touchStateRef.current;
    const touch = event.touches[0];
    if (!touchState || !touch) {
      return;
    }

    const delta = touchState.startX - touch.clientX;
    if (Math.abs(delta) < 2) {
      return;
    }

    event.preventDefault();
    setControllerScroll(touchState.startScrollLeft + delta);
    markSnapCandidateFromScroll();
  };

  const handleTouchEnd = () => {
    if (touchStateRef.current && snapToCardOnRelease && cardCount > 1) {
      scheduleSnapToNearestCard(80);
    }
    touchStateRef.current = null;
  };

  const stageRef = useRef(null);

  useEffect(() => {
    const stageElement = stageRef.current;
    if (!stageElement) {
      return undefined;
    }

    stageElement.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      stageElement.removeEventListener("wheel", handleWheel);
    };
  }, [handleWheel]);

  const resolvedPageDotsPosition = normalizePageDotsPosition(pageDotsPosition);
  const showNavigationDots = showPageDots && cardCount > 1;

  const parsedTabsPosition = parseTabsPosition(tabsPosition);
  const isVerticalTabs = parsedTabsPosition.orientation === "vertical";
  const showNavigationTabs = showTabs && cardCount > 1 && cardNames !== null;

  const containerClassName = [
    "overlapping-cards-scroll",
    isVerticalTabs ? "overlapping-cards-scroll--vertical-tabs" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  useEffect(() => {
    if (showTabs && cardNames === null) {
      console.warn(
        "OverlappingCardsScroll: `showTabs` requires the `items` prop to provide card names. Tabs will not render.",
      );
    }
  }, [showTabs, cardNames]);

  const renderTabs = () => {
    if (!showNavigationTabs || cardNames === null) {
      return null;
    }

    const { side, align, orientation } = parsedTabsPosition;
    const isVertical = orientation === "vertical";

    const alignClass =
      align === "start"
        ? "ocs-tabs--align-start"
        : align === "end"
          ? "ocs-tabs--align-end"
          : "ocs-tabs--align-center";

    const orientationClass = isVertical ? "ocs-tabs--vertical" : "";

    const classNames = [
      "ocs-tabs",
      `ocs-tabs--${side}`,
      alignClass,
      orientationClass,
      tabsClassName,
    ]
      .filter(Boolean)
      .join(" ");

    const containerStyle: CSSProperties = {};
    if (side === "top") containerStyle.marginBottom = toCssDimension(tabsOffset);
    else if (side === "bottom") containerStyle.marginTop = toCssDimension(tabsOffset);
    else if (side === "left") containerStyle.marginRight = toCssDimension(tabsOffset);
    else if (side === "right") containerStyle.marginLeft = toCssDimension(tabsOffset);

    return (
      <TabsContainerComponent
        position={side}
        align={align}
        className={classNames}
        style={containerStyle}
        ariaLabel="Card tabs"
        cardNames={cardNames}
        activeIndex={activeIndex}
        progress={progress}
      >
        {cardNames.map((name, index) => {
          const influence = clamp(1 - Math.abs(progress - index), 0, 1);
          const isPrincipal = influence > 0.98;
          const animate = { opacity: 0.45 + influence * 0.55 };
          const className = isPrincipal ? "ocs-tab ocs-tab--active" : "ocs-tab";
          const style = { opacity: animate.opacity };

          return (
            <TabsComponent
              key={`ocs-tab-${side}-${index}`}
              name={name}
              index={index}
              position={side}
              align={align}
              isPrincipal={isPrincipal}
              influence={influence}
              animate={animate}
              className={className}
              style={style}
              ariaLabel={`Go to ${name}`}
              ariaCurrent={isPrincipal ? "page" : undefined}
              onClick={() =>
                focusCard(index, {
                  behavior: tabsBehavior,
                  transitionMode: "swoop",
                })
              }
            />
          );
        })}
      </TabsContainerComponent>
    );
  };

  return (
    <OverlappingCardsScrollControllerContext.Provider
      value={controllerContextValue}
    >
      <section
        className={containerClassName}
        aria-label={ariaLabel}
        ref={containerRef}
      >
        {parsedTabsPosition.side === "top" ? renderTabs() : null}
        {parsedTabsPosition.side === "left" ? renderTabs() : null}
        {isVerticalTabs ? (
          <div className="ocs-main-column">
            {showNavigationDots && resolvedPageDotsPosition === "above" ? (
              <nav
                className={
                  pageDotsClassName
                    ? `ocs-page-dots ocs-page-dots--above ${pageDotsClassName}`
                    : "ocs-page-dots ocs-page-dots--above"
                }
                style={{ marginBottom: toCssDimension(pageDotsOffset) }}
                aria-label="Card pages"
              >
                {cards.map((_, index) => {
                  const influence = clamp(1 - Math.abs(progress - index), 0, 1);
                  const opacity = 0.25 + influence * 0.75;
                  const scale = 0.9 + influence * 0.22;

                  return (
                    <button
                      key={`ocs-page-dot-above-${index}`}
                      type="button"
                      className="ocs-page-dot"
                      aria-label={`Go to card ${index + 1}`}
                      aria-current={influence > 0.98 ? "page" : undefined}
                      onClick={() =>
                        focusCard(index, {
                          behavior: pageDotsBehavior,
                          transitionMode: "swoop",
                        })
                      }
                      style={{ opacity, transform: `scale(${scale})` }}
                    />
                  );
                })}
              </nav>
            ) : null}
            <div className="ocs-stage-frame">
              <div
                className="ocs-stage"
                ref={stageRef}
                style={{
                  minHeight: toCssDimension(cardHeight),
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
              >
                <div className="ocs-track">
                  {cards.map((card, index) => {
                    const cardX = resolveCardX(
                      index,
                      activeIndex,
                      transitionProgress,
                      layout,
                    );

                    return (
                      <div
                        key={card.key ?? `ocs-card-${index}`}
                        className={
                          cardContainerClassName
                            ? `${focusTransition ? "ocs-card ocs-card--focus-transition" : "ocs-card"} ${cardContainerClassName}`
                            : focusTransition
                              ? "ocs-card ocs-card--focus-transition"
                              : "ocs-card"
                        }
                        style={{
                          width: `${layout.cardWidth}px`,
                          transform: `translate3d(${cardX}px, 0, 0)`,
                          transitionDuration: focusTransition
                            ? `${focusTransition.duration}ms`
                            : undefined,
                          ...cardContainerStyle,
                          pointerEvents: "none",
                        }}
                      >
                        <div
                          style={{
                            pointerEvents: "auto",
                            display: "flex",
                            flexDirection: "column",
                          }}
                        >
                          <OverlappingCardsScrollCardIndexContext.Provider
                            value={index}
                          >
                            {card}
                          </OverlappingCardsScrollCardIndexContext.Provider>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="ocs-scroll-region" ref={scrollRef}>
                  <div
                    className="ocs-scroll-spacer"
                    style={{
                      width: `${layout.trackWidth}px`,
                    }}
                  />
                </div>
              </div>
              {showNavigationDots && resolvedPageDotsPosition === "overlay" ? (
                <nav
                  className={
                    pageDotsClassName
                      ? `ocs-page-dots ocs-page-dots--overlay ${pageDotsClassName}`
                      : "ocs-page-dots ocs-page-dots--overlay"
                  }
                  style={{ bottom: toCssDimension(pageDotsOffset) }}
                  aria-label="Card pages"
                >
                  {cards.map((_, index) => {
                    const influence = clamp(1 - Math.abs(progress - index), 0, 1);
                    const opacity = 0.25 + influence * 0.75;
                    const scale = 0.9 + influence * 0.22;

                    return (
                      <button
                        key={`ocs-page-dot-overlay-${index}`}
                        type="button"
                        className="ocs-page-dot"
                        aria-label={`Go to card ${index + 1}`}
                        aria-current={influence > 0.98 ? "page" : undefined}
                        onClick={() =>
                          focusCard(index, {
                            behavior: pageDotsBehavior,
                            transitionMode: "swoop",
                          })
                        }
                        style={{ opacity, transform: `scale(${scale})` }}
                      />
                    );
                  })}
                </nav>
              ) : null}
            </div>
            {showNavigationDots && resolvedPageDotsPosition === "below" ? (
              <nav
                className={
                  pageDotsClassName
                    ? `ocs-page-dots ocs-page-dots--below ${pageDotsClassName}`
                    : "ocs-page-dots ocs-page-dots--below"
                }
                style={{ marginTop: toCssDimension(pageDotsOffset) }}
                aria-label="Card pages"
              >
                {cards.map((_, index) => {
                  const influence = clamp(1 - Math.abs(progress - index), 0, 1);
                  const opacity = 0.25 + influence * 0.75;
                  const scale = 0.9 + influence * 0.22;

                  return (
                    <button
                      key={`ocs-page-dot-below-${index}`}
                      type="button"
                      className="ocs-page-dot"
                      aria-label={`Go to card ${index + 1}`}
                      aria-current={influence > 0.98 ? "page" : undefined}
                      onClick={() =>
                        focusCard(index, {
                          behavior: pageDotsBehavior,
                          transitionMode: "swoop",
                        })
                      }
                      style={{ opacity, transform: `scale(${scale})` }}
                    />
                  );
                })}
              </nav>
            ) : null}
          </div>
        ) : (
          <>
            {showNavigationDots && resolvedPageDotsPosition === "above" ? (
              <nav
                className={
                  pageDotsClassName
                    ? `ocs-page-dots ocs-page-dots--above ${pageDotsClassName}`
                    : "ocs-page-dots ocs-page-dots--above"
                }
                style={{ marginBottom: toCssDimension(pageDotsOffset) }}
                aria-label="Card pages"
              >
                {cards.map((_, index) => {
                  const influence = clamp(1 - Math.abs(progress - index), 0, 1);
                  const opacity = 0.25 + influence * 0.75;
                  const scale = 0.9 + influence * 0.22;

                  return (
                    <button
                      key={`ocs-page-dot-above-${index}`}
                      type="button"
                      className="ocs-page-dot"
                      aria-label={`Go to card ${index + 1}`}
                      aria-current={influence > 0.98 ? "page" : undefined}
                      onClick={() =>
                        focusCard(index, {
                          behavior: pageDotsBehavior,
                          transitionMode: "swoop",
                        })
                      }
                      style={{ opacity, transform: `scale(${scale})` }}
                    />
                  );
                })}
              </nav>
            ) : null}
            <div className="ocs-stage-frame">
              <div
                className="ocs-stage"
                ref={stageRef}
                style={{
                  minHeight: toCssDimension(cardHeight),
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
              >
                <div className="ocs-track">
                  {cards.map((card, index) => {
                    const cardX = resolveCardX(
                      index,
                      activeIndex,
                      transitionProgress,
                      layout,
                    );

                    return (
                      <div
                        key={card.key ?? `ocs-card-${index}`}
                        className={
                          cardContainerClassName
                            ? `${focusTransition ? "ocs-card ocs-card--focus-transition" : "ocs-card"} ${cardContainerClassName}`
                            : focusTransition
                              ? "ocs-card ocs-card--focus-transition"
                              : "ocs-card"
                        }
                        style={{
                          width: `${layout.cardWidth}px`,
                          transform: `translate3d(${cardX}px, 0, 0)`,
                          transitionDuration: focusTransition
                            ? `${focusTransition.duration}ms`
                            : undefined,
                          ...cardContainerStyle,
                          pointerEvents: "none",
                        }}
                      >
                        <div
                          style={{
                            pointerEvents: "auto",
                            display: "flex",
                            flexDirection: "column",
                          }}
                        >
                          <OverlappingCardsScrollCardIndexContext.Provider
                            value={index}
                          >
                            {card}
                          </OverlappingCardsScrollCardIndexContext.Provider>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="ocs-scroll-region" ref={scrollRef}>
                  <div
                    className="ocs-scroll-spacer"
                    style={{
                      width: `${layout.trackWidth}px`,
                    }}
                  />
                </div>
              </div>
              {showNavigationDots && resolvedPageDotsPosition === "overlay" ? (
                <nav
                  className={
                    pageDotsClassName
                      ? `ocs-page-dots ocs-page-dots--overlay ${pageDotsClassName}`
                      : "ocs-page-dots ocs-page-dots--overlay"
                  }
                  style={{ bottom: toCssDimension(pageDotsOffset) }}
                  aria-label="Card pages"
                >
                  {cards.map((_, index) => {
                    const influence = clamp(1 - Math.abs(progress - index), 0, 1);
                    const opacity = 0.25 + influence * 0.75;
                    const scale = 0.9 + influence * 0.22;

                    return (
                      <button
                        key={`ocs-page-dot-overlay-${index}`}
                        type="button"
                        className="ocs-page-dot"
                        aria-label={`Go to card ${index + 1}`}
                        aria-current={influence > 0.98 ? "page" : undefined}
                        onClick={() =>
                          focusCard(index, {
                            behavior: pageDotsBehavior,
                            transitionMode: "swoop",
                          })
                        }
                        style={{ opacity, transform: `scale(${scale})` }}
                      />
                    );
                  })}
                </nav>
              ) : null}
            </div>
            {showNavigationDots && resolvedPageDotsPosition === "below" ? (
              <nav
                className={
                  pageDotsClassName
                    ? `ocs-page-dots ocs-page-dots--below ${pageDotsClassName}`
                    : "ocs-page-dots ocs-page-dots--below"
                }
                style={{ marginTop: toCssDimension(pageDotsOffset) }}
                aria-label="Card pages"
              >
                {cards.map((_, index) => {
                  const influence = clamp(1 - Math.abs(progress - index), 0, 1);
                  const opacity = 0.25 + influence * 0.75;
                  const scale = 0.9 + influence * 0.22;

                  return (
                    <button
                      key={`ocs-page-dot-below-${index}`}
                      type="button"
                      className="ocs-page-dot"
                      aria-label={`Go to card ${index + 1}`}
                      aria-current={influence > 0.98 ? "page" : undefined}
                      onClick={() =>
                        focusCard(index, {
                          behavior: pageDotsBehavior,
                          transitionMode: "swoop",
                        })
                      }
                      style={{ opacity, transform: `scale(${scale})` }}
                    />
                  );
                })}
              </nav>
            ) : null}
          </>
        )}
        {parsedTabsPosition.side === "right" ? renderTabs() : null}
        {parsedTabsPosition.side === "bottom" ? renderTabs() : null}
      </section>
    </OverlappingCardsScrollControllerContext.Provider>
  );
}
