import prisma from './prismaClient'
import { verifyJWT } from './jwt'

async function jwtMiddleware(req, res, next) {
    const authorization = req.headers.authorization
    const jwt = authorization ? authorization.replace('Bearer ', '') : ''
    const { claims, error } = await verifyJWT(jwt)
    const user = await prisma.user.findFirst({ where: { token: jwt } })
    if (!claims || !user) {
      res.status(401).json({ message: 'invalid token' })
    } else {
      req.claims = claims
      next()
    }
}

module.exports = {
    jwtMiddleware
}