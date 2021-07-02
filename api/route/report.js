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

router.get('/', jwtMiddleware, async (req, res) => {
  const { startDate, endDate } = getDateRange(req.query.month)
  console.log(req.query.month)
  let merchandises = await prisma.merchandise.findMany({})
  merchandises = merchandises.map(async (mc) => {
    const rsl = { ...mc }
    // 取得期初存貨
    const init_inv = await prisma.inventory.findFirst({
      where: { 
        merchandiseId: rsl.id,
        createdAt: { lt: startDate },
      },
      orderBy: { createdAt: 'desc' },
    })
    rsl.initialInv = init_inv.cost || 0
    // 取得本期進貨淨額
    const purchases = await prisma.purchase.findMany({
      where: {
        AND: [
          {
            createdAt: { gte: startDate },
          },
          {
            createdAt: { lt: endDate },
          },
        ],
        merchandiseId: rsl.id,
      },
    })
    rsl.purchaseNet = purchases.reduce(
      (t, { amount, unitCost }) => t + amount * unitCost,
      0
    )
    // 取得本期銷貨成本
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
        merchandiseId: rsl.id,
      },
    })
    rsl.cogs = sales.reduce(
      (t, { amount, unitCost }) => t + amount * unitCost,
      0
    )
    // 取得銷貨收入
    rsl.revenue = sales.reduce(
      (t, { amount, unitPrice }) => t + amount * unitPrice,
      0
    )
    rsl.saleNet = rsl.revenue - rsl.cogs
    // 取得期末存貨
    const final_inv = await prisma.inventory.findFirst({
      where: { 
        merchandiseId: rsl.id,
        createdAt: { lt: endDate },
      },
      orderBy: { createdAt: 'desc' },
    })
    rsl.finalInv = final_inv.cost || 0
    return rsl
  })
  merchandises = await Promise.all(merchandises)
  res.json({
    code: 200,
    message: 'ok',
    data: merchandises,
  })
})

module.exports = router
