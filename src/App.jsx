import { useState, useCallback } from 'react'

const POWER_WORDS = {
  urgency: ['now', 'today', 'hurry', 'fast', 'quick', 'instant', 'immediately', 'rush', 'limited', 'deadline', 'expires', 'last chance', 'final', 'ending soon', 'don\'t miss'],
  curiosity: ['secret', 'discover', 'reveal', 'hidden', 'unlock', 'little-known', 'surprising', 'unexpected', 'strange', 'weird', 'shocking', 'unbelievable', 'mystery'],
  value: ['free', 'save', 'bonus', 'exclusive', 'deal', 'discount', 'bargain', 'affordable', 'cheap', 'half price', 'reduced', 'gift', 'complimentary', 'reward'],
  exclusivity: ['exclusive', 'members only', 'invitation', 'private', 'vip', 'select', 'insider', 'elite', 'premium', 'limited edition', 'handpicked', 'curated'],
  action: ['boost', 'transform', 'upgrade', 'maximize', 'accelerate', 'supercharge', 'skyrocket', 'dominate', 'crush', 'master', 'proven', 'guaranteed', 'ultimate', 'essential', 'breakthrough', 'revolutionary']
}

const SPAM_TRIGGERS = {
  high: ['act now', 'buy now', 'buy direct', 'click here', 'click below', 'congratulations', 'dear friend', 'dear member', '100% free', 'you\'re a winner', 'you have been selected', 'this isn\'t spam', 'not spam', 'we hate spam', 'no obligation', 'winner', 'lottery', 'casino', 'viagra', 'weight loss', 'work from home', 'make money', 'earn extra cash', 'double your', 'million dollars', 'risk free', 'no risk', 'as seen on', 'click to remove', 'apply now', 'order now', 'supplies limited'],
  medium: ['free', 'guarantee', 'no cost', 'no fees', 'limited time', 'offer expires', 'act immediately', 'urgent', 'call now', 'do it today', 'don\'t hesitate', 'once in a lifetime', 'special promotion', 'while supplies last', 'what are you waiting for', 'incredible deal', 'amazing', 'unbelievable', 'fantastic offer', 'lowest price', 'best price', 'satisfaction guaranteed', 'money back', 'no questions asked', 'no strings attached', 'no purchase necessary', 'bonus', 'prize'],
  low: ['reminder', 'help', 'percent off', '% off', 'sale', 'save', 'deal', 'offer', 'clearance', 'discount', 'compare', 'opportunity', 'solution', 'introducing', 'announcing', 'new', 'improved', 'revolutionary']
}

const FLAGGED_CONTENT = {
  profanity: [
    'fuck', 'fucker', 'fucking', 'fucked', 'fucks', 'motherfucker',
    'shit', 'shitty', 'bullshit', 'horseshit',
    'ass', 'asshole', 'dumbass', 'badass', 'jackass',
    'bitch', 'bitches', 'bitchy',
    'damn', 'goddamn', 'dammit',
    'crap', 'crappy',
    'what the hell', 'go to hell',
    'dick', 'dickhead',
    'piss', 'pissed', 'pissing',
    'bastard', 'bastards',
    'cunt', 'twat',
    'wtf', 'stfu', 'lmfao',
  ],
  scam: [
    'verify your account', 'confirm your identity', 'confirm your account',
    'account suspended', 'account has been', 'account will be closed',
    'unauthorized access', 'unauthorized transaction', 'suspicious activity',
    'update your payment', 'update your billing', 'verify your payment',
    'wire transfer', 'bank account details', 'send money',
    'inheritance', 'nigerian prince', 'beneficiary',
    'guaranteed income', 'get rich quick', 'get rich fast',
    'no experience needed', 'no experience required',
    'social security number', 'ssn', 'credit card number',
    'password reset', 'reset your password', 'login credentials',
    'irs refund', 'tax refund', 'claim your refund',
    'your package', 'delivery failed', 'shipment on hold',
    'invoice attached', 'payment overdue', 'outstanding payment',
    'you owe', 'pay immediately', 'legal action',
    'final warning', 'account locked', 'security alert',
    'click to verify', 'verify now', 'confirm now',
    'cryptocurrency', 'bitcoin profit', 'crypto investment',
  ],
  deceptive: [
    'your account is at risk', 'immediate action required',
    'you\'ve been chosen', 'specially selected',
    'act before it\'s too late', 'expiring immediately',
    'this is not a scam', 'this is legitimate', 'this is real',
    'secret method', 'they don\'t want you to know',
    'one weird trick', 'doctors hate',
    'government grant', 'free government money',
    'lose weight fast', 'lose pounds', 'burn fat',
    'enlarge', 'enhancement', 'male enhancement',
    'nigerian', 'foreign lottery', 'international lottery',
    'dear customer', 'dear user', 'dear valued',
    'from the desk of', 'confidential',
  ]
}

function checkFlaggedContent(lower, words) {
  const found = { profanity: [], scam: [], deceptive: [] }
  for (const [category, phrases] of Object.entries(FLAGGED_CONTENT)) {
    for (const phrase of phrases) {
      if (phrase.includes(' ')) {
        if (lower.includes(phrase)) found[category].push(phrase)
      } else {
        const regex = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
        if (regex.test(lower)) found[category].push(phrase)
      }
    }
  }
  const hasProfanity = found.profanity.length > 0
  const hasScam = found.scam.length > 0
  const hasDeceptive = found.deceptive.length > 0
  const totalFlags = found.profanity.length + found.scam.length + found.deceptive.length

  let score = 100
  if (hasProfanity) score -= found.profanity.length * 30
  if (hasScam) score -= found.scam.length * 40
  if (hasDeceptive) score -= found.deceptive.length * 25
  score = Math.max(0, score)

  // Hard cap: if any scam or profanity detected, score can't exceed 15
  if (hasScam || hasProfanity) score = Math.min(score, 15)
  else if (hasDeceptive) score = Math.min(score, 30)

  return { score, found, hasProfanity, hasScam, hasDeceptive, totalFlags }
}

function analyzeSubjectLine(subject) {
  if (!subject.trim()) return null
  const lower = subject.toLowerCase()
  const words = subject.trim().split(/\s+/)
  const charCount = subject.length
  const wordCount = words.length

  // Length analysis
  let lengthScore = 100
  if (charCount < 20) lengthScore = 40
  else if (charCount < 30) lengthScore = 70
  else if (charCount <= 60) lengthScore = 100
  else if (charCount <= 70) lengthScore = 75
  else if (charCount <= 90) lengthScore = 50
  else lengthScore = 30

  const lengthWarnings = []
  if (charCount > 70) lengthWarnings.push('Gmail will truncate this subject line on desktop')
  if (charCount > 40) lengthWarnings.push('May be truncated on mobile devices')
  if (charCount < 20) lengthWarnings.push('Very short — may lack context for the reader')
  if (wordCount < 3) lengthWarnings.push('Consider adding more descriptive words')
  if (wordCount > 12) lengthWarnings.push('Long subject lines tend to have lower open rates')

  // Power words
  const foundPowerWords = {}
  let totalPowerWords = 0
  for (const [category, wordList] of Object.entries(POWER_WORDS)) {
    const found = wordList.filter(w => lower.includes(w))
    if (found.length > 0) {
      foundPowerWords[category] = found
      totalPowerWords += found.length
    }
  }
  let powerScore = totalPowerWords === 0 ? 40 : totalPowerWords <= 2 ? 100 : totalPowerWords <= 3 ? 75 : 50

  // Spam triggers
  const foundSpam = { high: [], medium: [], low: [] }
  for (const [severity, triggers] of Object.entries(SPAM_TRIGGERS)) {
    for (const trigger of triggers) {
      if (lower.includes(trigger)) {
        foundSpam[severity].push(trigger)
      }
    }
  }
  const spamPenalty = foundSpam.high.length * 25 + foundSpam.medium.length * 12 + foundSpam.low.length * 5
  const spamScore = Math.max(0, 100 - spamPenalty)

  // Personalization
  const hasMergeTag = /\{[a-z_]+\}|\{\{[a-z_]+\}\}|\[FNAME\]|\[NAME\]|\*\|[A-Z]+\|\*/i.test(subject)
  const hasQuestion = subject.includes('?')
  const hasNumber = /\d/.test(subject)
  const hasYouYour = /\b(you|your|you're|you'll|you've)\b/i.test(subject)
  const personalizationFactors = [hasMergeTag, hasQuestion, hasNumber, hasYouYour].filter(Boolean).length
  const personalizationScore = personalizationFactors === 0 ? 30 : personalizationFactors === 1 ? 60 : personalizationFactors === 2 ? 85 : 100

  // Urgency
  const urgencyWords = POWER_WORDS.urgency.filter(w => lower.includes(w))
  const urgencyScore = urgencyWords.length === 0 ? 50 : urgencyWords.length <= 2 ? 100 : 60

  // Emoji
  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}]/gu
  const emojis = subject.match(emojiRegex) || []
  const emojiCount = emojis.length
  const emojiScore = emojiCount === 0 ? 70 : emojiCount === 1 ? 100 : emojiCount === 2 ? 60 : 30

  // Readability
  const isAllCaps = subject === subject.toUpperCase() && /[A-Z]/.test(subject)
  const capsWords = words.filter(w => w === w.toUpperCase() && w.length > 1 && /[A-Z]/.test(w))
  const excessivePunctuation = /[!]{2,}|[?]{2,}|[!?]{2,}/.test(subject)
  const specialChars = (subject.match(/[!@#$%^&*()_+=\[\]{}<>~`|\\]/g) || []).length
  let readabilityScore = 100
  if (isAllCaps) readabilityScore -= 40
  else if (capsWords.length > 2) readabilityScore -= 20
  if (excessivePunctuation) readabilityScore -= 25
  if (specialChars > 3) readabilityScore -= 15
  readabilityScore = Math.max(0, readabilityScore)

  // Content quality (profanity, scam, deceptive)
  const contentQuality = checkFlaggedContent(lower, words)

  // Overall score
  let overall = Math.round(
    lengthScore * 0.20 +
    powerScore * 0.15 +
    spamScore * 0.25 +
    personalizationScore * 0.15 +
    urgencyScore * 0.10 +
    emojiScore * 0.05 +
    readabilityScore * 0.10
  )

  // Hard cap: flagged content overrides the overall score
  if (contentQuality.hasScam || contentQuality.hasProfanity) {
    overall = Math.min(overall, 20)
  } else if (contentQuality.hasDeceptive) {
    overall = Math.min(overall, 35)
  }

  return {
    overall,
    charCount,
    wordCount,
    categories: {
      length: { score: lengthScore, warnings: lengthWarnings },
      power: { score: powerScore, found: foundPowerWords, total: totalPowerWords },
      spam: { score: spamScore, found: foundSpam },
      personalization: { score: personalizationScore, hasMergeTag, hasQuestion, hasNumber, hasYouYour },
      urgency: { score: urgencyScore, words: urgencyWords },
      emoji: { score: emojiScore, count: emojiCount },
      readability: { score: readabilityScore, isAllCaps, capsWords, excessivePunctuation },
      contentQuality
    }
  }
}

function getScoreColor(score) {
  if (score >= 80) return 'text-turtle'
  if (score >= 60) return 'text-azure'
  if (score >= 40) return 'text-tangerine'
  return 'text-coral'
}

function getScoreBg(score) {
  if (score >= 80) return 'border-turtle/30 bg-turtle/5'
  if (score >= 60) return 'border-azure/30 bg-azure/5'
  if (score >= 40) return 'border-tangerine/30 bg-tangerine/5'
  return 'border-coral/30 bg-coral/5'
}

function getVerdict(score) {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Needs Work'
  return 'Poor'
}

function ScoreCircle({ score, size = 'large' }) {
  const radius = size === 'large' ? 54 : 28
  const stroke = size === 'large' ? 8 : 5
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const dim = (radius + stroke) * 2

  const colorClass = score >= 80 ? '#00CAAA' : score >= 60 ? '#0073EC' : score >= 40 ? '#F59D00' : '#FF4A48'

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={dim} height={dim} className="-rotate-90">
        <circle cx={radius + stroke} cy={radius + stroke} r={radius} stroke="rgba(67,79,88,0.3)" strokeWidth={stroke} fill="none" />
        <circle cx={radius + stroke} cy={radius + stroke} r={radius} stroke={colorClass} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
      </svg>
      <span className={`absolute font-bold ${size === 'large' ? 'text-3xl' : 'text-sm'} ${getScoreColor(score)}`}>{score}</span>
    </div>
  )
}

function CategoryCard({ title, icon, score, children }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="card-gradient border border-metal/20 rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-colors">
        <div className="flex items-center gap-3">
          <span className="text-cloudy">{icon}</span>
          <span className="font-semibold text-white">{title}</span>
        </div>
        <div className="flex items-center gap-3">
          <ScoreCircle score={score} size="small" />
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 text-galactic transition-transform ${open ? 'rotate-180' : ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
        </div>
      </button>
      {open && <div className="px-5 pb-5 border-t border-metal/10">{children}</div>}
    </div>
  )
}

function getTips(result) {
  const tips = []
  const c = result.categories
  // Content quality tips first — these are highest priority
  if (c.contentQuality.hasScam) tips.push({ icon: '🛑', title: 'Remove scam language', text: `Phishing/scam language detected: "${c.contentQuality.found.scam.slice(0, 2).join('", "')}". This will get your email blocked by every major provider and may violate CAN-SPAM or GDPR regulations.` })
  if (c.contentQuality.hasProfanity) tips.push({ icon: '🛑', title: 'Remove profanity', text: `Profanity detected: "${c.contentQuality.found.profanity.slice(0, 2).join('", "')}". This triggers aggressive spam filters, damages brand trust, and will tank your deliverability.` })
  if (c.contentQuality.hasDeceptive) tips.push({ icon: '⚠️', title: 'Rewrite deceptive language', text: `Deceptive tactics detected: "${c.contentQuality.found.deceptive.slice(0, 2).join('", "')}". Replace with honest, value-driven language that builds subscriber trust.` })
  if (c.length.score < 70) tips.push({ icon: '📏', title: 'Optimize length', text: `Your subject line is ${result.charCount} characters. Aim for 30–60 characters for the best open rates across all devices.` })
  if (c.spam.found.high.length > 0) tips.push({ icon: '🚫', title: 'Remove spam triggers', text: `High-risk spam words detected: "${c.spam.found.high.slice(0, 3).join('", "')}". Remove or rephrase these to avoid spam filters.` })
  if (c.personalization.score < 60) tips.push({ icon: '👤', title: 'Add personalization', text: 'Include the recipient\'s name with a merge tag, ask a question, or use "you/your" to make it feel personal.' })
  if (c.power.total === 0) tips.push({ icon: '💪', title: 'Use power words', text: 'Add 1–2 emotional trigger words like "discover", "proven", "exclusive", or "essential" to boost engagement.' })
  if (c.readability.isAllCaps) tips.push({ icon: '🔤', title: 'Stop shouting', text: 'ALL CAPS subject lines look like spam and reduce open rates. Use sentence case instead.' })
  if (c.emoji.count > 2) tips.push({ icon: '🎭', title: 'Reduce emojis', text: 'More than 1–2 emojis can trigger spam filters and look unprofessional. Keep it to one well-placed emoji.' })
  if (c.urgency.score < 60) tips.push({ icon: '⏰', title: 'Ease up on urgency', text: 'Too many urgency words can feel manipulative. Keep one urgency element and let value drive the open.' })
  if (c.readability.excessivePunctuation) tips.push({ icon: '❗', title: 'Fix punctuation', text: 'Multiple exclamation marks (!!) or question marks (??) trigger spam filters. Use one at most.' })
  if (tips.length === 0) tips.push({ icon: '✅', title: 'Looking great!', text: 'Your subject line scores well across all categories. Consider A/B testing small variations to optimize further.' })
  return tips.slice(0, 6)
}

export default function App() {
  const [subjectA, setSubjectA] = useState('')
  const [subjectB, setSubjectB] = useState('')
  const [abMode, setAbMode] = useState(false)

  const resultA = analyzeSubjectLine(subjectA)
  const resultB = abMode ? analyzeSubjectLine(subjectB) : null

  const renderAnalysis = (result, label) => {
    if (!result) return null
    const c = result.categories
    return (
      <div className="space-y-4">
        {label && <h3 className="text-lg font-bold text-white">{label}</h3>}

        {/* Content quality warning banner */}
        {(c.contentQuality.hasProfanity || c.contentQuality.hasScam || c.contentQuality.hasDeceptive) && (
          <div className={`border rounded-2xl p-4 ${c.contentQuality.hasScam || c.contentQuality.hasProfanity ? 'border-coral/40 bg-coral/10' : 'border-tangerine/40 bg-tangerine/10'}`}>
            <div className="flex items-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 shrink-0 mt-0.5 ${c.contentQuality.hasScam || c.contentQuality.hasProfanity ? 'text-coral' : 'text-tangerine'}`}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.25-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" /></svg>
              <div>
                <p className={`font-semibold ${c.contentQuality.hasScam || c.contentQuality.hasProfanity ? 'text-coral' : 'text-tangerine'}`}>
                  {c.contentQuality.hasScam ? 'Scam / Phishing Language Detected' : c.contentQuality.hasProfanity ? 'Profanity Detected' : 'Deceptive Language Detected'}
                </p>
                <p className="text-sm text-cloudy mt-1">
                  {c.contentQuality.hasScam
                    ? 'This subject line contains language commonly associated with phishing or scam emails. Email providers will almost certainly block it, and it may violate anti-spam laws (CAN-SPAM, GDPR).'
                    : c.contentQuality.hasProfanity
                    ? 'Profanity in subject lines triggers aggressive spam filtering and damages brand trust. Most email providers will flag or block this.'
                    : 'This subject line uses deceptive tactics that erode trust and trigger spam filters. Rewrite with honest, value-driven language.'}
                </p>
                <p className="text-xs text-galactic mt-2">Overall score capped due to flagged content.</p>
              </div>
            </div>
          </div>
        )}

        <div className="card-gradient border border-metal/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6">
          <ScoreCircle score={result.overall} />
          <div>
            <div className={`text-2xl font-bold ${getScoreColor(result.overall)}`}>{getVerdict(result.overall)}</div>
            <p className="text-cloudy mt-1">{result.charCount} characters &middot; {result.wordCount} words</p>
            {result.overall < 60 && !c.contentQuality.totalFlags && <p className="text-galactic text-sm mt-2">Focus on the lowest-scoring categories below for the biggest improvement.</p>}
            {c.contentQuality.totalFlags > 0 && <p className="text-coral text-sm mt-2">Remove flagged content before optimizing other categories.</p>}
          </div>
        </div>

        <CategoryCard title="Length" score={c.length.score} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" /></svg>}>
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-galactic">Characters:</span>
              <span className={result.charCount >= 30 && result.charCount <= 60 ? 'text-turtle' : 'text-tangerine'}>{result.charCount}</span>
              <span className="text-galactic">(ideal: 30–60)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-galactic">Words:</span>
              <span className={result.wordCount >= 4 && result.wordCount <= 10 ? 'text-turtle' : 'text-tangerine'}>{result.wordCount}</span>
              <span className="text-galactic">(ideal: 4–10)</span>
            </div>
            <div className="w-full bg-metal/20 rounded-full h-2 mt-2">
              <div className={`h-2 rounded-full transition-all ${result.charCount <= 60 ? 'bg-turtle' : result.charCount <= 70 ? 'bg-tangerine' : 'bg-coral'}`} style={{ width: `${Math.min(100, (result.charCount / 90) * 100)}%` }} />
            </div>
            <div className="flex justify-between text-xs text-galactic"><span>0</span><span>30</span><span>60</span><span>90+</span></div>
            {c.length.warnings.map((w, i) => <p key={i} className="text-sm text-tangerine">⚠ {w}</p>)}
          </div>
        </CategoryCard>

        <CategoryCard title="Power Words" score={c.power.score} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" /></svg>}>
          <div className="mt-3 space-y-2">
            {c.power.total === 0 ? (
              <p className="text-sm text-tangerine">No power words detected. Add 1–2 emotional triggers to boost open rates.</p>
            ) : (
              Object.entries(c.power.found).map(([cat, words]) => (
                <div key={cat} className="text-sm">
                  <span className="text-galactic capitalize">{cat}: </span>
                  {words.map((w, i) => <span key={i} className="inline-block bg-azure/10 border border-azure/20 text-azure rounded px-2 py-0.5 text-xs mr-1 mb-1">{w}</span>)}
                </div>
              ))
            )}
            {c.power.total > 3 && <p className="text-sm text-tangerine">⚠ Too many power words can feel exaggerated. Aim for 1–2.</p>}
          </div>
        </CategoryCard>

        <CategoryCard title="Spam Risk" score={c.spam.score} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>}>
          <div className="mt-3 space-y-3">
            {c.spam.found.high.length === 0 && c.spam.found.medium.length === 0 && c.spam.found.low.length === 0 ? (
              <p className="text-sm text-turtle">No spam triggers detected. Looking clean!</p>
            ) : (
              <>
                {c.spam.found.high.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-coral mb-1">High Risk</p>
                    <div className="flex flex-wrap gap-1">
                      {c.spam.found.high.map((w, i) => <span key={i} className="bg-coral/10 border border-coral/20 text-coral rounded px-2 py-0.5 text-xs">{w}</span>)}
                    </div>
                  </div>
                )}
                {c.spam.found.medium.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-tangerine mb-1">Medium Risk</p>
                    <div className="flex flex-wrap gap-1">
                      {c.spam.found.medium.map((w, i) => <span key={i} className="bg-tangerine/10 border border-tangerine/20 text-tangerine rounded px-2 py-0.5 text-xs">{w}</span>)}
                    </div>
                  </div>
                )}
                {c.spam.found.low.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-galactic mb-1">Low Risk</p>
                    <div className="flex flex-wrap gap-1">
                      {c.spam.found.low.map((w, i) => <span key={i} className="bg-metal/20 border border-metal/30 text-galactic rounded px-2 py-0.5 text-xs">{w}</span>)}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </CategoryCard>

        {/* Content Quality — only show if flags found */}
        {c.contentQuality.totalFlags > 0 && (
          <CategoryCard title="Content Quality" score={c.contentQuality.score} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.249-8.25-3.285Z" /></svg>}>
            <div className="mt-3 space-y-3">
              {c.contentQuality.found.profanity.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-coral mb-1">Profanity</p>
                  <div className="flex flex-wrap gap-1">
                    {c.contentQuality.found.profanity.map((w, i) => <span key={i} className="bg-coral/10 border border-coral/20 text-coral rounded px-2 py-0.5 text-xs">{w}</span>)}
                  </div>
                  <p className="text-xs text-galactic mt-1">Profanity triggers aggressive spam filtering and damages sender reputation.</p>
                </div>
              )}
              {c.contentQuality.found.scam.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-coral mb-1">Scam / Phishing Language</p>
                  <div className="flex flex-wrap gap-1">
                    {c.contentQuality.found.scam.map((w, i) => <span key={i} className="bg-coral/10 border border-coral/20 text-coral rounded px-2 py-0.5 text-xs">{w}</span>)}
                  </div>
                  <p className="text-xs text-galactic mt-1">These phrases are commonly used in phishing and scam emails. ESPs will block delivery.</p>
                </div>
              )}
              {c.contentQuality.found.deceptive.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-tangerine mb-1">Deceptive Tactics</p>
                  <div className="flex flex-wrap gap-1">
                    {c.contentQuality.found.deceptive.map((w, i) => <span key={i} className="bg-tangerine/10 border border-tangerine/20 text-tangerine rounded px-2 py-0.5 text-xs">{w}</span>)}
                  </div>
                  <p className="text-xs text-galactic mt-1">Deceptive language erodes subscriber trust and increases spam complaints.</p>
                </div>
              )}
            </div>
          </CategoryCard>
        )}

        <CategoryCard title="Personalization" score={c.personalization.score} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>}>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div className={`flex items-center gap-2 ${c.personalization.hasMergeTag ? 'text-turtle' : 'text-galactic'}`}>
              {c.personalization.hasMergeTag ? '✓' : '✗'} Merge tag
            </div>
            <div className={`flex items-center gap-2 ${c.personalization.hasQuestion ? 'text-turtle' : 'text-galactic'}`}>
              {c.personalization.hasQuestion ? '✓' : '✗'} Question
            </div>
            <div className={`flex items-center gap-2 ${c.personalization.hasNumber ? 'text-turtle' : 'text-galactic'}`}>
              {c.personalization.hasNumber ? '✓' : '✗'} Number/statistic
            </div>
            <div className={`flex items-center gap-2 ${c.personalization.hasYouYour ? 'text-turtle' : 'text-galactic'}`}>
              {c.personalization.hasYouYour ? '✓' : '✗'} "You/your"
            </div>
          </div>
        </CategoryCard>

        <CategoryCard title="Urgency & Scarcity" score={c.urgency.score} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>}>
          <div className="mt-3 text-sm">
            {c.urgency.words.length === 0 ? (
              <p className="text-galactic">No urgency language detected. Consider adding a mild time element if relevant.</p>
            ) : (
              <>
                <div className="flex flex-wrap gap-1 mb-2">
                  {c.urgency.words.map((w, i) => <span key={i} className="bg-tangerine/10 border border-tangerine/20 text-tangerine rounded px-2 py-0.5 text-xs">{w}</span>)}
                </div>
                {c.urgency.words.length > 2 && <p className="text-tangerine">⚠ Multiple urgency words can feel pushy. Keep one strong urgency cue.</p>}
              </>
            )}
          </div>
        </CategoryCard>

        <CategoryCard title="Emoji Usage" score={c.emoji.score} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" /></svg>}>
          <div className="mt-3 text-sm">
            {c.emoji.count === 0 && <p className="text-galactic">No emojis found. A single well-placed emoji can increase open rates by up to 56%.</p>}
            {c.emoji.count === 1 && <p className="text-turtle">One emoji — perfect. This can boost visibility in crowded inboxes.</p>}
            {c.emoji.count === 2 && <p className="text-tangerine">Two emojis — acceptable, but one is usually enough.</p>}
            {c.emoji.count > 2 && <p className="text-coral">Too many emojis ({c.emoji.count} found). This triggers spam filters and looks unprofessional.</p>}
          </div>
        </CategoryCard>

        <CategoryCard title="Readability" score={c.readability.score} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>}>
          <div className="mt-3 space-y-2 text-sm">
            <div className={`flex items-center gap-2 ${!c.readability.isAllCaps ? 'text-turtle' : 'text-coral'}`}>
              {!c.readability.isAllCaps ? '✓' : '✗'} {c.readability.isAllCaps ? 'ALL CAPS detected — use sentence case' : 'Good casing'}
            </div>
            <div className={`flex items-center gap-2 ${!c.readability.excessivePunctuation ? 'text-turtle' : 'text-coral'}`}>
              {!c.readability.excessivePunctuation ? '✓' : '✗'} {c.readability.excessivePunctuation ? 'Excessive punctuation detected' : 'Clean punctuation'}
            </div>
            {c.readability.capsWords.length > 2 && <p className="text-tangerine">⚠ {c.readability.capsWords.length} words in ALL CAPS: {c.readability.capsWords.slice(0, 5).join(', ')}</p>}
          </div>
        </CategoryCard>

        {/* Tips */}
        <div className="card-gradient border border-metal/20 rounded-2xl p-5">
          <h3 className="font-semibold text-white mb-4">Improvement Tips</h3>
          <div className="space-y-3">
            {getTips(result).map((tip, i) => (
              <div key={i} className="flex gap-3 text-sm">
                <span className="text-lg shrink-0">{tip.icon}</span>
                <div>
                  <p className="font-medium text-white">{tip.title}</p>
                  <p className="text-galactic">{tip.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-abyss bg-glow bg-grid">
      <div className="max-w-4xl mx-auto px-4 py-12 animate-fadeIn">
        <nav className="mb-8 text-sm text-galactic">
          <a href="https://seo-tools-tau.vercel.app/" className="text-azure hover:text-white transition-colors">Free Tools</a>
          <span className="mx-2 text-metal">/</span>
          <a href="https://seo-tools-tau.vercel.app/email-marketing/" className="text-azure hover:text-white transition-colors">Email Marketing</a>
          <span className="mx-2 text-metal">/</span>
          <span className="text-cloudy">Email Subject Line Tester</span>
        </nav>

        <div className="text-center mb-10">
          <div className="inline-flex items-center px-4 py-2 border border-turtle text-turtle rounded-full text-sm font-medium mb-6">Free Tool</div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Email Subject Line Tester</h1>
          <p className="text-cloudy text-lg max-w-2xl mx-auto">Score your email subject lines on length, power words, spam risk, personalization, and readability — with actionable tips to boost open rates.</p>
        </div>

        {/* Input */}
        <div className="card-gradient border border-metal/20 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-medium text-cloudy">Subject Line {abMode ? 'A' : ''}</label>
            <button onClick={() => setAbMode(!abMode)} className={`text-sm px-3 py-1 rounded-lg border transition-colors ${abMode ? 'border-azure text-azure' : 'border-metal/30 text-galactic hover:text-white hover:border-metal/50'}`}>
              {abMode ? 'Single Mode' : 'A/B Compare'}
            </button>
          </div>
          <input
            type="text"
            value={subjectA}
            onChange={(e) => setSubjectA(e.target.value)}
            placeholder="Type your email subject line here..."
            className="w-full bg-midnight border border-metal/30 rounded-lg px-4 py-3 text-white placeholder-galactic focus:outline-none focus:border-azure focus:ring-1 focus:ring-azure transition-colors text-lg"
          />
          <div className="flex justify-between mt-2 text-xs text-galactic">
            <span>{subjectA.length} characters</span>
            <span>{subjectA.length <= 60 ? `${60 - subjectA.length} chars remaining (ideal)` : `${subjectA.length - 60} chars over ideal length`}</span>
          </div>

          {abMode && (
            <>
              <label className="text-sm font-medium text-cloudy mt-4 block">Subject Line B</label>
              <input
                type="text"
                value={subjectB}
                onChange={(e) => setSubjectB(e.target.value)}
                placeholder="Type your alternate subject line..."
                className="w-full bg-midnight border border-metal/30 rounded-lg px-4 py-3 text-white placeholder-galactic focus:outline-none focus:border-azure focus:ring-1 focus:ring-azure transition-colors text-lg mt-2"
              />
              <div className="flex justify-between mt-2 text-xs text-galactic">
                <span>{subjectB.length} characters</span>
                <span>{subjectB.length <= 60 ? `${60 - subjectB.length} chars remaining` : `${subjectB.length - 60} chars over`}</span>
              </div>
            </>
          )}
        </div>

        {/* A/B Winner Banner */}
        {abMode && resultA && resultB && (
          <div className={`border rounded-2xl p-4 mb-6 text-center ${resultA.overall > resultB.overall ? 'border-turtle/30 bg-turtle/5' : resultB.overall > resultA.overall ? 'border-azure/30 bg-azure/5' : 'border-metal/30 bg-metal/5'}`}>
            <span className="text-sm font-medium">
              {resultA.overall > resultB.overall ? (
                <span className="text-turtle">Subject A wins by {resultA.overall - resultB.overall} points ({resultA.overall} vs {resultB.overall})</span>
              ) : resultB.overall > resultA.overall ? (
                <span className="text-azure">Subject B wins by {resultB.overall - resultA.overall} points ({resultB.overall} vs {resultA.overall})</span>
              ) : (
                <span className="text-galactic">It's a tie! Both score {resultA.overall}. Try varying the approach more.</span>
              )}
            </span>
          </div>
        )}

        {/* Results */}
        {abMode ? (
          <div className="grid md:grid-cols-2 gap-6">
            <div>{renderAnalysis(resultA, 'Subject A')}</div>
            <div>{renderAnalysis(resultB, 'Subject B')}</div>
          </div>
        ) : (
          resultA && renderAnalysis(resultA, null)
        )}

        {!resultA && (
          <div className="card-gradient border border-metal/20 rounded-2xl p-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-galactic mx-auto mb-4"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg>
            <p className="text-galactic text-lg">Type a subject line above to see your score</p>
            <p className="text-metal text-sm mt-2">Try: "Your exclusive 30% discount expires tonight"</p>
          </div>
        )}
      </div>

      <footer className="border-t border-metal/30 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-sm text-galactic">
          Free marketing tools by <a href="https://www.dreamhost.com" target="_blank" rel="noopener" className="text-azure hover:text-white transition-colors">DreamHost</a>
        </div>
      </footer>
    </div>
  )
}
