# Overlapping Cards Scroll

React + Vite workspace for building a reusable `OverlappingCardsScroll` component and testing it with multiple demo pages.

## Run

```bash
npm install
npm run dev
```

Then open the local Vite URL and switch between:

- `#basic` foundation demo
- `#content` rich-content demo
- `#stress` many-card stress demo
- `#rnweb` React Native Web demo

## Expo Dev

```bash
npm run dev:expo
```

This launches the Expo dev server.

## Build

```bash
npm run build
```

## Type Check

```bash
npm run typecheck
```

## Component

`OverlappingCardsScroll` lives in `src/lib/OverlappingCardsScroll.tsx` and is exported from `src/lib/index.ts`.

React Native versions live in:
- `src/rn/OverlappingCardsScrollRN.native.tsx`
- `src/rn/OverlappingCardsScrollRN.web.tsx`

You can nest a focus trigger inside any card to bring that card into principal view:

```jsx
<OverlappingCardsScrollFocusTrigger>
  Make principal
</OverlappingCardsScrollFocusTrigger>
```

For RN/RN-web, use `OverlappingCardsScrollRNFocusTrigger`.

You can also enable clickable page dots:

```jsx
<OverlappingCardsScroll
  showPageDots
  pageDotsPosition="overlay"
  pageDotsOffset={10}
>
  {cards}
</OverlappingCardsScroll>
```

### Behavior

- Horizontal scrolling drives card transitions.
- Each card width is `1/3` of the scroll container by default.
- Lower index cards stay visually below higher index cards.
- Cards fan out so each card keeps a visible leading edge.
- As you scroll, the next card slides left to become the primary visible card.

### Example

```jsx
import { OverlappingCardsScroll } from './lib'

<OverlappingCardsScroll cardHeight={280}>
  {cards.map((card) => (
    <Card key={card.id} {...card} />
  ))}
</OverlappingCardsScroll>
```

### Props

- `children`: card nodes
- `cardHeight` (`number | string`, default `300`)
- `cardWidth` (`number | string`) accepts px number (e.g. `250`) or percent string (e.g. `'50%'`)
- `cardWidthRatio` (`number`, default `1 / 3`)
- `basePeek` (`number`, default `64`)
- `minPeek` (`number`, default `10`)
- `maxPeek` (`number`, default `84`)
- `showPageDots` (`boolean`, default `false`) renders clickable page dots
- `pageDotsPosition` (`'above' | 'below' | 'overlay'`, default `'below'`)
- `pageDotsOffset` (`number | string`, default `10`) distance from stage
- `pageDotsBehavior` (`'smooth' | 'auto'`, web only, default `'smooth'`)
- `snapToCardOnRelease` (`boolean`, default `true`) web/RN-web uses idle + mousemove snap, RN native uses `snapToInterval` on iOS
- `snapReleaseDelay` (`number`, default `800`) web/RN-web debounce before auto-snap
- `snapDecelerationRate` (`'normal' | 'fast' | number`, RN native only, default `'normal'`) controls fling feel while snapping
- `snapDisableIntervalMomentum` (`boolean`, RN native only, default `false`) keep `false` for stronger momentum across multiple cards
- `focusTransitionDuration` (`number`, default `420`) duration for click-triggered "single swoop" focus transitions
- `className` (`string`)
- `ariaLabel` (`string`)
