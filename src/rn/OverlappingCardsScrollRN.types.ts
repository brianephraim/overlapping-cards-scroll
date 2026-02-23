import type { ComponentProps, ComponentType, ReactNode } from "react";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import type {
  CardItem as OverlappingCardsScrollWebCardItem,
  OverlappingCardsScroll,
  OverlappingCardsScrollFocusTriggerProps as OverlappingCardsScrollWebFocusTriggerProps,
} from "../lib/OverlappingCardsScroll";

type OverlappingCardsScrollWebProps = ComponentProps<
  typeof OverlappingCardsScroll
>;

type OverlappingCardsScrollRNSharedProps = Omit<
  OverlappingCardsScrollWebProps,
  | "children"
  | "items"
  | "cardContainerStyle"
  | "tabsComponent"
  | "tabsContainerComponent"
>;

export type OverlappingCardsScrollRNPageDotsPosition = NonNullable<
  OverlappingCardsScrollWebProps["pageDotsPosition"]
>;

export type OverlappingCardsScrollRNFocusTriggerBehavior =
  OverlappingCardsScrollWebFocusTriggerProps["behavior"];

export type OverlappingCardsScrollRNFocusTransitionMode = NonNullable<
  OverlappingCardsScrollWebFocusTriggerProps["transitionMode"]
>;

export type OverlappingCardsScrollRNSnapDecelerationRate =
  | "normal"
  | "fast"
  | number;

export type OverlappingCardsScrollRNItem = OverlappingCardsScrollWebCardItem;

export type OverlappingCardsScrollRNTabsPosition = "above" | "below";

export interface OverlappingCardsScrollRNTabProps {
  name: string;
  index: number;
  position: OverlappingCardsScrollRNTabsPosition;
  isPrincipal: boolean;
  influence: number;
  animate: {
    opacity: number;
  };
  className: string;
  style: StyleProp<ViewStyle>;
  textStyle: StyleProp<TextStyle>;
  ariaLabel: string;
  ariaCurrent?: "page";
  accessibilityLabel: string;
  accessibilityState?: {
    selected?: boolean;
  };
  onPress: () => void;
  onClick: () => void;
}

export interface OverlappingCardsScrollRNTabsContainerProps {
  children: ReactNode;
  position: OverlappingCardsScrollRNTabsPosition;
  className: string;
  style: StyleProp<ViewStyle>;
  ariaLabel: string;
  cardNames: string[];
  activeIndex: number;
  progress: number;
}

type OverlappingCardsScrollRNWithChildren =
  OverlappingCardsScrollRNSharedProps & {
    children: ReactNode;
    items?: never;
  };

type OverlappingCardsScrollRNWithItems = OverlappingCardsScrollRNSharedProps & {
  items: OverlappingCardsScrollRNItem[];
  children?: never;
};

type OverlappingCardsScrollRNContentProps =
  | OverlappingCardsScrollRNWithChildren
  | OverlappingCardsScrollRNWithItems;

export type OverlappingCardsScrollRNProps =
  OverlappingCardsScrollRNContentProps & {
    style?: StyleProp<ViewStyle>;
    cardContainerStyle?: StyleProp<ViewStyle>;
    tabsComponent?: ComponentType<OverlappingCardsScrollRNTabProps>;
    tabsContainerComponent?: ComponentType<OverlappingCardsScrollRNTabsContainerProps>;
    showsHorizontalScrollIndicator?: boolean;
    snapDecelerationRate?: OverlappingCardsScrollRNSnapDecelerationRate;
    snapDisableIntervalMomentum?: boolean;
  };

export interface OverlappingCardsScrollRNFocusTriggerProps {
  children?: ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  behavior?: OverlappingCardsScrollRNFocusTriggerBehavior;
  transitionMode?: OverlappingCardsScrollRNFocusTransitionMode;
  disabled?: boolean;
  accessibilityLabel?: string;
  testID?: string;
  onPress?: (event: unknown) => void;
  onClick?: (event: unknown) => void;
}
