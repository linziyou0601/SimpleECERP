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
  return !(data.amount === 0 || data.type==='all' && data.unitCost === 0)
}

router.get('/', jwtMiddleware, async (req, res) => {
  const { startDate, endDate } = getDateRange(req.query.month)
  const adjustments = await prisma.adjustment.findMany({
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
        select: { title: true }
      }
    },
  })
  res.json({
    code: 200,
    message: 'ok',
    data: adjustments,
  })
})

router.post('/', jwtMiddleware, async (req, res) => {
  const data = req.body
  let [message, result] = ['', '']
  try {
    if (!isValidData(data)) throw new Error('資料格式不正確')
    const inv = await prisma.inventory.findFirst({
      where: { merchandiseId: data.merchandiseId },
      orderBy: { createdAt: 'desc' },
    })
    const newUnitCost = (data.type==='amount' ? inv.cost / inv.quantity : data.unitCost)
    
    const inventoryOCC = await prisma.inventory.updateMany({
      data: { version: { increment: 1 } },
      where: { id: inv.id, version: inv.version },
    })
    if (inventoryOCC.count !== 0) {
      const adjustmentCreate = await prisma.adjustment.create({
        data: {
          amount: data.amount,
          unitCost: newUnitCost,
          merchandiseId: data.merchandiseId,
          type: data.type,
          inventory: {
            create: {
              cost: inv.cost + newUnitCost * data.amount,
              quantity: inv.quantity + data.amount,
              merchandiseId: data.merchandiseId,
            },
          },
        },
      })
      message = 'ok'
      result = adjustmentCreate
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

    const inv = await prisma.inventory.findFirst({
      where: { merchandiseId: data.merchandiseId },
      orderBy: { createdAt: 'desc' },
    })
    if (inv.id == data.inventory.id) {
      const oldData = await prisma.adjustment.findFirst({
        where: { id: data.id },
      })
      const newUnitCost = (data.type==='amount' ? oldData.unitCost : data.unitCost)
      const diffCost = newUnitCost * data.amount - oldData.unitCost * oldData.amount
      
      const inventoryOCC = await prisma.inventory.updateMany({
        data: { version: { increment: 1 } },
        where: { id: inv.id, version: inv.version },
      })
      if (inventoryOCC.count !== 0) {
        const adjustmentUpdate = await prisma.adjustment.update({
          where: { id: data.id },
          data: {
            amount: data.amount,
            unitCost: data.unitCost,
            inventory: {
              update: {
                cost: { increment: diffCost },
                quantity: { increment: data.amount - oldData.amount },
              },
            },
          },
        })
        message = 'ok'
        result = adjustmentUpdate
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
      const adjustmentDelete = prisma.adjustment.delete({
        where: { id: data.id },
      })
      const inventoryDelete = prisma.inventory.delete({
        where: { id: data.inventory.id },
      })
      const transaction = await prisma.$transaction([
        inventoryDelete,
        adjustmentDelete,
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
