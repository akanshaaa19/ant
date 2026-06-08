// One-time auto-recovery for visitors carrying stale localStorage from an
// older version of the app. If a render crashes, we wipe our own storage and
// reload once; a sessionStorage flag stops that from looping forever.

export const RECOVERY_FLAG = 'mga-recovered'
const PREFIX = 'mga-'

const hasWindow = typeof window !== 'undefined'

// Remove every key this app owns (all are `mga-` prefixed). sessionStorage's
// recovery flag lives separately, so it survives this.
export function clearAppStorage() {
  if (!hasWindow) return
  try {
    const keys = []
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i)
      if (k && k.startsWith(PREFIX)) keys.push(k)
    }
    keys.forEach((k) => window.localStorage.removeItem(k))
  } catch {
    /* storage blocked (private mode) — nothing to clear */
  }
}

export function getRecoveryTried() {
  if (!hasWindow) return false
  try {
    return window.sessionStorage.getItem(RECOVERY_FLAG) === '1'
  } catch {
    return false
  }
}

export function setRecoveryTried() {
  if (!hasWindow) return
  try {
    window.sessionStorage.setItem(RECOVERY_FLAG, '1')
  } catch {
    /* ignore */
  }
}

export function clearRecoveryTried() {
  if (!hasWindow) return
  try {
    window.sessionStorage.removeItem(RECOVERY_FLAG)
  } catch {
    /* ignore */
  }
}
