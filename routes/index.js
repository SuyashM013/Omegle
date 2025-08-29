const express = require('express');
const app = express();
const socket = require('socket.io');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('index');
})
router.get('/chat', (req, res) => {
    res.render('chat');
})


module.exports = router;