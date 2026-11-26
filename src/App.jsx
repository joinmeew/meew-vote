import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { supabase } from './supabase'
import { getVoterToken } from './token'
import MeewLogo from './MeewLogo'
import './styles.css'

const numeric = (value) => {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

export default function App() {
  const [questions, setQuestions] = useState([])
  const [index, setIndex] = useState(0)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)
  const [error, setError] = useState('')
  const [chosenVote, setChosenVote] = useState(null)
  const [votePulse, setVotePulse] = useState(null)
  const [animationResult, setAnimationResult] = useState(null)
  const voterToken = useMemo(() => getVoterToken(), [])

  const question = questions[index]
  const finished = questions.length > 0 && index >= questions.length

  useEffect(() => { loadQuestions() }, [])

  async function loadQuestions() {
    setLoading(true)
    setError('')
    const { data, error: queryError } = await supabase.rpc('get_public_questions')
    if (queryError) {
      setError(queryError.message)
      setLoading(false)
      return
    }
    const list = Array.isArray(data) ? data.slice(0, 3) : []
    setQuestions(list)
    setIndex(0)
    setLoading(false)
    if (list.length) await restoreResult(list[0].id)
  }

  async function restoreResult(questionId) {
    const { data, error: queryError } = await supabase.rpc('get_vote_results', {
      p_question_id: questionId,
      p_voter_token: voterToken,
    })
    if (!queryError && Array.isArray(data) && data.length) {
      setResult(data[0])
      setChosenVote(data[0].user_vote)
    } else {
      setResult(null)
      setChosenVote(null)
    }
  }

  async function submitVote(vote) {
    if (!question || voting) return
    setVoting(true)
    setError('')
    setChosenVote(vote)
    setVotePulse(vote ? 'yes' : 'no')

    const { data, error: voteError } = await supabase.rpc('submit_vote', {
      p_question_id: question.id,
      p_vote: vote,
      p_voter_token: voterToken,
    })

    if (voteError) {
      setError(voteError.message)
      setVoting(false)
      setChosenVote(null)
      setVotePulse(null)
      return
    }

    const nextResult = Array.isArray(data) ? data[0] : null
    setAnimationResult(nextResult)
    // Reveal the result while the final sparks are still fading.
    await new Promise((resolve) => setTimeout(resolve, 770))
    setResult(nextResult)
    await new Promise((resolve) => setTimeout(resolve, 350))
    setVotePulse(null)
    setAnimationResult(null)
    setVoting(false)
  }

  async function skipQuestion() {
    if (voting) return
    const nextIndex = index + 1
    setResult(null)
    setChosenVote(null)
    setError('')
    setIndex(nextIndex)
    if (nextIndex < questions.length) await restoreResult(questions[nextIndex].id)
  }

  async function nextQuestion() {
    const nextIndex = index + 1
    setResult(null)
    setChosenVote(null)
    setAnimationResult(null)
    setIndex(nextIndex)
    if (nextIndex < questions.length) await restoreResult(questions[nextIndex].id)
  }

  async function share() {
    const shareData = {
      title: 'MEEW',
      text: 'Three questions. Two choices. See what people really think.',
      url: window.location.href,
    }
    try {
      if (navigator.share) await navigator.share(shareData)
      else {
        await navigator.clipboard.writeText(window.location.href)
        window.alert('Link copied.')
      }
    } catch {}
  }

  if (loading) {
    return <main className="scene center"><Ambient /><MeewLogo /><div className="loading-line" /><p className="eyebrow">ASK · VOTE · DISCOVER</p></main>
  }

  if (error && !questions.length) {
    return <main className="scene center"><Ambient /><section className="message"><MeewLogo compact /><h1>We couldn’t load the questions.</h1><p>{error}</p><button className="primary" onClick={loadQuestions}>Try again</button></section></main>
  }

  if (!questions.length) {
    return <main className="scene center"><Ambient /><section className="message"><MeewLogo compact /><h1>No questions are available yet.</h1><p>Check back soon.</p></section></main>
  }

  if (finished) {
    return (
      <main className="scene center">
        <Ambient strong />
        <motion.section className="finish" initial={{ opacity: 0, scale: .97 }} animate={{ opacity: 1, scale: 1 }}>
          <MeewLogo />
          <div className="finish-core">3/3</div>
          <h1>You’ve had your say.</h1>
          <p>Now see what your friends think.</p>
          <button className="primary" onClick={share}>Share with friends</button>
          <button className="ghost" onClick={() => window.location.reload()}>Start over</button>
        </motion.section>
      </main>
    )
  }

  const progress = ((index + (result ? 1 : 0)) / questions.length) * 100

  return (
    <main className="scene">
      <Ambient strong={chosenVote !== null} />
      <header className="header">
        <MeewLogo compact animated={false} />
        <div className="counter">{index + 1} / {questions.length}</div>
      </header>

      <div className="progress"><motion.div animate={{ width: `${progress}%` }} /></div>

      <section className="stage">
        <AnimatePresence mode="wait">
          <motion.article
            key={question.id}
            className={`question ${votePulse ? `vote-transition ${votePulse}` : ''}`}
          >
            <div className="meta">
              <span>{question.category || 'TODAY'}</span>
              {question.editor_pick && <span>EDITOR’S PICK</span>}
            </div>

            <h1>{question.prompt || question.question}</h1>

            <VoteJourney active={Boolean(votePulse)} vote={chosenVote} result={animationResult || result} />

            <div className={`response-zone ${result ? 'show-result' : ''}`}>
              {!result && (
                <div className="vote-choice-area">
                  <div className="votes vote-layer">
                    <VoteButton label={question.yes_label || 'YES'} kind="yes" active={chosenVote === true} disabled={voting} onClick={() => submitVote(true)} />
                    <VoteButton label={question.no_label || 'NO'} kind="no" active={chosenVote === false} disabled={voting} onClick={() => submitVote(false)} />
                  </div>
                  <button className="not-for-me" type="button" disabled={voting} onClick={skipQuestion}>
                    Not for me <span aria-hidden="true">→</span>
                  </button>
                </div>
              )}
              {result && <Results result={result} onNext={nextQuestion} isLast={index === questions.length - 1} />}
            </div>

            {error && <p className="inline-error">{error}</p>}
          </motion.article>
        </AnimatePresence>
      </section>

      <footer>Your vote is private.</footer>
    </main>
  )
}

function VoteJourney({ active, vote, result }) {
  const yesPercent = numeric(result?.yes_percent)
  const particles = Array.from({ length: 76 }, (_, i) => {
    const isYes = result ? i < Math.round((yesPercent / 100) * 76) : i % 2 === 0
    const angle = (i * 137.5) * Math.PI / 180
    const radius = 34 + ((i * 29) % 250)
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius * .62,
      yes: isYes,
      delay: .88 + (i % 12) * .026,
      size: 2 + (i % 4),
    }
  })

  return (
    <div className={`vote-journey ${active ? 'running' : ''} ${vote === true ? 'yes' : vote === false ? 'no' : ''}`} aria-hidden="true">
      <span className="gather-ring" />
      <span className="traveller-trail" />
      <span className="traveller" />
      <div className="community-field">
        {particles.map((p, i) => (
          <span key={i} className={`community-dot ${p.yes ? 'yes-dot' : 'no-dot'}`} style={{ '--x': `${p.x}px`, '--y': `${p.y}px`, '--delay': `${p.delay}s`, '--size': `${p.size}px` }} />
        ))}
        <span className="burst-halo" />
        <span className="burst-rays" />
        <span className="arrival-ring" />
        <span className="spark s1" /><span className="spark s2" /><span className="spark s3" /><span className="spark s4" /><span className="spark s5" /><span className="spark s6" />
        <span className="my-vote-dot" />
      </div>
    </div>
  )
}

function VoteButton({ label, kind, active, disabled, onClick }) {
  return <motion.button className={`vote ${kind} ${active ? 'active' : ''}`} whileHover={{ y: -4, scale: 1.025 }} whileTap={{ scale: .96 }} disabled={disabled} onClick={onClick}>{label}</motion.button>
}

function Results({ result, onNext, isLast }) {
  const yes = numeric(result.yes_percent)
  const no = numeric(result.no_percent)
  return (
    <motion.div className="results" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .18, ease: [0.22, 1, 0.36, 1] }}>
      <p className="your-vote">You voted <strong>{result.user_vote === true ? 'YES' : 'NO'}</strong>.</p>
      <SplitResultBar yes={yes} no={no} />
      <p className="total">{numeric(result.total_count)} total vote{numeric(result.total_count) === 1 ? '' : 's'}</p>
      <button className="primary" onClick={onNext}>{isLast ? 'Complete' : 'Next question'}</button>
    </motion.div>
  )
}

function SplitResultBar({ yes, no }) {
  const safeYes = Math.max(0, Math.min(100, numeric(yes)))
  const safeNo = Math.max(0, Math.min(100, numeric(no)))
  const blend = 3.2
  const leftBlend = Math.max(0, safeYes - blend)
  const rightBlend = Math.min(100, safeYes + blend)

  return (
    <div className="split-result" aria-label={`YES ${safeYes.toFixed(1)}%, NO ${safeNo.toFixed(1)}%`}>
      <span className="split-label yes-label">YES</span>
      <div className="liquid-result-track">
        <motion.div
          className="liquid-result-fill"
          initial={{ opacity: 0, scaleX: .985 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: .34, ease: [0.22, 1, 0.36, 1] }}
          style={{
            '--yes-stop': `${leftBlend}%`,
            '--blend-mid': `${safeYes}%`,
            '--no-start': `${rightBlend}%`,
          }}
        >
          <span className="liquid-sheen" />
          <span className="liquid-wave wave-one" />
          <span className="liquid-wave wave-two" />
        </motion.div>
        <span className="split-percent yes-percent" style={{ width: `${safeYes}%` }}>{safeYes.toFixed(1)}%</span>
        <span className="split-percent no-percent" style={{ width: `${safeNo}%` }}>{safeNo.toFixed(1)}%</span>
      </div>
      <span className="split-label no-label">NO</span>
    </div>
  )
}

function Ambient({ strong = false }) {
  return <div className={`ambient ${strong ? 'strong' : ''}`} aria-hidden="true"><span className="pink" /><span className="blue" /><span className="noise" /></div>
}
