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
import type { ReactElement } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type {
  OverlappingCardsScrollRNFocusTransitionMode,
  OverlappingCardsScrollRNFocusTriggerProps,
  OverlappingCardsScrollRNItem,
  OverlappingCardsScrollRNProps,
  OverlappingCardsScrollRNTabsContainerProps,
  OverlappingCardsScrollRNTabProps,
  OverlappingCardsScrollRNTabsPosition,
} from "./OverlappingCardsScrollRN.types";

export type {
  OverlappingCardsScrollRNFocusTransitionMode,
  OverlappingCardsScrollRNFocusTriggerBehavior,
  OverlappingCardsScrollRNFocusTriggerProps,
  OverlappingCardsScrollRNItem,
  OverlappingCardsScrollRNPageDotsPosition,
  OverlappingCardsScrollRNProps,
  OverlappingCardsScrollRNSnapDecelerationRate,
  OverlappingCardsScrollRNTabsContainerProps,
  OverlappingCardsScrollRNTabProps,
  OverlappingCardsScrollRNTabsPosition,
} from "./OverlappingCardsScrollRN.types";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const PAGE_DOT_POSITIONS = new Set(["above", "below", "overlay"]);
const TAB_POSITIONS = new Set(["above", "below"]);

const normalizePageDotsPosition = (value) =>
  PAGE_DOT_POSITIONS.has(value) ? value : "below";

const normalizeTabsPosition = (value) =>
  TAB_POSITIONS.has(value) ? value : "above";

const toNumericOffset = (value, fallback = 0) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.trim());
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
};

const toNativeDimension = (
  value,
  fallback = 0,
): number | "auto" | `${number}%` => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "auto") {
      return "auto";
    }

    if (trimmed.endsWith("%")) {
      const percent = Number.parseFloat(trimmed.slice(0, -1));
      if (Number.isFinite(percent)) {
        return `${percent}%` as `${number}%`;
      }
    }

    const numeric = Number.parseFloat(trimmed);
    if (Number.isFinite(numeric)) {
      return numeric;
    }
  }

  return fallback;
};

const resolveCardXAtProgress = (index, progress, layout) => {
  const principalIndex = Math.floor(progress);
  const transitionProgress = progress - principalIndex;

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

const OverlappingCardsScrollRNControllerContext = createContext(null);
const OverlappingCardsScrollRNCardIndexContext = createContext(null);

function useOverlappingCardsScrollRNCardControl() {
  const controller = useContext(OverlappingCardsScrollRNControllerContext);
  const cardIndex = useContext(OverlappingCardsScrollRNCardIndexContext);

  const canFocus = controller !== null && cardIndex !== null;
  const focusCard = useCallback(
    (
      options: {
        animated?: boolean;
        transitionMode?: OverlappingCardsScrollRNFocusTransitionMode;
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

export function OverlappingCardsScrollRNFocusTrigger({
  children = "Make principal",
  style = undefined,
  textStyle = undefined,
  behavior = "smooth",
  transitionMode = "swoop",
  disabled = false,
  accessibilityLabel = undefined,
  testID = undefined,
  onPress = undefined,
  onClick = undefined,
  ...pressableProps
}: OverlappingCardsScrollRNFocusTriggerProps) {
  const { canFocus, focusCard } = useOverlappingCardsScrollRNCardControl();

  const handlePress = (event) => {
    onClick?.(event);
    onPress?.(event);
    focusCard({
      animated: behavior !== "auto",
      transitionMode,
    });
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.focusTrigger,
        pressed && styles.focusTriggerPressed,
        style,
      ]}
      disabled={disabled || !canFocus}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      onPress={handlePress}
      {...pressableProps}
    >
      <Text style={[styles.focusTriggerText, textStyle]}>{children}</Text>
    </Pressable>
  );
}

function DefaultTabsContainerComponent({
  children,
  style,
  ariaLabel,
}: OverlappingCardsScrollRNTabsContainerProps) {
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={ariaLabel}
      style={style}
    >
      {children}
    </View>
  );
}

function DefaultTabsComponent({
  name,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityState,
  onPress,
  onClick,
}: OverlappingCardsScrollRNTabProps) {
  const handlePress = () => {
    onClick();
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      onPress={handlePress}
      style={({ pressed }) => [styles.tab, pressed && styles.tabPressed, style]}
    >
      <Text style={[styles.tabText, textStyle]}>{name}</Text>
    </Pressable>
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

export function OverlappingCardsScrollRN(props: OverlappingCardsScrollRNProps) {
  const {
    style = undefined,
    cardHeight = 300,
    cardWidth = undefined,
    cardWidthRatio = 1 / 3,
    basePeek = 64,
    minPeek = 10,
    maxPeek = 84,
    showsHorizontalScrollIndicator = true,
    snapToCardOnRelease = true,
    snapDecelerationRate = "normal",
    snapDisableIntervalMomentum = false,
    showPageDots = false,
    pageDotsPosition = "below",
    pageDotsOffset = 10,
    focusTransitionDuration = 420,
    cardContainerStyle = undefined,
    showTabs = false,
    tabsPosition = "above",
    tabsOffset = 10,
    tabsComponent: TabsComponent = DefaultTabsComponent,
    tabsContainerComponent:
      TabsContainerComponent = DefaultTabsContainerComponent,
  } = props;

  const hasItems = "items" in props && Array.isArray(props.items);
  const hasChildren = "children" in props && props.children != null;

  useEffect(() => {
    if (hasItems && hasChildren) {
      console.warn(
        "OverlappingCardsScrollRN: Both `items` and `children` were provided. `items` takes precedence.",
      );
    }
  }, [hasItems, hasChildren]);

  const itemsProp: OverlappingCardsScrollRNItem[] | null = hasItems
    ? props.items
    : null;
  const childrenProp = hasChildren ? props.children : null;

  const cards = useMemo(() => {
    if (itemsProp) {
      return itemsProp.map((item) => (
        <Fragment key={item.id}>{item.jsx}</Fragment>
      ));
    }
    return Children.toArray(childrenProp) as ReactElement[];
  }, [childrenProp, itemsProp]);

  const cardNames: string[] | null = useMemo(() => {
    if (itemsProp) {
      return itemsProp.map((item) => item.name);
    }
    return null;
  }, [itemsProp]);

  const cardCount = cards.length;
  const resolvedTabsPosition = normalizeTabsPosition(tabsPosition);
  const showNavigationTabs = showTabs && cardCount > 1 && cardNames !== null;
  const resolvedPageDotsOffset = toNumericOffset(pageDotsOffset, 10);
  const resolvedTabsOffset = toNumericOffset(tabsOffset, 10);
  const resolvedCardHeight = toNativeDimension(cardHeight, 300);

  useEffect(() => {
    if (showTabs && cardNames === null) {
      console.warn(
        "OverlappingCardsScrollRN: `showTabs` requires the `items` prop to provide card names. Tabs will not render.",
      );
    }
  }, [cardNames, showTabs]);

  const scrollRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollXValueRef = useRef(0);
  const focusTransitionProgress = useRef(new Animated.Value(1)).current;
  const focusTransitionAnimationRef = useRef(null);
  const focusTransitionIdRef = useRef(0);

  const [viewportWidth, setViewportWidth] = useState(1);
  const [focusTransition, setFocusTransition] = useState(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const layout = useMemo(() => {
    const safeWidth = Math.max(1, viewportWidth);
    const safeRatio = clamp(cardWidthRatio, 0.2, 0.95);
    const resolvedCardWidth = Math.max(
      1,
      resolveCardWidth(cardWidth, safeWidth, safeRatio),
    );

    if (cardCount < 2) {
      return {
        cardWidth: resolvedCardWidth,
        peek: 0,
        stepDistance: 1,
        scrollRange: 0,
        trackWidth: safeWidth,
      };
    }

    const availableStackWidth = Math.max(0, safeWidth - resolvedCardWidth);
    const preferredPeek = clamp(basePeek, minPeek, maxPeek);
    const maxVisiblePeek = availableStackWidth / (cardCount - 1);
    const peek = Math.min(preferredPeek, maxVisiblePeek);

    const stepDistance = Math.max(1, resolvedCardWidth - peek);
    const scrollRange = stepDistance * (cardCount - 1);

    return {
      cardWidth: resolvedCardWidth,
      peek,
      stepDistance,
      scrollRange,
      trackWidth: safeWidth + scrollRange,
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

  const stopFocusTransitionAnimation = useCallback(() => {
    if (focusTransitionAnimationRef.current) {
      focusTransitionAnimationRef.current.stop();
      focusTransitionAnimationRef.current = null;
    }
    focusTransitionProgress.stopAnimation();
  }, [focusTransitionProgress]);

  const cancelFocusTransition = useCallback(() => {
    focusTransitionIdRef.current += 1;
    stopFocusTransitionAnimation();
    setFocusTransition(null);
  }, [stopFocusTransitionAnimation]);

  useEffect(() => {
    const id = scrollX.addListener(({ value }) => {
      scrollXValueRef.current = value;

      if (!showNavigationTabs) {
        return;
      }

      const nextProgress =
        cardCount > 1
          ? clamp(value / layout.stepDistance, 0, cardCount - 1)
          : 0;

      setScrollProgress((currentProgress) =>
        Math.abs(currentProgress - nextProgress) < 0.001
          ? currentProgress
          : nextProgress,
      );
    });

    return () => {
      scrollX.removeListener(id);
    };
  }, [cardCount, layout.stepDistance, scrollX, showNavigationTabs]);

  useEffect(() => {
    if (!showNavigationTabs) {
      setScrollProgress(0);
      return;
    }

    const nextProgress =
      cardCount > 1
        ? clamp(scrollXValueRef.current / layout.stepDistance, 0, cardCount - 1)
        : 0;

    setScrollProgress(nextProgress);
  }, [cardCount, layout.stepDistance, showNavigationTabs]);

  useEffect(
    () => () => stopFocusTransitionAnimation(),
    [stopFocusTransitionAnimation],
  );

  useEffect(() => {
    if (cardCount > 1) {
      return;
    }

    cancelFocusTransition();
  }, [cancelFocusTransition, cardCount]);

  useEffect(() => {
    if (!scrollRef.current) {
      return;
    }

    if (scrollXValueRef.current > layout.scrollRange) {
      scrollRef.current.scrollTo({
        x: layout.scrollRange,
        y: 0,
        animated: false,
      });
      scrollX.setValue(layout.scrollRange);
      scrollXValueRef.current = layout.scrollRange;
    }
  }, [layout.scrollRange, scrollX]);

  const onScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
        useNativeDriver: true,
      }),
    [scrollX],
  );

  const focusCard = useCallback(
    (
      targetIndex: number,
      options: {
        animated?: boolean;
        transitionMode?: OverlappingCardsScrollRNFocusTransitionMode;
        duration?: number;
      } = {},
    ) => {
      const scrollElement = scrollRef.current;
      if (!scrollElement || cardCount === 0) {
        return;
      }

      const safeIndex = clamp(Math.round(targetIndex), 0, cardCount - 1);
      const nextScrollLeft = clamp(
        safeIndex * layout.stepDistance,
        0,
        layout.scrollRange,
      );
      const transitionMode = options.transitionMode ?? "swoop";

      if (transitionMode === "swoop" && cardCount > 1) {
        if (showNavigationTabs) {
          setScrollProgress(safeIndex);
        }

        const fromProgress = clamp(
          scrollXValueRef.current / layout.stepDistance,
          0,
          cardCount - 1,
        );
        const toProgress = safeIndex;
        const duration = Number.isFinite(options.duration)
          ? Math.max(0, options.duration)
          : focusTransitionDuration;

        stopFocusTransitionAnimation();
        const transitionId = focusTransitionIdRef.current + 1;
        focusTransitionIdRef.current = transitionId;
        focusTransitionProgress.setValue(0);
        setFocusTransition({ fromProgress, toProgress });

        if (duration <= 0 || Math.abs(toProgress - fromProgress) < 0.001) {
          setFocusTransition(null);
          focusTransitionProgress.setValue(1);
          scrollElement.scrollTo({
            x: nextScrollLeft,
            y: 0,
            animated: false,
          });
          scrollX.setValue(nextScrollLeft);
          scrollXValueRef.current = nextScrollLeft;
          return;
        }

        focusTransitionAnimationRef.current = Animated.timing(
          focusTransitionProgress,
          {
            toValue: 1,
            duration,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          },
        );

        focusTransitionAnimationRef.current.start(({ finished }) => {
          if (!finished || focusTransitionIdRef.current !== transitionId) {
            return;
          }
          focusTransitionAnimationRef.current = null;
          scrollElement.scrollTo({
            x: nextScrollLeft,
            y: 0,
            animated: false,
          });
          scrollX.setValue(nextScrollLeft);
          scrollXValueRef.current = nextScrollLeft;
          focusTransitionProgress.setValue(1);
          setFocusTransition(null);
        });
        return;
      }

      cancelFocusTransition();
      scrollElement.scrollTo({
        x: nextScrollLeft,
        y: 0,
        animated: options.animated ?? true,
      });

      if ((options.animated ?? true) === false) {
        scrollX.setValue(nextScrollLeft);
        scrollXValueRef.current = nextScrollLeft;
        if (showNavigationTabs) {
          setScrollProgress(safeIndex);
        }
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
      showNavigationTabs,
      stopFocusTransitionAnimation,
    ],
  );

  const controllerContextValue = useMemo(
    () => ({
      focusCard,
    }),
    [focusCard],
  );

  const shouldSnapToCard =
    snapToCardOnRelease &&
    Platform.OS === "ios" &&
    cardCount > 1 &&
    layout.stepDistance > 1;
  const resolvedPageDotsPosition = normalizePageDotsPosition(pageDotsPosition);
  const showNavigationDots = showPageDots && cardCount > 1;
  const dotScrollX = useMemo(() => {
    if (!focusTransition) {
      return scrollX;
    }

    const fromX = focusTransition.fromProgress * layout.stepDistance;
    const toX = focusTransition.toProgress * layout.stepDistance;

    return focusTransitionProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [fromX, toX],
      extrapolate: "clamp",
    });
  }, [focusTransition, focusTransitionProgress, layout.stepDistance, scrollX]);
  const progress = showNavigationTabs ? scrollProgress : 0;
  const activeIndex = Math.floor(progress);

  const renderPageDots = (placement) => {
    if (!showNavigationDots || resolvedPageDotsPosition !== placement) {
      return null;
    }

    const rowStyle =
      placement === "above"
        ? [styles.pageDotsRow, { marginBottom: resolvedPageDotsOffset }]
        : placement === "below"
          ? [styles.pageDotsRow, { marginTop: resolvedPageDotsOffset }]
          : [
              styles.pageDotsRow,
              styles.pageDotsOverlay,
              { bottom: resolvedPageDotsOffset },
            ];

    return (
      <View
        pointerEvents={placement === "overlay" ? "box-none" : "auto"}
        style={rowStyle}
      >
        {cards.map((_, index) => {
          const inputRange = [
            (index - 1) * layout.stepDistance,
            index * layout.stepDistance,
            (index + 1) * layout.stepDistance,
          ];
          const opacity = dotScrollX.interpolate({
            inputRange,
            outputRange: [0.25, 1, 0.25],
            extrapolate: "clamp",
          });
          const scale = dotScrollX.interpolate({
            inputRange,
            outputRange: [0.9, 1.12, 0.9],
            extrapolate: "clamp",
          });

          return (
            <Pressable
              key={`rn-ocs-page-dot-${placement}-${index}`}
              accessibilityLabel={`Go to card ${index + 1}`}
              onPress={() =>
                focusCard(index, { animated: true, transitionMode: "swoop" })
              }
              style={styles.pageDotPressable}
            >
              <Animated.View
                style={[styles.pageDot, { opacity, transform: [{ scale }] }]}
              />
            </Pressable>
          );
        })}
      </View>
    );
  };

  const renderTabs = (position: OverlappingCardsScrollRNTabsPosition) => {
    if (
      !showNavigationTabs ||
      resolvedTabsPosition !== position ||
      cardNames === null
    ) {
      return null;
    }

    const containerStyle =
      position === "above"
        ? [styles.tabsRow, { marginBottom: resolvedTabsOffset }]
        : [styles.tabsRow, { marginTop: resolvedTabsOffset }];

    return (
      <TabsContainerComponent
        position={position}
        className={`rn-ocs-tabs rn-ocs-tabs--${position}`}
        style={containerStyle}
        ariaLabel="Card tabs"
        cardNames={cardNames}
        activeIndex={activeIndex}
        progress={progress}
      >
        {cardNames.map((name, index) => {
          const influence = clamp(1 - Math.abs(progress - index), 0, 1);
          const isPrincipal = influence > 0.98;
          const animate = {
            opacity: 0.45 + influence * 0.55,
          };
          const pressTab = () =>
            focusCard(index, {
              animated: true,
              transitionMode: "swoop",
            });

          return (
            <TabsComponent
              key={`rn-ocs-tab-${position}-${index}`}
              name={name}
              index={index}
              position={position}
              isPrincipal={isPrincipal}
              influence={influence}
              animate={animate}
              className={
                isPrincipal ? "rn-ocs-tab rn-ocs-tab--active" : "rn-ocs-tab"
              }
              style={{ opacity: animate.opacity }}
              textStyle={isPrincipal ? styles.tabTextActive : undefined}
              ariaLabel={`Go to ${name}`}
              ariaCurrent={isPrincipal ? "page" : undefined}
              accessibilityLabel={`Go to ${name}`}
              accessibilityState={{ selected: isPrincipal }}
              onPress={pressTab}
              onClick={pressTab}
            />
          );
        })}
      </TabsContainerComponent>
    );
  };

  return (
    <OverlappingCardsScrollRNControllerContext.Provider
      value={controllerContextValue}
    >
      <View style={[styles.shell, style]}>
        {renderTabs("above")}
        {renderPageDots("above")}
        <View
          style={[styles.root, { height: resolvedCardHeight }]}
          onLayout={(event) => {
            const width = event.nativeEvent.layout.width || 1;
            setViewportWidth(Math.max(1, width));
          }}
        >
          <Animated.ScrollView
            ref={scrollRef}
            horizontal
            style={[styles.scrollRegion, { height: resolvedCardHeight }]}
            contentContainerStyle={{
              width: layout.trackWidth,
              height: resolvedCardHeight,
            }}
            onScroll={onScroll}
            onScrollBeginDrag={cancelFocusTransition}
            onMomentumScrollBegin={cancelFocusTransition}
            scrollEventThrottle={16}
            showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
            snapToInterval={shouldSnapToCard ? layout.stepDistance : undefined}
            snapToAlignment={shouldSnapToCard ? "start" : undefined}
            decelerationRate={
              shouldSnapToCard
                ? (snapDecelerationRate as number | "normal" | "fast")
                : "normal"
            }
            disableIntervalMomentum={
              shouldSnapToCard ? snapDisableIntervalMomentum : false
            }
          >
            <View
              style={[
                styles.track,
                { width: layout.trackWidth, height: resolvedCardHeight },
              ]}
            >
              {cards.map((card, index) => {
                const restingRightX =
                  index === 0
                    ? 0
                    : (index - 1) * layout.peek + layout.cardWidth;
                const restingLeftX = index * layout.peek;

                const cardXDuringNormalScroll =
                  index === 0
                    ? 0
                    : scrollX.interpolate({
                        inputRange:
                          index === 1
                            ? [0, layout.stepDistance]
                            : [
                                (index - 1) * layout.stepDistance,
                                index * layout.stepDistance,
                              ],
                        outputRange: [restingRightX, restingLeftX],
                        extrapolate: "clamp",
                      });

                const cardXDuringFocusTransition = focusTransition
                  ? focusTransitionProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [
                        resolveCardXAtProgress(
                          index,
                          focusTransition.fromProgress,
                          layout,
                        ),
                        resolveCardXAtProgress(
                          index,
                          focusTransition.toProgress,
                          layout,
                        ),
                      ],
                      extrapolate: "clamp",
                    })
                  : null;

                const animatedCardX =
                  cardXDuringFocusTransition ?? cardXDuringNormalScroll;

                return (
                  <Animated.View
                    key={card.key ?? `rn-ocs-card-${index}`}
                    pointerEvents="box-none"
                    style={[
                      styles.card,
                      {
                        width: layout.cardWidth,
                        height: resolvedCardHeight,
                        transform: [
                          {
                            translateX: Animated.add(scrollX, animatedCardX),
                          },
                        ],
                      },
                      cardContainerStyle,
                    ]}
                  >
                    <View pointerEvents="auto" style={styles.cardContent}>
                      <OverlappingCardsScrollRNCardIndexContext.Provider
                        value={index}
                      >
                        {card}
                      </OverlappingCardsScrollRNCardIndexContext.Provider>
                    </View>
                  </Animated.View>
                );
              })}
            </View>
          </Animated.ScrollView>
          {renderPageDots("overlay")}
        </View>
        {renderPageDots("below")}
        {renderTabs("below")}
      </View>
    </OverlappingCardsScrollRNControllerContext.Provider>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: "100%",
    minWidth: 0,
  },
  root: {
    width: "100%",
    minWidth: 0,
    position: "relative",
  },
  scrollRegion: {
    width: "100%",
    minWidth: 0,
  },
  track: {
    position: "relative",
    minHeight: 1,
  },
  card: {
    position: "absolute",
    left: 0,
    top: 0,
  },
  cardContent: {
    flex: 1,
    flexDirection: "column",
  },
  pageDotsRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 6,
  },
  pageDotsOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
  },
  pageDotPressable: {
    width: 16,
    height: 16,
    marginHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  pageDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#1f4666",
  },
  tabsRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    zIndex: 6,
  },
  tab: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(30, 67, 99, 0.2)",
    backgroundColor: "#eef5ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 4,
    marginVertical: 4,
  },
  tabPressed: {
    opacity: 0.85,
  },
  tabText: {
    color: "#275070",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  tabTextActive: {
    color: "#173047",
  },
  focusTrigger: {
    alignSelf: "flex-start",
    borderRadius: 99,
    borderWidth: 1,
    borderColor: "rgba(30, 67, 99, 0.25)",
    backgroundColor: "#f3f8ff",
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 6,
  },
  focusTriggerPressed: {
    opacity: 0.85,
  },
  focusTriggerText: {
    color: "#1f4666",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
