const ensureAuthenticated = require('../../middleware/auth');

const prorouter=require('express').Router();

prorouter.get('/', ensureAuthenticated, (req, res)=>{
    res.status(200).json([
        {
            name:"mobile",
            price:1000
        }
    ])
});

module.exports=prorouter;