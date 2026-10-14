import { createCipheriv, createECDH, createPrivateKey, hkdfSync, randomBytes, sign } from "node:crypto"

export type PushSubscriptionInfo = {
  endpoint: string
  p256dh: string
  auth_key: string
}

export type PushPayload = {
  id?: string
  title: string
  body: string
  href: string
}

const TRUSTED_PUSH_HOSTS = new Set([
  "fcm.googleapis.com",
  "android.googleapis.com",
  "updates.push.services.mozilla.com",
  "push.services.mozilla.com",
  "web.push.apple.com",
  "webpush.push.apple.com",
])

// Exact hosts and the Windows Push Notification Service are allowed.
// Reject internal hosts, custom ports, embedded credentials and redirects.
export function isTrustedPushEndpoint(endpoint: unknown): endpoint is string {
  if (typeof endpoint !== "string" || endpoint.length < 20 || endpoint.length > 4096) return false
  try {
    const url = new URL(endpoint)
    const host = url.hostname.toLowerCase()
    const approved = TRUSTED_PUSH_HOSTS.has(host) ||
      /^(?:[a-z0-9-]+\.)+notify\.windows\.com$/.test(host)
    return url.protocol === "https:" && !url.username && !url.password &&
      !url.port && !url.hash && url.pathname.length > 1 && approved
  } catch {
    return false
  }
}

function decodeKey(value: string, requiredBytes: number) {
  if (!/^[A-Za-z0-9_-]+$/.test(value || "")) throw new Error("Invalid Web Push key")
  const data = Buffer.from(value, "base64url")
  if (data.length !== requiredBytes) throw new Error("Invalid Web Push key size")
  return data
}

export function isValidPushKeys(p256dh: unknown, auth: unknown) {
  try {
    if (typeof p256dh !== "string" || typeof auth !== "string") return false
    const publicKey = decodeKey(p256dh, 65)
    decodeKey(auth, 16)
    return publicKey[0] === 0x04
  } catch {
    return false
  }
}

function b64url(bytes: Buffer | string) {
  return Buffer.from(bytes).toString("base64url")
}

function createVapidAuthorization(endpoint: string) {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT || "https://plataformasiga.netlify.app"
  if (!publicKey || !privateKey) throw new Error("VAPID não configurado")
  const publicBytes = decodeKey(publicKey, 65)
  const privateBytes = decodeKey(privateKey, 32)
  if (publicBytes[0] !== 4) throw new Error("Chave VAPID inválida")
  const key = createPrivateKey({
    key: {
      kty: "EC", crv: "P-256",
      x: b64url(publicBytes.subarray(1, 33)),
      y: b64url(publicBytes.subarray(33, 65)),
      d: b64url(privateBytes),
    },
    format: "jwk",
  })
  const header = b64url(JSON.stringify({ typ: "JWT", alg: "ES256" }))
  const payload = b64url(JSON.stringify({
    aud: new URL(endpoint).origin,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
    sub: subject,
  }))
  const unsigned = `${header}.${payload}`
  const signature = sign("sha256", Buffer.from(unsigned), { key, dsaEncoding: "ieee-p1363" })
  return `vapid t=${unsigned}.${b64url(signature)}, k=${publicKey}`
}

// RFC 8291 / RFC 8188: single-record aes128gcm encrypted Web Push.
// The private session cookie is NOT required to receive this payload.
export function encryptPushMessage(subscription: PushSubscriptionInfo, message: PushPayload): Buffer {
  const receiverKey = decodeKey(subscription.p256dh, 65)
  const authSecret = decodeKey(subscription.auth_key, 16)
  if (receiverKey[0] !== 0x04) throw new Error("Invalid subscription public key")

  const plaintext = Buffer.from(JSON.stringify(message), "utf8")
  if (plaintext.length > 3993) throw new Error("Push payload exceeds 3993 bytes")

  const ecdh = createECDH("prime256v1")
  const senderPublic = ecdh.generateKeys()
  const sharedSecret = ecdh.computeSecret(receiverKey)
  const keyInfo = Buffer.concat([
    Buffer.from("WebPush: info\0", "utf8"),
    receiverKey,
    senderPublic,
  ])
  const ikm = Buffer.from(hkdfSync("sha256", sharedSecret, authSecret, keyInfo, 32))
  const salt = randomBytes(16)
  const cek = Buffer.from(hkdfSync("sha256", ikm, salt, Buffer.from("Content-Encoding: aes128gcm\0"), 16))
  const nonce = Buffer.from(hkdfSync("sha256", ikm, salt, Buffer.from("Content-Encoding: nonce\0"), 12))
  const cipher = createCipheriv("aes-128-gcm", cek, nonce)
  const content = Buffer.concat([plaintext, Buffer.from([0x02])])
  const ciphertext = Buffer.concat([cipher.update(content), cipher.final(), cipher.getAuthTag()])
  // RFC 8188 header: salt(16), record size(4), sender key length(1), sender key(65).
  const header = Buffer.alloc(21)
  salt.copy(header)
  header.writeUInt32BE(4096, 16)
  header[20] = senderPublic.length
  return Buffer.concat([header, senderPublic, ciphertext])
}

export async function sendWebPush(subscription: PushSubscriptionInfo, message: PushPayload): Promise<Response> {
  if (!isTrustedPushEndpoint(subscription.endpoint) || !isValidPushKeys(subscription.p256dh, subscription.auth_key)) {
    throw new Error("Invalid or untrusted Web Push subscription")
  }
  const payload = encryptPushMessage(subscription, message)
  return fetch(subscription.endpoint, {
    method: "POST",
    redirect: "error",
    signal: AbortSignal.timeout(12000),
    headers: {
      Authorization: createVapidAuthorization(subscription.endpoint),
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      TTL: "86400",
      Urgency: "high",
    },
    body: new Uint8Array(payload),
  })
}
