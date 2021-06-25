import cookieParser from 'cookie-parser'
import csrf from 'csurf'
import express from 'express'
import { getJWT } from './jwt'
import prisma from './prismaClient'
import merchandise from './route/merchandise'
import adjustment from './route/adjustment'
import purchase from './route/purchase'
import sale from './route/sale'

const app = express()

app.use(cookieParser())
app.use(express.json())
app.use(csrf({ cookie: true }))

app.use('/merchandise', merchandise)
app.use('/merchandise/adjustment', adjustment)
app.use('/merchandise/purchase', purchase)
app.use('/merchandise/sale', sale)

app.get('/csrf', function (req, res) {
  res.cookie('XSRF-TOKEN', req.csrfToken())
  res.json({})
})

app.post('/login', async (req, res) => {
  const { account, password } = req.body
  const user = await prisma.user.findFirst({
    where: {
      account,
      password,
    },
    select: {
      id: true,
      account: true,
      scope: true
    },
  })
  if (!user) {
    res.send({
      code: 200,
      message: 'failed',
      data: '帳號或密碼錯誤',
    })
  } else {
    const jwt = await getJWT(user)
    await prisma.user.update({ where: { id: user.id }, data: { token: jwt } })
    res.send({
      code: 200,
      message: 'ok',
      auth: {
        token: jwt,
        user,
      },
    })
  }
})

app.post('/logout', async (req, res) => {
  res.json({
    code: 200,
    message: 'ok',
  })
})

export default {
  path: '/api',
  handler: app,
}
