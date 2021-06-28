import express from 'express'
import bcrypt from 'bcrypt'
import prisma from '../prismaClient'
import { jwtMiddleware } from '../jwt-middleware'

const router = express.Router()
const saltRounds = 10

function isValidData(data) {
  return !(!data.account.match(/^[0-9a-z]+$/) || !data.name || !data.gender || !data.scope)
}

router.get('/', async (req, res) => {
  let users = await prisma.user.findMany({
    select: {
      id: true,
      account: true,
      name: true,
      email: true,
      phone: true,
      gender: true,
      birth: true,
      scope: true,
      createdAt: true,
      updatedAt: true,
    }
  })
  res.json({
    code: 200,
    message: 'ok',
    data: users,
  })
})

router.post('/', jwtMiddleware, async (req, res) => {
  const data = req.body
  let [message, result] = ['', '']
  try {
    if (!isValidData(data)) throw Error('資料格式不正確')
    const users = await prisma.user.findFirst({ where: { account: data.account } })
    const accFlag = !users
    const pwdFlag = !(!data.password || !data.passwordConfirm || data.passwordConfirm!==data.password)
    if (!accFlag){
      message = 'failed'
      result = '該帳號已被使用'
    } else if (!pwdFlag) {
      message = 'failed'
      result = '密碼不能為空或兩次輸入之密碼不一致'
    } else {
      const birthDate = !data.birth ? null : new Date(data.birth).toISOString()
      const passwordHash = bcrypt.hashSync(data.password, saltRounds);
      const userCreate = await prisma.user.create({
        data: {
          account: data.account,
          password: passwordHash,
          name: data.name,
          email: data.email,
          phone: data.phone,
          gender: data.gender,
          birth: birthDate,
          scope: data.scope,
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

router.put('/', jwtMiddleware, async (req, res) => {
  const data = req.body
  let [message, result] = ['', '']
  try {
    if (!isValidData(data)) throw Error('資料格式不正確')
    const birthDate = !data.birth ? null : new Date(data.birth).toISOString()
    const userUpdate = await prisma.user.update({
      where: { id: data.id },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        gender: data.gender,
        birth: birthDate,
        scope: data.scope,
      },
    })
    message = 'ok'
    result = userUpdate
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

router.delete('/', jwtMiddleware, async (req, res) => {
  const data = req.body
  let [message, result] = ['', '']
  try {
    const orders = await prisma.order.findMany({
      where: { userId: data.id },
    })
    const flag = orders.length <= 0
    if (flag) {
      const userDelete = await prisma.user.delete({
        where: { id: data.id },
      })
      message = 'ok'
      result = userDelete
    } else {
      message = 'failed'
      result = '該會員有訂購歷史紀錄，無法刪除'
    }
  } catch (exception) {
    message = 'failed'
    result = '資料格式不正確'
  }
  res.json({
    code: 200,
    message,
    result,
  })
})

module.exports = router
