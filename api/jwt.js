import { generateSecret } from 'jose/util/generate_secret'
import { fromKeyLike } from 'jose/jwk/from_key_like'
import { parseJwk } from 'jose/jwk/parse'
import { SignJWT } from 'jose/jwt/sign'
import { jwtVerify } from 'jose/jwt/verify'

const ALG = 'HS256'
const JWK = '{"kty":"oct","k":"yP_xLKhMRT1CbjJcxJvWtGNkpg5gLk9fcIZRh563vI8"}' // from DB
const HEADER = { alg: ALG, typ: 'JWT' }
const EXPIRATION_SECONDS = 10 * 60

function getUTCTimestamp() {
  const isoDatetimeString = new Date().toISOString()
  return Math.round(new Date(isoDatetimeString).getTime() / 1000)
}

async function generateJWT(PAYLOAD, SECRET) {
  const ISSUE_AT = getUTCTimestamp()
  const EXPIRE = ISSUE_AT + EXPIRATION_SECONDS
  const JWT = await new SignJWT(PAYLOAD)
    .setProtectedHeader(HEADER)
    .setIssuedAt(ISSUE_AT)
    .setExpirationTime(EXPIRE)
    .sign(SECRET)
  return JWT
}

async function getJWT(user) {
  const SECRET = await parseJwk(JSON.parse(JWK), ALG) // await generateSecret(ALG)
  const PAYLOAD = user
  return generateJWT(PAYLOAD, SECRET)
}

async function verifyJWT(jwt) {
  const SECRET = await parseJwk(JSON.parse(JWK), ALG) // await generateSecret(ALG)
  try {
    const { payload, protectedHeader } = await jwtVerify(jwt, SECRET)
    return { claims: payload, error: null }
  } catch(exception) {
    return { claims: null, error: exception.reason}
  }
}

module.exports = {
  getJWT,
  verifyJWT
}
