import path from 'path'
import fs from 'fs'
import express from 'express'
import multer from 'multer'
import prisma from '../prismaClient'
import { jwtMiddleware } from '../jwt-middleware'

const upload = multer({
  dest: 'uploads/merchandise/',
  fileFilter(req, file, cb) {
    if (!file.mimetype.match(/image\/(jpg|jpeg|png|bmp)$/))
      cb(new Error('Please upload an image'))
    cb(null, true)
  },
}).any()
const router = express.Router()

function isValidData(data) {
  return !(!data.title || data.unit <= 0 || data.price <= 0)
}

function toBeCountOrder(order) {
  if (order.status === 'completed' || order.status === 'canceled') return false
  return true
}

/* product區 */
router.get('/allProducts', async (req, res) => {
  const merchandises = await prisma.merchandise.findMany({
    where: {
      on: true,
    },
  })
  res.json({
    code: 200,
    message: 'ok',
    data: merchandises,
  })
})

router.get('/product', async (req, res) => {
  const id = parseInt(req.query.id)
  const mc = await prisma.merchandise.findFirst({
    where: { id },
  })
  res.json({
    code: 200,
    message: !mc || !mc.on ? 'failed' : 'ok',
    data: !mc || !mc.on ? '未經允許的存取' : mc,
  })
})

/* merchandise區 */
router.get('/', jwtMiddleware, async (req, res) => {
  let merchandises = await prisma.merchandise.findMany({
    include: {
      orderDetail: {
        include: {
          order: true,
        },
      },
      inventory: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })
  merchandises = merchandises.map((mc) => {
    const rsl = { ...mc }
    rsl.orders = rsl.orderDetail.reduce(
      (t, { amount, order }) => (toBeCountOrder(order) ? t + amount : t),
      0
    )
    rsl.cost = rsl.inventory[0].cost
    rsl.quantity = rsl.inventory[0].quantity
    rsl.unitCost = rsl.cost / rsl.quantity || 0
    delete rsl.inventory
    delete rsl.orderDetail
    return rsl
  })
  res.json({
    code: 200,
    message: 'ok',
    data: merchandises,
  })
})

router.post('/', [jwtMiddleware, upload], async (req, res) => {
  const data = req.body
  const filename = req.files[0] ? req.files[0].filename : ''
  let [message, result] = ['', '']
  try {
    if (!isValidData(data)) throw new Error('資料格式不正確')
    const merchandiseCreate = await prisma.merchandise.create({
      data: {
        title: data.title,
        unit: data.unit,
        price: parseFloat(data.price),
        on: data.on === 'true',
        avatar: filename,
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
    if (filename)
      fs.unlink(
        path.join(__dirname, '../../uploads/merchandise', filename),
        (err) => {}
      )
    message = 'failed'
    result = '資料格式不正確'
  }
  res.json({
    code: 200,
    message,
    result,
  })
})

router.put('/', [jwtMiddleware, upload], async (req, res) => {
  const data = req.body
  const filename = req.files[0] ? req.files[0].filename : ''
  let [message, result] = ['', '']
  const merchandise = await prisma.merchandise.findFirst({
    where: { id: parseInt(data.id) },
  })
  const oldFilename = merchandise.avatar
  try {
    if (!isValidData(data)) throw new Error('資料格式不正確')
    const merchandiseUpdate = await prisma.merchandise.update({
      where: { id: parseInt(data.id) },
      data: {
        title: data.title,
        unit: data.unit,
        price: parseFloat(data.price),
        on: data.on === 'true',
        avatar: filename,
      },
    })
    message = 'ok'
    result = merchandiseUpdate
  } catch (exception) {
    if (filename)
      fs.unlink(
        path.join(__dirname, '../../uploads/merchandise', filename),
        (err) => {}
      )
    message = 'failed'
    result = '資料格式不正確'
  }
  if (message === 'ok' && oldFilename) {
    fs.unlink(
      path.join(__dirname, '../../uploads/merchandise', oldFilename),
      (err) => {}
    )
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
