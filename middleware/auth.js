const jwt = require('jsonwebtoken')
const User = require('../models/user')

const auth = async(req, res, next) => {
    try {
        // const token = req.header('Authorization').replace('Bearer ', "");
        const token = req.cookies.jwt;
        if (!token) {
            throw new Error('Token not found')
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        const user = await User.findOne({
            _id: decoded._id,
            "tokens.token": token
        })

        if(!user) {
            throw new Error('User not found');
        }

        req.token = token;
        req.user = user;
        next()

    } catch (e) {
        res.status(401).send({e: 'Please Authenticate'})
        console.log(e)
    }
}

module.exports = auth;