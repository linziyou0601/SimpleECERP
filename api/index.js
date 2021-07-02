import path from 'path'
import cookieParser from 'cookie-parser'
import csrf from 'csurf'
import express from 'express'
import bcrypt from 'bcrypt'
import { getJWT } from './jwt'
import prisma from './prismaClient'
import merchandise from './route/merchandise'
import adjustment from './route/adjustment'
import purchase from './route/purchase'
import sale from './route/sale'
import order from './route/order'
import report from './route/report'
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
app.use('/report', report)
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
    delete user.password
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

function isValidData(data) {
  return !(
    !data.account.match(/^[0-9a-zA-z]+$/) ||
    !data.name ||
    !data.gender
  )
}
const saltRounds = 10

app.post('/register', async (req, res) => {
  const data = req.body
  let [message, result] = ['', '']
  try {
    if (!isValidData(data)) throw new Error('資料格式不正確')
    const users = await prisma.user.findFirst({
      where: { account: data.account },
    })
    const accFlag = !users
    const pwdFlag = !(
      !data.password ||
      !data.passwordConfirm ||
      data.passwordConfirm !== data.password
    )
    if (!accFlag) {
      message = 'failed'
      result = '該帳號已被使用'
    } else if (!pwdFlag) {
      message = 'failed'
      result = '密碼不能為空或兩次輸入之密碼不一致'
    } else {
      const birthDate = !data.birth ? null : new Date(data.birth).toISOString()
      const passwordHash = bcrypt.hashSync(data.password, saltRounds)
      const userCreate = await prisma.user.create({
        data: {
          account: data.account,
          password: passwordHash,
          name: data.name,
          email: data.email,
          phone: data.phone,
          gender: data.gender,
          birth: birthDate
        },
      })
      message = 'ok'
      result = userCreate
    }
  } catch (exception) {
    console.log(exception)
    message = 'failed'
    result = '資料格式不正確'
  }
  res.json({
    code: 200,
    message,
    result,
  })
})

export default {
  path: '/api',
  handler: app,
}
