import express from 'express'
import prisma from '../prismaClient'
import { jwtMiddleware } from '../jwt-middleware'

const router = express.Router()

function isValidData(data) {
  return !(!data.title || data.unit<=0 || data.price<=0)
}

function toBeCountOrder(order) {
  if (order.status === 'completed' || order.status === 'canceled')
    return false
  return true
}

/* product區 */
router.get('/allProducts', jwtMiddleware, async (req, res) => {
  let merchandises = await prisma.merchandise.findMany({
    where: {
      on: true
    }
  })
  res.json({
    code: 200,
    message: 'ok',
    data: merchandises,
  })
})

router.get('/product', jwtMiddleware, async (req, res) => {
  const id = parseInt(req.query.id)
  let merchandises = await prisma.merchandise.findFirst({
    where: { id }
  })
  res.json({
    code: 200,
    message: 'ok',
    data: merchandises,
  })
})


/* merchandise區 */
router.get('/', async (req, res) => {
  let merchandises = await prisma.merchandise.findMany({
    include: {
      orderDetail: {
        include: {
          order: true
        }
      },
      inventory: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })
  merchandises = merchandises.map(mc => { 
    let rsl = { ...mc }
    rsl.orders = rsl.orderDetail.reduce(
      (t, { amount, order }) => toBeCountOrder(order)? t + amount: t,
      0
    )
    rsl.cost = rsl.inventory[0].cost
    rsl.quantity = rsl.inventory[0].quantity
    rsl.unitCost = rsl.cost / rsl.quantity || 0
    delete rsl.inventory
    delete rsl.orderDetail
    console.log(rsl)
    return rsl
  })
  res.json({
    code: 200,
    message: 'ok',
    data: merchandises,
  })
})

router.post('/', jwtMiddleware, async (req, res) => {
  const data = req.body
  let [message, result] = ['', '']
  try {
    if (!isValidData(data)) throw Error('資料格式不正確')
    const merchandiseCreate = await prisma.merchandise.create({
      data: {
        ...data,
        inventory: {
          create: {
            cost: 0,
            quantity: 0,
          },
        },
      },
    })
    message = 'ok'
    result = merchandiseCreate
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
    if (!isValidData(data)) throw Error('資料格式不正確')
    const merchandiseUpdate = await prisma.merchandise.update({
      where: { id: data.id },
      data: {
        title: data.title,
        unit: data.unit,
        price: data.price,
        on: data.on,
      },
    })
    message = 'ok'
    result = merchandiseUpdate
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
    const inventories = await prisma.inventory.findMany({
      where: { merchandiseId: data.id },
    })
    const flag = inventories.length === 1
    if (flag) {
      const merchandiseDelete = prisma.merchandise.delete({
        where: { id: data.id },
      })
      const inventoryDelete = prisma.inventory.deleteMany({
        where: { merchandiseId: data.id },
      })
      const transaction = await prisma.$transaction([
        inventoryDelete,
        merchandiseDelete,
      ])
      message = 'ok'
      result = transaction
    } else {
      message = 'failed'
      result = '該商品有進銷存等相關紀錄，請以下架取代刪除'
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

module.exports = router
