import { useState } from 'react'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { OverlappingCardsScrollRN } from './src/rn/OverlappingCardsScrollRN'

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
    title: 'Scroll Controlled',
    body: 'Horizontal ScrollView offset controls the active transition between cards.',
    color: '#f97316',
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
    body: 'Stress scenario with a dense stack to validate clipping, layering, and scroll progression.',
    color: `hsl(${hue}, 65%, 45%)`,
  }
})

function ExpoCard({ tag, title, body, color }) {
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
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardBody}>{body}</Text>
    </View>
  )
}

export default function App() {
  const [mode, setMode] = useState('default')
  const demoCardHeight = Platform.OS === 'ios' ? 500 : 250
  const activeMode = Platform.OS === 'ios' ? mode : 'default'
  const activeCards = activeMode === 'stress' ? STRESS_CARDS : EXPO_CARDS
  const activePeek = activeMode === 'stress' ? 46 : 58
  const activeMinPeek = activeMode === 'stress' ? 4 : 10

  return (
    <View style={styles.root}>
      <Text style={styles.eyebrow}>Expo Development Target</Text>
      <Text style={styles.title}>OverlappingCardsScroll</Text>
      {Platform.OS === 'ios' && (
        <View style={styles.modeSwitch}>
          <Pressable
            style={[styles.modeButton, activeMode === 'default' && styles.modeButtonActive]}
            onPress={() => setMode('default')}
          >
            <Text style={[styles.modeButtonText, activeMode === 'default' && styles.modeButtonTextActive]}>
              Demo
            </Text>
          </Pressable>
          <Pressable
            style={[styles.modeButton, activeMode === 'stress' && styles.modeButtonActive]}
            onPress={() => setMode('stress')}
          >
            <Text style={[styles.modeButtonText, activeMode === 'stress' && styles.modeButtonTextActive]}>
              Stress Test
            </Text>
          </Pressable>
        </View>
      )}
      {activeMode === 'stress' && (
        <Text style={styles.modeHint}>iOS stress-test screen with 14 cards.</Text>
      )}
      <OverlappingCardsScrollRN cardHeight={demoCardHeight} basePeek={activePeek} minPeek={activeMinPeek}>
        {activeCards.map((card) => (
          <ExpoCard key={card.id} {...card} />
        ))}
      </OverlappingCardsScrollRN>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f0e8da',
    paddingTop: 56,
    paddingHorizontal: 14,
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
  modeSwitch: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  modeButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(27, 52, 78, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingVertical: 7,
    paddingHorizontal: 14,
    marginRight: 8,
  },
  modeButtonActive: {
    backgroundColor: '#173047',
    borderColor: '#173047',
  },
  modeButtonText: {
    color: '#284a62',
    fontSize: 14,
    fontWeight: '700',
  },
  modeButtonTextActive: {
    color: '#f4f8ff',
  },
  modeHint: {
    color: '#315570',
    fontSize: 13,
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
  },
})
