import React from 'react'
import {
  clearAppStorage,
  getRecoveryTried,
  setRecoveryTried,
  clearRecoveryTried,
} from '../lib/recovery.js'

// Catches render crashes anywhere below it. The usual culprit for returning
// visitors is stale localStorage from an older build, so on the first crash
// of a session we wipe our storage and reload once. If it crashes again after
// that, we stop auto-recovering (no reload loop) and show a manual reset.
export default class ErrorBoundary extends React.Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error, info) {
    if (!getRecoveryTried()) {
      setRecoveryTried()
      clearAppStorage()
      if (typeof window !== 'undefined') window.location.reload()
      return
    }
    if (import.meta.env?.DEV) {
      console.error('App crashed again after auto-recovery:', error, info)
    }
  }

  handleReset = () => {
    clearAppStorage()
    clearRecoveryTried()
    if (typeof window !== 'undefined') window.location.assign('/')
  }

  render() {
    if (!this.state.failed) return this.props.children

    // Shown only when auto-recovery already ran and the app still failed.
    return (
      <div className="min-h-svh flex items-center justify-center bg-cream px-6">
        <div className="max-w-sm text-center">
          <div
            className="font-display text-wine text-3xl"
            style={{ fontVariationSettings: "'opsz' 60, 'wght' 400" }}
            aria-hidden
          >
            ❦
          </div>
          <h1
            className="mt-3 font-display text-[1.5rem] leading-tight text-ink"
            style={{ fontVariationSettings: "'opsz' 60, 'SOFT' 70, 'wght' 460" }}
          >
            Something went wrong
          </h1>
          <p className="mt-2 text-[13px] text-ink-soft leading-snug">
            We cleared this device&rsquo;s saved data and it still didn&rsquo;t
            load. Resetting and starting fresh usually fixes it.
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="focus-ring press mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-md
                       bg-wine text-cream font-mono text-[10.5px] tracking-[0.18em] uppercase"
          >
            Reset &amp; reload
          </button>
        </div>
      </div>
    )
  }
}
