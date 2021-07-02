import cookieParser from 'cookie-parser'
import csrf from 'csurf'
import express from 'express'
import bcrypt from 'bcrypt'
import path from 'path'
import { getJWT } from './jwt'
import prisma from './prismaClient'
import merchandise from './route/merchandise'
import adjustment from './route/adjustment'
import purchase from './route/purchase'
import sale from './route/sale'
import order from './route/order'
import user from './route/user'
import cart from './route/cart'

const app = express()

app.use(cookieParser())
app.use(express.json())
app.use(csrf({ cookie: true }))

app.use('/merchandise', merchandise)
app.use('/merchandise/adjustment', adjustment)
app.use('/merchandise/purchase', purchase)
app.use('/merchandise/sale', sale)
app.use('/order', order)
app.use('/user', user)
app.use('/cart', cart)

app.get('/csrf', function (req, res) {
  res.cookie('XSRF-TOKEN', req.csrfToken())
  res.json({})
})

app.get('/avatar', function (req, res) {
  const file = req.query.p
  res.sendFile(file, { root: path.join(__dirname, '../uploads') })
})

app.post('/login', async (req, res) => {
  const { account, password } = req.body
  const user = await prisma.user.findFirst({
    where: {
      account,
    },
    select: {
      id: true,
      password: true,
      account: true,
      name: true,
      avatar: true,
      scope: true,
    },
  })
  if (!user || !bcrypt.compareSync(password, user.password)) {
    res.send({
      code: 200,
      message: 'failed',
      data: '帳號或密碼錯誤',
    })
  } else {
    const jwt = await getJWT(user)
    await prisma.user.update({ where: { id: user.id }, data: { token: jwt } })
    delete user['password']
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

app.post('/me', async (req, res) => {
  const { token } = req.body
  const user = await prisma.user.findFirst({
    where: {
      token,
    },
    select: {
      id: true,
      password: true,
      account: true,
      name: true,
      avatar: true,
      scope: true,
    },
  })
  if (!user) {
    res.send({
      code: 200,
      message: 'failed',
      data: '授權憑證過期或無效，請重新登入',
    })
  } else {
    res.send({
      code: 200,
      message: 'ok',
      auth: { token, user },
    })
  }
})

export default {
  path: '/api',
  handler: app,
}
