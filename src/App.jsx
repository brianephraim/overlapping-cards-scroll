import { useEffect, useMemo, useState } from 'react'
import { OverlappingCardsScroll } from './lib'
import './App.css'

const DEMO_PAGES = {
  basic: {
    label: 'Foundation',
    title: 'Basic Narrative Cards',
    description:
      'Single-column content cards to validate overlap behavior and card progression between indices.',
  },
  content: {
    label: 'Rich Content',
    title: 'Product-Rich Cards',
    description:
      'Mixed content cards with badges, metrics, and lists to test realistic card body composition.',
  },
  stress: {
    label: 'Stress Test',
    title: 'Many-Card Stack',
    description:
      'A larger deck to verify left-edge visibility and spacing when many cards share the same container.',
  },
}

const BASIC_CARD_DATA = [
  {
    id: 'brief',
    tag: 'Card 01',
    title: 'Project Brief',
    body: 'Define constraints for overlap transitions and lock the single-card focus model.',
    accent: '#0f8b8d',
  },
  {
    id: 'wire',
    tag: 'Card 02',
    title: 'Wireframe Pass',
    body: 'Block out card rhythm so each next card emerges cleanly while previous cards stay visible.',
    accent: '#f4a261',
  },
  {
    id: 'build',
    tag: 'Card 03',
    title: 'Component Build',
    body: 'Translate the movement math into a reusable React component and expose sensible props.',
    accent: '#2a9d8f',
  },
  {
    id: 'qa',
    tag: 'Card 04',
    title: 'QA Pass',
    body: 'Validate that all left edges remain visible and that each card becomes the primary surface.',
    accent: '#e76f51',
  },
  {
    id: 'ship',
    tag: 'Card 05',
    title: 'Ship & Iterate',
    body: 'Collect feedback and tune peek spacing for dense decks and small viewport widths.',
    accent: '#3a86ff',
  },
]

const CONTENT_CARD_DATA = [
  {
    id: 'alpha',
    label: 'Alpha Batch',
    title: 'Telemetry Dashboard',
    score: '98% uptime',
    bullets: ['Session replay linked', 'Errors grouped by fingerprint', 'Deploy metadata attached'],
    tone: '#335c67',
  },
  {
    id: 'beta',
    label: 'Beta Batch',
    title: 'Launch Checklist',
    score: '11 blockers',
    bullets: ['Input validation pass', 'Release note draft', 'Rollback script verified'],
    tone: '#9e2a2b',
  },
  {
    id: 'gamma',
    label: 'Gamma Batch',
    title: 'Customer Signals',
    score: '42 insights',
    bullets: ['Top 3 feature requests', 'NPS segment summary', 'Renewal risk watchlist'],
    tone: '#386641',
  },
  {
    id: 'delta',
    label: 'Delta Batch',
    title: 'Growth Snapshot',
    score: '+18.4% QoQ',
    bullets: ['Acquisition costs down', 'Activation path cleaned', 'Retention curve improving'],
    tone: '#7c3aed',
  },
]

const STRESS_CARD_COUNT = 14

const pageOrder = Object.keys(DEMO_PAGES)

const parseHashPage = () => {
  const hash = window.location.hash.replace('#', '').trim().toLowerCase()
  if (hash && DEMO_PAGES[hash]) {
    return hash
  }
  return pageOrder[0]
}

function BasicCard({ tag, title, body, accent }) {
  const [clickCount, setClickCount] = useState(0)

  return (
    <article className="demo-card basic-card" style={{ '--card-accent': accent }}>
      <p className="card-tag">{tag}</p>
      <button type="button" className="card-counter" onClick={() => setClickCount((count) => count + 1)}>
        Clicks: {clickCount}
      </button>
      <h3>{title}</h3>
      <p>{body}</p>
    </article>
  )
}

function ContentCard({ label, title, score, bullets, tone }) {
  const [clickCount, setClickCount] = useState(0)

  return (
    <article className="demo-card content-card" style={{ '--card-accent': tone }}>
      <header className="content-card-header">
        <span>{label}</span>
        <strong>{score}</strong>
      </header>
      <button type="button" className="card-counter" onClick={() => setClickCount((count) => count + 1)}>
        Clicks: {clickCount}
      </button>
      <h3>{title}</h3>
      <ul>
        {bullets.map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>
    </article>
  )
}

function StressCard({ index }) {
  const [clickCount, setClickCount] = useState(0)
  const hue = (index * 25) % 360
  return (
    <article
      className="demo-card stress-card"
      style={{ '--stress-tone': `hsl(${hue} 65% 45%)` }}
    >
      <p className="card-tag">Card {String(index + 1).padStart(2, '0')}</p>
      <button type="button" className="card-counter" onClick={() => setClickCount((count) => count + 1)}>
        Clicks: {clickCount}
      </button>
      <h3>Deck Position #{index + 1}</h3>
      <p>Edge visibility remains maintained while this card joins the active position.</p>
    </article>
  )
}

function DemoStage({ pageId }) {
  if (pageId === 'content') {
    return (
      <OverlappingCardsScroll cardHeight={320} basePeek={68}>
        {CONTENT_CARD_DATA.map((card) => (
          <ContentCard key={card.id} {...card} />
        ))}
      </OverlappingCardsScroll>
    )
  }

  if (pageId === 'stress') {
    return (
      <OverlappingCardsScroll cardHeight={250} basePeek={58} minPeek={4}>
        {Array.from({ length: STRESS_CARD_COUNT }, (_, index) => (
          <StressCard key={`stress-${index}`} index={index} />
        ))}
      </OverlappingCardsScroll>
    )
  }

  return (
    <OverlappingCardsScroll cardHeight={280} basePeek={64}>
      {BASIC_CARD_DATA.map((card) => (
        <BasicCard key={card.id} {...card} />
      ))}
    </OverlappingCardsScroll>
  )
}

function App() {
  const [pageId, setPageId] = useState(() => parseHashPage())

  useEffect(() => {
    const onHashChange = () => {
      setPageId(parseHashPage())
    }

    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    const hash = `#${pageId}`
    if (window.location.hash !== hash) {
      window.history.replaceState(null, '', hash)
    }
  }, [pageId])

  const page = useMemo(() => DEMO_PAGES[pageId] ?? DEMO_PAGES.basic, [pageId])

  return (
    <main className="app-shell">
      <header className="app-hero">
        <p className="eyebrow">Component Library Sandbox</p>
        <h1>OverlappingCardsScroll</h1>
        <p>
          Horizontal scroll drives a stacked card deck where each next card takes focus while previous cards keep a
          visible leading edge.
        </p>
      </header>

      <nav className="demo-nav" aria-label="Demo page selector">
        {pageOrder.map((id) => (
          <button
            key={id}
            type="button"
            className={id === pageId ? 'is-active' : ''}
            onClick={() => setPageId(id)}
          >
            {DEMO_PAGES[id].label}
          </button>
        ))}
      </nav>

      <section className="demo-page" aria-live="polite">
        <div className="demo-page-header">
          <h2>{page.title}</h2>
          <p>{page.description}</p>
        </div>
        <DemoStage pageId={pageId} />
      </section>

      <section className="api-notes">
        <h2>Component Usage</h2>
        <pre>
          <code>{`import { OverlappingCardsScroll } from './lib'

<OverlappingCardsScroll cardHeight={280}>
  {cards.map((card) => (
    <Card key={card.id} {...card} />
  ))}
</OverlappingCardsScroll>`}</code>
        </pre>
      </section>
    </main>
  )
}

export default App
