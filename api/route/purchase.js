import express from 'express'
import prisma from '../prismaClient'
import { jwtMiddleware } from '../jwt-middleware'

const router = express.Router()

function isValidData(data) {
  return !(data.amount <= 0 || data.unitCost <= 0)
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
  const purchases = await prisma.purchase.findMany({
    include: {
      inventory: true,
      merchandise: {
        select: { title: true }
      }
    },
  })
  res.json({
    code: 200,
    message: 'ok',
    data: purchases,
  })
})

router.post('/', jwtMiddleware, async (req, res) => {
  const data = req.body
  let [message, result] = ['', '']
  try {
    if (!isValidData(data)) throw new Error('資料格式不正確')
    if (data.type !== 'purchase') data.amount *= -1
    const inv = await prisma.inventory.findFirst({
      where: { merchandiseId: data.merchandiseId },
      orderBy: { createdAt: 'desc' },
    })
    const diffAmount = (data.type !== 'discount' ? data.amount : 0)
    const diffCost = data.unitCost * data.amount
    const purchaseCreate = await prisma.purchase.create({
      data: {
        amount: data.amount,
        unitCost: data.unitCost,
        merchandiseId: data.merchandiseId,
        type: data.type,
        inventory: {
          create: {
            cost: inv.cost + diffCost,
            quantity: inv.quantity + diffAmount,
            merchandiseId: data.merchandiseId,
          },
        },
      },
    })
    message = 'ok'
    result = purchaseCreate
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
    if (data.type !== 'purchase') data.amount *= -1
    const flag = await isEditable(data.merchandiseId, data.inventory.createdAt)
    if (flag) {
      const oldData = await prisma.purchase.findFirst({
        where: { id: data.id },
      })
      const diffAmount = (data.type !== 'discount' ? data.amount - oldData.amount : 0)
      const diffCost = data.unitCost * data.amount - oldData.unitCost * oldData.amount
      const purchaseUpdate = await prisma.purchase.update({
        where: { id: data.id },
        data: {
          amount: data.amount,
          unitCost: data.unitCost,
          inventory: {
            update: {
              cost: { increment: diffCost },
              quantity: { increment: diffAmount },
            },
          },
        },
      })
      message = 'ok'
      result = purchaseUpdate
    } else {
      message = 'failed'
      result = '操作不允許，此筆進貨資料之後有其他進銷存資料'
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
      const purchaseDelete = prisma.purchase.delete({
        where: { id: data.id },
      })
      const inventoryDelete = prisma.inventory.delete({
        where: { id: data.inventory.id },
      })
      const transaction = await prisma.$transaction([
        inventoryDelete,
        purchaseDelete,
      ])
      message = 'ok'
      result = transaction
    } else {
      message = 'failed'
      result = '操作不允許，此筆進貨資料之後有其他進銷存資料'
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
