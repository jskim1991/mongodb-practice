const Router = require('express').Router
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

const db = require('../db')

const router = Router()

const createToken = () => {
    return jwt.sign({}, 'secret', { expiresIn: '1h' })
}

router.post('/login', async (req, res, next) => {
    const email = req.body.email
    const pw = req.body.password

    try {
        const user = await db
            .getDB()
            .db()
            .collection('users')
            .findOne({ email: email })

        bcrypt.compare(pw, user.password, (err, match) => {
            if (err || !match) {
                res.status(401).json({
                    message:
                        'Authentication failed, invalid username or password.',
                })
            }

            if (match) {
                const token = createToken()
                res.status(200).json({ token: token, user: { email: email } })
            }
        })
    } catch (e) {
        res.status(401).json({
            message: 'Authentication failed, invalid username or password.',
        })
    }
})

router.post('/signup', (req, res, next) => {
    const email = req.body.email
    const pw = req.body.password
    // Hash password before storing it in database => Encryption at Rest
    bcrypt
        .hash(pw, 12)
        .then((hashedPW) => {
            db.getDB()
                .db()
                .collection('users')
                .insertOne({
                    email: email,
                    password: hashedPW,
                })
                .then((result) => {
                    console.log(result)
                    const token = createToken()
                    res.status(201).json({
                        token: token,
                        user: { email: email },
                    })
                })
                .catch((err) => {
                    console.log(err)
                    res.status(500).json({
                        message: 'Creating the user failed.',
                    })
                })
        })
        .catch((err) => {
            console.log(err)
            res.status(500).json({ message: 'Creating the user failed.' })
        })
})

module.exports = router
