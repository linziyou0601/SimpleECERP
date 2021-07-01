import express from 'express'
import prisma from '../prismaClient'
import { jwtMiddleware } from '../jwt-middleware'

const router = express.Router()

function getDateRange(monthStr) {
  const yyyy = monthStr.split('-')[0]
  const thisM = monthStr.split('-')[1]
  const nextM = String(parseInt(monthStr.split('-')[1]) + 1).padStart(2, '0')
  return {
    startDate: new Date(yyyy + '-' + thisM + '-01T00:00:00.000+08:00'),
    endDate: new Date(yyyy + '-' + nextM + '-01T00:00:00.000+08:00')
  }
}

function isValidData(data) {
  return !(!data.userId || !Object.keys(data.orderItems).length)
}
function isValidNext(data) {
  const nexts = ['pending', 'arrived', 'completed', 'canceled']
  return !(!nexts.includes(data.action))
}

router.get('/', async (req, res) => {
  const { startDate, endDate } = getDateRange(req.query.month)
  const orders = await prisma.order.findMany({
    where: {
      AND: [
        {
          createdAt: { gte: startDate },
        },
        {
          createdAt: { lt: endDate },
        },
      ],
    },
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
        price: data.orderItems[key].price,
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
    if (!isValidNext(data)) throw new Error('資料格式不正確')
    const orderUpdate = await prisma.order.update({
      where: { id: data.id },
      data: {
        status: data.action,
      },
    })
    if (data.action === 'completed') {
      const orderDetails = await prisma.orderDetail.findMany({
        where: { orderId: data.id }
      })
      for (let od of orderDetails)
        await autoCreateSales(od)
    }
    message = 'ok'
    result = orderUpdate
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

async function autoCreateSales(data) {
  let success = false
  while (!success) {
    const inv = await prisma.inventory.findFirst({
      where: { merchandiseId: data.merchandiseId },
      orderBy: { createdAt: 'desc' },
    })
    const costOfGoodsSold = (inv.cost / inv.quantity) * data.amount

    const inventoryOCC = await prisma.inventory.updateMany({
      data: { version: { increment: 1 } },
      where: { id: inv.id, version: inv.version },
    })
    if (inventoryOCC.count !== 0) {
      await prisma.sale.create({
        data: {
          amount: data.amount,
          unitCost: inv.cost / inv.quantity,
          unitPrice: data.price,
          merchandiseId: data.merchandiseId,
          type: 'sale',
          inventory: {
            create: {
              cost: inv.cost - costOfGoodsSold,
              quantity: inv.quantity - data.amount,
              merchandiseId: data.merchandiseId,
            },
          },
        },
      })
      success = true
    }
  }
}

module.exports = router
