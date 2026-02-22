import { useState } from 'react'
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import {
  OverlappingCardsScrollRN,
  OverlappingCardsScrollRNFocusTrigger,
} from './src/rn/OverlappingCardsScrollRN.native'

const LONG_SCROLL_LINES = [
  'Line 01: Long-form content inside this card should scroll vertically.',
  'Line 02: This verifies nested vertical scrolling within a horizontal deck.',
  'Line 03: Keep dragging up and down inside the body region.',
  'Line 04: Horizontal deck movement should remain independent.',
  'Line 05: The card shell should stay fixed in the overlap stack.',
  'Line 06: Only this text area should vertically scroll.',
  'Line 07: This helps validate realistic card-heavy content.',
  'Line 08: The stress deck below still checks edge visibility.',
  'Line 09: Counters should continue incrementing on tap.',
  'Line 10: Tap and scroll behaviors should coexist cleanly.',
  'Line 11: This content intentionally exceeds visible height.',
  'Line 12: Directional gestures should feel predictable on iOS.',
  'Line 13: Overflow clipping remains active in stress mode.',
  'Line 14: Card order and overlap math should remain stable.',
  'Line 15: Motion should stay smooth as card focus changes.',
  'Line 16: Continue scrolling to confirm no visual jitter.',
  'Line 17: This line is filler for longer body testing.',
  'Line 18: Another line to extend vertical content depth.',
  'Line 19: Yet another line to support realistic payload size.',
  'Line 20: End of the embedded vertical scroll test block.',
]

const EXPO_CARDS = [
  {
    id: 'expo-1',
    tag: 'Card 01',
    title: 'Expo Native',
    body: 'This demo runs through Expo using the same RN-only component implementation.',
    color: '#0d9488',
  },
  {
    id: 'expo-2',
    tag: 'Card 02',
    title: 'Nested Scroll Content',
    body: 'This card includes its own vertical ScrollView for long text.',
    color: '#f97316',
    scrollLines: LONG_SCROLL_LINES,
  },
  {
    id: 'expo-3',
    tag: 'Card 03',
    title: 'Fanned Stack',
    body: 'Each card maintains a visible leading edge as newer cards move into focus.',
    color: '#2563eb',
  },
  {
    id: 'expo-4',
    tag: 'Card 04',
    title: 'Shared Logic',
    body: 'Layout math and card progression mirror the web prototype implementation.',
    color: '#7c3aed',
  },
]

const STRESS_CARD_COUNT = 14

const STRESS_CARDS = Array.from({ length: STRESS_CARD_COUNT }, (_, index) => {
  const hue = (index * 24) % 360

  return {
    id: `stress-${index + 1}`,
    tag: `Card ${String(index + 1).padStart(2, '0')}`,
    title: `Stress Position #${index + 1}`,
    body: 'Dense stack to validate clipping, layering, and scroll progression.',
    color: `hsl(${hue}, 65%, 45%)`,
  }
})

const WIDTH_EXAMPLE_CARDS = [
  {
    id: 'width-1',
    tag: 'Card A',
    title: 'Width Example A',
    body: 'Card width example set.',
    color: '#0f8b8d',
  },
  {
    id: 'width-2',
    tag: 'Card B',
    title: 'Width Example B',
    body: 'Compare how overlap changes per width.',
    color: '#f4a261',
  },
  {
    id: 'width-3',
    tag: 'Card C',
    title: 'Width Example C',
    body: 'Each deck uses the same content, only width changes.',
    color: '#3a86ff',
  },
  {
    id: 'width-4',
    tag: 'Card D',
    title: 'Width Example D',
    body: 'Useful for tuning native layout targets.',
    color: '#8338ec',
  },
]

const IOS_WIDTH_EXAMPLES = [
  { label: '50%', value: '50%' },
  { label: '75%', value: '75%' },
  { label: '150', value: 150 },
  { label: '250', value: 250 },
]

function ExpoCard({ tag, title, body, color, scrollLines = undefined }) {
  const [clickCount, setClickCount] = useState(0)

  return (
    <View style={styles.card}>
      <View style={[styles.bar, { backgroundColor: color }]} />
      <Text style={styles.tag}>{tag}</Text>
      <Pressable style={styles.counter} onPress={() => setClickCount((count) => count + 1)}>
        <Text style={styles.counterText}>Clicks: {clickCount}</Text>
      </Pressable>
      <OverlappingCardsScrollRNFocusTrigger>Make principal</OverlappingCardsScrollRNFocusTrigger>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardBody}>{body}</Text>
      {scrollLines ? (
        <View style={styles.innerScrollFrame}>
          <ScrollView nestedScrollEnabled showsVerticalScrollIndicator contentContainerStyle={styles.innerScrollContent}>
            {scrollLines.map((line, index) => (
              <Text key={`line-${index + 1}`} style={styles.innerScrollLine}>
                {line}
              </Text>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  )
}

export default function App() {
  const normalCardHeight = Platform.OS === 'ios' ? 500 : 280
  const stressCardHeight = Platform.OS === 'ios' ? 500 : 280

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.pageContent}>
      <Text style={styles.eyebrow}>Expo Development Target</Text>
      <Text style={styles.title}>OverlappingCardsScroll</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Normal Instance</Text>
        <Text style={styles.sectionDescription}>Base deck with nested vertical content inside card 2.</Text>
        <OverlappingCardsScrollRN
          cardHeight={normalCardHeight}
          basePeek={58}
          minPeek={10}
          showPageDots
          pageDotsPosition="above"
          pageDotsOffset={8}
        >
          {EXPO_CARDS.map((card) => (
            <ExpoCard key={card.id} {...card} />
          ))}
        </OverlappingCardsScrollRN>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Stress Instance</Text>
        <Text style={styles.sectionDescription}>Dense 14-card stack for overlap and clipping verification.</Text>
        <OverlappingCardsScrollRN
          cardHeight={stressCardHeight}
          basePeek={46}
          minPeek={4}
          showPageDots
          pageDotsPosition="below"
          pageDotsOffset={10}
        >
          {STRESS_CARDS.map((card) => (
            <ExpoCard key={card.id} {...card} />
          ))}
        </OverlappingCardsScrollRN>
      </View>

      {Platform.OS === 'ios' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Card Width Examples (iOS)</Text>
          <Text style={styles.sectionDescription}>Testing new `cardWidth` prop values.</Text>
          {IOS_WIDTH_EXAMPLES.map((example) => (
            <View key={`width-example-${example.label}`} style={styles.widthExample}>
              <Text style={styles.widthExampleLabel}>cardWidth={example.label}</Text>
              <OverlappingCardsScrollRN
                cardHeight={360}
                cardWidth={example.value}
                basePeek={42}
                minPeek={4}
                showPageDots
                pageDotsPosition="overlay"
                pageDotsOffset={10}
              >
                {WIDTH_EXAMPLE_CARDS.map((card) => (
                  <ExpoCard key={`${example.label}-${card.id}`} {...card} />
                ))}
              </OverlappingCardsScrollRN>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#f0e8da',
  },
  pageContent: {
    paddingTop: 56,
    paddingHorizontal: 14,
    paddingBottom: 40,
  },
  eyebrow: {
    color: '#2f4d65',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    fontWeight: '700',
    marginBottom: 6,
  },
  title: {
    color: '#173047',
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '700',
    marginBottom: 14,
  },
  section: {
    marginBottom: 26,
  },
  widthExample: {
    marginBottom: 16,
  },
  widthExampleLabel: {
    color: '#284a62',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  sectionTitle: {
    color: '#173047',
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionDescription: {
    color: '#315570',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    marginBottom: 8,
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
  cardTitle: {
    color: '#173047',
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '700',
    marginBottom: 6,
  },
  cardBody: {
    color: '#2f4d65',
    fontSize: 16,
    lineHeight: 23,
    marginBottom: 8,
  },
  innerScrollFrame: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(30, 67, 99, 0.2)',
    backgroundColor: '#f5f9ff',
    paddingHorizontal: 10,
    paddingVertical: 8,
    height: 190,
  },
  innerScrollContent: {
    paddingBottom: 8,
  },
  innerScrollLine: {
    color: '#2f4d65',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
})
