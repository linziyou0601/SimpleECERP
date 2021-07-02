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
  return !(data.amount <= 0 || data.unitPrice <= 0)
}

router.get('/', jwtMiddleware, async (req, res) => {
  const { startDate, endDate } = getDateRange(req.query.month)
  const sales = await prisma.sale.findMany({
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
      inventory: true,
      merchandise: {
        select: { title: true },
      },
    },
  })
  res.json({
    code: 200,
    message: 'ok',
    data: sales,
  })
})

router.post('/', jwtMiddleware, async (req, res) => {
  const data = req.body
  let [message, result] = ['', '']
  try {
    if (!isValidData(data)) throw new Error('資料格式不正確')
    if (data.type !== 'sale') data.amount *= -1
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
      const saleCreate = await prisma.sale.create({
        data: {
          amount: data.amount,
          unitCost: inv.cost / inv.quantity,
          unitPrice: data.unitPrice,
          merchandiseId: data.merchandiseId,
          type: data.type,
          inventory: {
            create: {
              cost: inv.cost - costOfGoodsSold,
              quantity: inv.quantity - data.amount,
              merchandiseId: data.merchandiseId,
            },
          },
        },
      })
      message = 'ok'
      result = saleCreate
    } else {
      message = 'failed'
      result = '出了點狀況，請稍後再試'
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

router.put('/', jwtMiddleware, async (req, res) => {
  const data = req.body
  let [message, result] = ['', '']
  try {
    if (!isValidData(data)) throw new Error('資料格式不正確')
    if (data.type !== 'sale') data.amount *= -1

    const inv = await prisma.inventory.findFirst({
      where: { merchandiseId: data.merchandiseId },
      orderBy: { createdAt: 'desc' },
    })
    if (inv.id == data.inventory.id) {
      const oldData = await prisma.sale.findFirst({
        where: { id: data.id },
      })
      const diffAmount = data.amount - oldData.amount
      const diffCostOfGoodsSold = oldData.unitCost * diffAmount

      const inventoryOCC = await prisma.inventory.updateMany({
        data: { version: { increment: 1 } },
        where: { id: inv.id, version: inv.version },
      })
      if (inventoryOCC.count !== 0) {
        const saleUpdate = await prisma.sale.update({
          where: { id: data.id },
          data: {
            amount: data.amount,
            unitPrice: data.unitPrice,
            inventory: {
              update: {
                cost: { decrement: diffCostOfGoodsSold },
                quantity: { decrement: diffAmount },
              },
            },
          },
        })
        message = 'ok'
        result = saleUpdate
      } else {
        message = 'failed'
        result = '出了點狀況，請稍後再試'
      }
    } else {
      message = 'failed'
      result = '操作不允許，此筆調整資料之後有其他進銷存資料'
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

router.delete('/', jwtMiddleware, async (req, res) => {
  const data = req.body
  let [message, result] = ['', '']
  try {
    const inv = await prisma.inventory.findFirst({
      where: { merchandiseId: data.merchandiseId },
      orderBy: { createdAt: 'desc' },
    })
    if (inv.id == data.inventory.id) {
      const saleDelete = prisma.sale.delete({
        where: { id: data.id },
      })
      const inventoryDelete = prisma.inventory.delete({
        where: { id: data.inventory.id },
      })
      const transaction = await prisma.$transaction([
        inventoryDelete,
        saleDelete,
      ])
      message = 'ok'
      result = transaction
    } else {
      message = 'failed'
      result = '操作不允許，此筆調整資料之後有其他進銷存資料'
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
