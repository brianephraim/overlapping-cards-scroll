import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import {
  OverlappingCardsScrollRN,
  OverlappingCardsScrollRNFocusTrigger,
} from './OverlappingCardsScrollRN.web'
import type {
  OverlappingCardsScrollRNTabProps,
  OverlappingCardsScrollRNTabsContainerProps,
} from './OverlappingCardsScrollRN.web'

const RN_DEMO_CARDS = [
  {
    id: 'rn-1',
    tag: 'Card 01',
    title: 'Native Layout',
    body: 'Card width is 1/3 of the viewport measured from onLayout.',
    color: '#0d9488',
  },
  {
    id: 'rn-2',
    tag: 'Card 02',
    title: 'Stacked Ordering',
    body: 'Higher index cards remain above lower index cards in the stack.',
    color: '#f97316',
  },
  {
    id: 'rn-3',
    tag: 'Card 03',
    title: 'Scroll Driven',
    body: 'ScrollView offset drives a single incoming card transition each step.',
    color: '#2563eb',
  },
  {
    id: 'rn-4',
    tag: 'Card 04',
    title: 'Expo Ready',
    body: 'The component relies only on react-native primitives for portability.',
    color: '#7c3aed',
  },
  {
    id: 'rn-5',
    tag: 'Card 05',
    title: 'Fanned Edges',
    body: 'All cards keep a visible leading edge while focus transitions right.',
    color: '#be123c',
  },
]

function RNCard({ tag, title, body, color }) {
  const [clickCount, setClickCount] = useState(0)

  return (
    <View style={styles.card}>
      <View style={[styles.bar, { backgroundColor: color }]} />
      <Text style={styles.tag}>{tag}</Text>
      <Pressable
        style={styles.counter}
        onPress={() => setClickCount((count) => count + 1)}
      >
        <Text style={styles.counterText}>Clicks: {clickCount}</Text>
      </Pressable>
      <OverlappingCardsScrollRNFocusTrigger>Make principal</OverlappingCardsScrollRNFocusTrigger>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  )
}

function RNWebTabsContainer({
  children,
  style,
  ariaLabel,
}: OverlappingCardsScrollRNTabsContainerProps) {
  return (
    <View style={[styles.tabsContainer, style]} accessibilityRole="tablist" accessibilityLabel={ariaLabel}>
      {children}
    </View>
  )
}

function RNWebTab({
  name,
  isPrincipal,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityState,
  onPress,
  onClick,
}: OverlappingCardsScrollRNTabProps) {
  const handlePress = () => {
    onClick?.()
    onPress?.()
  }

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.tab,
        isPrincipal && styles.tabActive,
        pressed && styles.tabPressed,
        style,
      ]}
    >
      <Text style={[styles.tabText, isPrincipal && styles.tabTextActive, textStyle]}>{name}</Text>
    </Pressable>
  )
}

export function RNWebDemo() {
  return (
    <View style={styles.root}>
      <Text style={styles.helperText}>React Native Web Prototype (View/Text/ScrollView)</Text>
      <OverlappingCardsScrollRN
        cardHeight={260}
        basePeek={58}
        showPageDots
        pageDotsPosition="below"
        pageDotsOffset={10}
        showTabs
        tabsPosition="above"
        tabsOffset={10}
        tabsComponent={RNWebTab}
        tabsContainerComponent={RNWebTabsContainer}
        cardContainerStyle={styles.cardContainer}
        showsHorizontalScrollIndicator
        items={RN_DEMO_CARDS.map((card) => ({
          id: card.id,
          name: card.title,
          jsx: <RNCard {...card} />,
        }))}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
  },
  helperText: {
    color: '#2f4d65',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  tab: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(31, 70, 102, 0.26)',
    backgroundColor: '#eef6ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginHorizontal: 4,
    marginVertical: 4,
  },
  tabActive: {
    backgroundColor: '#1f4666',
    borderColor: '#1f4666',
  },
  tabPressed: {
    opacity: 0.82,
  },
  tabText: {
    color: '#1f4666',
    fontSize: 12,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#f4f9ff',
  },
  cardContainer: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(17, 43, 69, 0.13)',
    backgroundColor: '#ffffff',
    padding: 12,
    shadowColor: '#102841',
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  bar: {
    width: '100%',
    height: 5,
    borderRadius: 99,
    marginBottom: 8,
  },
  tag: {
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#4a6b84',
    fontWeight: '700',
    marginBottom: 4,
  },
  counter: {
    alignSelf: 'flex-start',
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(30, 67, 99, 0.25)',
    backgroundColor: '#f3f8ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 6,
  },
  counterText: {
    color: '#1f4666',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  title: {
    color: '#173047',
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '700',
    marginBottom: 6,
  },
  body: {
    color: '#2f4d65',
    fontSize: 16,
    lineHeight: 23,
  },
})
