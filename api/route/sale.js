import express from 'express'
import prisma from '../prismaClient'
import { jwtMiddleware } from '../jwt-middleware'

const router = express.Router()

function isValidData(data) {
  return !(data.amount <= 0 || data.unitPrice <= 0)
}

async function isEditable(merchandiseId, recordDatetime) {
  const inventories = await prisma.inventory.findMany({
    where: {
      merchandiseId,
      createdAt: {
        gt: recordDatetime,
      },
    },
  })
  return inventories.length <= 0
}

router.get('/', async (req, res) => {
  const sales = await prisma.sale.findMany({
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
    const flag = await isEditable(data.merchandiseId, data.inventory.createdAt)
    if (flag) {
      const oldData = await prisma.sale.findFirst({
        where: { id: data.id },
      })
      const diffAmount = data.amount - oldData.amount
      const diffCostOfGoodsSold = oldData.unitCost * diffAmount
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
    const flag = await isEditable(data.merchandiseId, data.inventory.createdAt)
    if (flag) {
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
