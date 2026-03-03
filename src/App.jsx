import { useState } from 'react'
import { analyzeSubjectLine } from './subjectAnalysis'
import AnalysisResult from './components/AnalysisResult'
import ComparisonResult from './components/ComparisonResult'

export default function App() {
  const [subjectA, setSubjectA] = useState('')
  const [subjectB, setSubjectB] = useState('')
  const [abMode, setAbMode] = useState(false)

  const fillTestData = () => {
    setSubjectA("Don't Miss Our Spring Sale — 40% Off Everything This Weekend")
    setSubjectB("Your exclusive 30% discount expires tonight, {{first_name}}")
    setAbMode(true)
  }

  const resultA = analyzeSubjectLine(subjectA)
  const resultB = abMode ? analyzeSubjectLine(subjectB) : null

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

        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={fillTestData}
            className="px-3 py-1.5 text-xs font-mono bg-prince/20 text-prince border border-prince/30 rounded hover:bg-prince/30 transition-colors focus:outline-none focus:ring-2 focus:ring-prince focus:ring-offset-2 focus:ring-offset-abyss"
          >
            Fill Test Data
          </button>
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

        {/* Results */}
        {abMode ? (
          <ComparisonResult resultA={resultA} resultB={resultB} />
        ) : (
          resultA && <AnalysisResult result={resultA} label={null} />
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
        <div className="max-w-[1600px] mx-auto px-4 py-6 text-center text-sm text-galactic">
          Free marketing tools by <a href="https://www.dreamhost.com" target="_blank" rel="noopener" className="text-azure hover:text-white transition-colors">DreamHost</a>
        </div>
      </footer>
    </div>
  )
}
