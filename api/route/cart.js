import express from 'express'
import prisma from '../prismaClient'
import { jwtMiddleware } from '../jwt-middleware'

const router = express.Router()

function isValidData(data) {
  return !(!data.userId || !Object.keys(data.carts).length)
}

router.get('/', jwtMiddleware, async (req, res) => {
  const id = parseInt(req.query.id)
  let carts = await prisma.cart.findMany({
    where: {
      userId: id
    },
    include: {
      merchandise: true
    },
  })
  res.json({
    code: 200,
    message: 'ok',
    data: carts,
  })
})
  
router.post('/', jwtMiddleware, async (req, res) => {
  const data = req.body
  let [message, result] = ['', '']
  try {
    const cartCreate = await prisma.cart.upsert({
      where: {
        userId_merchandiseId: {
          userId: data.userId,
          merchandiseId: data.merchandiseId,
        },
      },
      create: {
        ...data,
      },
      update: {
        amount: {
          increment: data.amount,
        },
      },
    })
    message = 'ok'
    result = cartCreate
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

router.post('/checkout', jwtMiddleware, async (req, res) => {
  const data = req.body
  let [message, result] = ['', '']
  try {
    if (!isValidData(data)) throw new Error('資料格式不正確')
    const filterArr = Object.values(data.carts).map((item)=> parseInt(item.merchandiseId))
    const orderDetails = Object.values(data.carts).map((item) => {
      return {
        merchandise: {
          connect: { id: parseInt(item.merchandiseId) },
        },
        amount: item.amount,
        price: item.merchandise.price,
      }
    })
    const orderCreate = prisma.order.create({
      data: {
        status: 'created',
        userId: data.userId,
        orderDetail: {
          create: orderDetails,
        },
      },
    })
    const cartDelete = prisma.cart.deleteMany({
      where: {
        userId: data.userId,
        merchandiseId: {
          in: filterArr
        }
      },
    })
    const transaction = await prisma.$transaction([
      orderCreate,
      cartDelete,
    ])
    message = 'ok'
    result = transaction
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
    const cartDelete = await prisma.cart.delete({
      where: { 
        userId_merchandiseId: {
          userId: data.userId,
          merchandiseId: data.merchandiseId,
        },
      },
    })
    message = 'ok'
    result = cartDelete
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

router.delete('/reset', jwtMiddleware, async (req, res) => {
  const data = req.body
  let [message, result] = ['', '']
  try {
    const cartDelete = await prisma.cart.deleteMany({
      where: { userId: data.userId },
    })
    message = 'ok'
    result = cartDelete
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