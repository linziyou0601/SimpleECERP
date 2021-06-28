import express from 'express'
import bcrypt from 'bcrypt'
import prisma from '../prismaClient'
import { jwtMiddleware } from '../jwt-middleware'

const router = express.Router()
const saltRounds = 10

function isValidData(data) {
  return !(!data.userId || !Object.keys(data.orderItems).length)
}

router.get('/', async (req, res) => {
  const orders = await prisma.order.findMany({
    include: {
      user: {
        select: {
          id: true,
          account: true,
          name: true,
          email: true,
          phone: true,
        }
      },
      orderDetail: {
        include: {
          merchandise: true
        }
      },
    },
  })
  res.json({
    code: 200,
    message: 'ok',
    data: orders,
  })
})

router.post('/', jwtMiddleware, async (req, res) => {
  const data = req.body
  let [message, result] = ['', '']
  try {
    if (!isValidData(data)) throw new Error('資料格式不正確')
    const orderDetails = Object.keys(data.orderItems).map((key, ind) => {
      return {
        merchandise: {
          connect: { id: parseInt(key) },
        },
        amount: data.orderItems[key].amount,
        price: data.orderItems[key].unitPrice,
      }
    })
    const orderCreate = await prisma.order.create({
      data: {
        status: 'created',
        userId: data.userId,
        orderDetail: {
          create: orderDetails,
        },
      },
    })
    message = 'ok'
    result = orderCreate
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

router.put('/', jwtMiddleware, async (req, res) => {
  const data = req.body
  let [message, result] = ['', '']
  try {
    if (!isValidData(data)) throw new Error('資料格式不正確')
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
