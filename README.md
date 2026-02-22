# overlapping-cards-scroll

Reusable overlapping-cards scroll component for React, React Native, and React Native Web.

## Install

```bash
npm install overlapping-cards-scroll
```

Peer dependencies:

- `react` `^18 || ^19`
- `react-dom` `^18 || ^19` (optional)
- `react-native` `>=0.73` (optional)
- `react-native-web` `>=0.19` (optional)

## Web Usage

```tsx
import 'overlapping-cards-scroll/styles.css'
import {
  OverlappingCardsScroll,
  OverlappingCardsScrollFocusTrigger,
} from 'overlapping-cards-scroll'

export function Example({ cards }) {
  return (
    <OverlappingCardsScroll cardHeight={280} showPageDots pageDotsPosition="below">
      {cards.map((card) => (
        <article key={card.id}>
          <h3>{card.title}</h3>
          <OverlappingCardsScrollFocusTrigger>
            Make principal
          </OverlappingCardsScrollFocusTrigger>
        </article>
      ))}
    </OverlappingCardsScroll>
  )
}
```

## React Native Usage

```tsx
import {
  OverlappingCardsScrollRN,
  OverlappingCardsScrollRNFocusTrigger,
} from 'overlapping-cards-scroll/react-native'
```

`/react-native` resolves to:

- native build for React Native runtimes
- web adapter build for non-native runtimes

You can also target explicit builds:

- `overlapping-cards-scroll/react-native/native`
- `overlapping-cards-scroll/react-native/web`

For web adapter usage, import package styles:

```tsx
import 'overlapping-cards-scroll/styles.css'
```

## Props

- `children`: card nodes
- `items` (`{ id: string | number; name: string; jsx: ReactElement }[]`) optional alternative to `children`; required for named tabs (`showTabs`)
- `cardHeight` (`number | string`, default `300`)
- `cardWidth` (`number | string`) accepts px number (e.g. `250`) or percent string (e.g. `'50%'`)
- `cardWidthRatio` (`number`, default `1 / 3`)
- `basePeek` (`number`, default `64`)
- `minPeek` (`number`, default `10`)
- `maxPeek` (`number`, default `84`)
- `cardContainerStyle` (web: `CSSProperties`, RN native: `StyleProp<ViewStyle>`) applied to each positioned card container
- `showPageDots` (`boolean`, default `false`) renders clickable page dots
- `pageDotsPosition` (`'above' | 'below' | 'overlay'`, default `'below'`)
- `pageDotsOffset` (`number | string`, default `10`) distance from stage
- `pageDotsBehavior` (`'smooth' | 'auto'`, web only, default `'smooth'`)
- `showTabs` (`boolean`, default `false`) renders card-name tabs when `items` is provided
- `tabsPosition` (`'above' | 'below'`, default `'above'`)
- `tabsOffset` (`number | string`, default `10`)
- `tabsBehavior` (`'smooth' | 'auto'`, web only, default `'smooth'`)
- `tabsComponent` (custom tab renderer; supported on web and RN native)
- `tabsContainerComponent` (custom tab container renderer; supported on web and RN native)
- `snapToCardOnRelease` (`boolean`, default `true`) web/RN-web uses idle + mousemove snap, RN native uses `snapToInterval` on iOS
- `snapReleaseDelay` (`number`, default `800`) web/RN-web debounce before auto-snap
- `snapDecelerationRate` (`'normal' | 'fast' | number`, RN native only, default `'normal'`) controls fling feel while snapping
- `snapDisableIntervalMomentum` (`boolean`, RN native only, default `false`) keep `false` for stronger momentum across multiple cards
- `focusTransitionDuration` (`number`, default `420`) duration for click-triggered "single swoop" focus transitions
- `className` (`string`)
- `ariaLabel` (`string`)

## Local Development

```bash
npm install
npm run dev
```

Vite demos:

- `#basic` foundation demo
- `#content` rich-content demo
- `#stress` many-card stress demo
- `#rnweb` React Native Web demo

Expo development:

```bash
npm run dev:expo
```

The Expo app shell lives in `expo-demo/` and imports the demo screen from the package root via `../App`.
You can also run it directly with:

```bash
cd expo-demo
npm run dev
```

Build package artifacts:

```bash
npm run build
```

Build demo site:

```bash
npm run build:demo
```
