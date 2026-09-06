import { createPrivateKey, sign } from "node:crypto"

function b64url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url")
}

function decodeB64url(value: string) {
  return Buffer.from(value, "base64url")
}

export function createVapidAuthorization(endpoint: string) {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT || "https://plataformasiga.netlify.app"
  if (!publicKey || !privateKey) throw new Error("VAPID não configurado")

  const publicBytes = decodeB64url(publicKey)
  if (publicBytes.length !== 65 || publicBytes[0] !== 4) throw new Error("Chave pública VAPID inválida")
  const privateBytes = decodeB64url(privateKey)
  if (privateBytes.length !== 32) throw new Error("Chave privada VAPID inválida")

  const key = createPrivateKey({
    key: {
      kty: "EC",
      crv: "P-256",
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

export async function sendEmptyWebPush(endpoint: string) {
  return fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: createVapidAuthorization(endpoint),
      TTL: "300",
      Urgency: "high",
    },
  })
}
