const Router = require('express').Router

const db = require('../db')

const { Decimal128, ObjectId } = require('mongodb')

const router = Router()

router.get('/', async (req, res, next) => {
    /* for pagination */
    // const queryPage = req.query.page
    // const pageSize = 25

    try {
        const products = []
        const cursor = db.getDB().db().collection('products').find()
        /* for pagination */
        // .sort({ price: -1 })
        // .skip((queryPage - 1) * pageSize)
        // .limit(pageSize)

        for await (const p of cursor) {
            console.log(p)
            const product = {
                ...p,
                price: p.price.toString(),
            }
            products.push(product)
        }

        res.json(products)
    } catch (e) {
        console.log(e)
    }
})

router.get('/:id', async (req, res, next) => {
    try {
        const result = await db
            .getDB()
            .db()
            .collection('products')
            .findOne({ _id: new ObjectId(req.params.id) })
        const product = {
            ...result,
            price: result.price.toString(),
        }
        res.status(200).json(product)
    } catch (e) {
        console.log(e)
        res.status(500).json({ message: 'Get error' })
    }
})

router.post('', (req, res, next) => {
    const newProduct = {
        name: req.body.name,
        description: req.body.description,
        price: Decimal128.fromString(req.body.price.toString()), // store this as 128bit decimal in MongoDB
        image: req.body.image,
    }

    try {
        const result = db
            .getDB()
            .db()
            .collection('products')
            .insertOne(newProduct)
        res.status(201).json({
            message: 'Product added',
            productId: result.insertedId,
        })
    } catch (e) {
        console.log(e)
        res.status(500).json({
            message: 'Insert error',
        })
    }
})

router.patch('/:id', (req, res, next) => {
    const updatedProduct = {
        name: req.body.name,
        description: req.body.description,
        price: Decimal128.fromString(req.body.price.toString()), // store this as 128bit decimal in MongoDB
        image: req.body.image,
    }

    try {
        db.getDB()
            .db()
            .collection('products')
            .updateOne(
                { _id: new ObjectId(req.params.id) },
                {
                    $set: updatedProduct,
                }
            )
        res.status(200).json({
            message: 'Product updated',
            productId: req.params.id,
        })
    } catch (e) {
        console.log(e)
        res.status(500).json({ message: 'Update error' })
    }
})

router.delete('/:id', (req, res, next) => {
    try {
        db.getDB()
            .db()
            .collection('products')
            .deleteOne({ _id: new ObjectId(req.params.id) })
        res.status(200).json({ message: 'Product deleted' })
    } catch (e) {
        console.log(e)
        res.status(500).json({ message: 'Delete error' })
    }
})

module.exports = router
