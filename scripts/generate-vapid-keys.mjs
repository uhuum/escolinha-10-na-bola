import { createECDH } from "node:crypto"

const ecdh = createECDH("prime256v1")
ecdh.generateKeys()

const publicKey = ecdh.getPublicKey().toString("base64url")
const privateKey = ecdh.getPrivateKey().toString("base64url")

console.log("\nSIGA - chaves Web Push (VAPID)\n")
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${publicKey}`)
console.log(`VAPID_PRIVATE_KEY=${privateKey}`)
console.log("VAPID_SUBJECT=https://plataformasiga.netlify.app")
console.log("\nCopie os três valores para as variáveis de ambiente do Netlify.")
console.log("Nunca envie nem publique VAPID_PRIVATE_KEY.\n")
