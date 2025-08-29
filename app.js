const express = require('express');
const app = express();
const socketIO = require('socket.io');

const http = require('http');
const server = http.createServer(app);
const io = socketIO(server);

let waitingUsers = [];
let rooms = {

}

io.on('connection', (socket) => {
    // console.log('A user connected');

    // socket.on('disconnect', () => {
    //     console.log('A user disconnected');
    // });

    socket.on('joinroom', () => {
        // console.log('Room ke lie bhik')
        if(waitingUsers.length > 0){
            let partner = waitingUsers.shift();
            const roomname = `${socket.id}-${partner}`;

            socket.join(roomname);
            partner.join(roomname);

            io.to(roomname).emit('joined', roomname);
            

        }
        else{
            waitingUsers.push(socket);
        }
    })

    socket.on("message", (data) => {
       socket.broadcast.to(data.room).emit("message", data.message)
        console.log(data)
    })

    socket.on("disconnect", () => {
        let index = waitingUsers.findIndex(user => user.id === socket.id)
        waitingUsers.splice(index, 1); // kis index se kitne hatana - 1 hatana

        // io.boradcast.emit("Lost", socket.id);
    })

});

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const indexRouter = require('./routes/index');

app.use('/', indexRouter);

server.listen(5050);