const STORAGE_KEY = 'meew_voter_token'

function generateToken() {
  if (globalThis.crypto?.randomUUID) {
    return `meew-${globalThis.crypto.randomUUID()}`
  }

  const random = Array.from(
    globalThis.crypto.getRandomValues(new Uint8Array(24)),
    (byte) => byte.toString(16).padStart(2, '0'),
  ).join('')

  return `meew-${random}`
}

export function getVoterToken() {
  const existing = localStorage.getItem(STORAGE_KEY)
  if (existing && existing.length >= 20 && existing.length <= 100) {
    return existing
  }

  const token = generateToken()
  localStorage.setItem(STORAGE_KEY, token)
  return token
}
