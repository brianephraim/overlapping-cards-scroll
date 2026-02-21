import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import {
  OverlappingCardsScrollRN,
  OverlappingCardsScrollRNFocusTrigger,
} from './OverlappingCardsScrollRN'

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

export function RNWebDemo() {
  return (
    <View style={styles.root}>
      <Text style={styles.helperText}>React Native Web Prototype (View/Text/ScrollView)</Text>
      <OverlappingCardsScrollRN cardHeight={260} basePeek={58} showsHorizontalScrollIndicator>
        {RN_DEMO_CARDS.map((card) => (
          <RNCard key={card.id} {...card} />
        ))}
      </OverlappingCardsScrollRN>
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
