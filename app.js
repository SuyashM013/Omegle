const express = require('express');
const app = express();
const socketIO = require('socket.io');

const http = require('http');
const server = http.createServer(app);
const io = socketIO(server);

let waitingUsers = [];
let rooms = {}

let activePairs = new Map();  // socket.id -> partnerId
let skipHistory = new Map();  //  socket.id -> Set of skipped partners

io.on('connection', (socket) => {

    // Join room
    socket.on("joinroom", () => {
        if (waitingUsers.length > 0) {
            let partner = null;

            // find partner not in skip list
            for (let i = 0; i < waitingUsers.length; i++) {
                let candidate = waitingUsers[i];
                let skipped = skipHistory.get(socket.id) || new Set();
                if (!skipped.has(candidate.id)) {
                    partner = candidate;
                    waitingUsers.splice(i, 1); // remove candidate
                    break;
                }
            }

            if (partner) {
                const roomname = `${socket.id}-${partner.id}`;
                socket.join(roomname);
                partner.join(roomname);

                activePairs.set(socket.id, partner.id);
                activePairs.set(partner.id, socket.id);

                io.to(roomname).emit("joined", roomname);
            } else {
                waitingUsers.push(socket);
            }
        } else {
            waitingUsers.push(socket);
        }
    });


    // Message send kara rahe
    socket.on("message", (data) => {
        socket.broadcast.to(data.room).emit("message", data.message)
        console.log(data)
    })

    // video call ka part start

    socket.on("signalingMessage", (data) => {
        // console.log(data);
        socket.broadcast.to(data.room).emit("signalingMessage", data.message)
    })

    // vc start krna hai to req bhejo
    socket.on("startVideoCall", ({ room }) => {
        // console.log(data);
        socket.broadcast.to(room).emit("incommingcall")
    })

    // Call accept kia to yh bhej do
    socket.on("callAccepted", ({ room }) => {
        socket.broadcast.to(room).emit("callAccepted")
    })

    // Call reject kia to 
    socket.on("rejectCall", ({ room }) => {
        // alert("Call rejected");
        socket.broadcast.to(room).emit("callRejected")
    })

    // socket.on('skip', ({ room }) => {
    //     socket.broadcast.to(room).emit("skip")
    // })
    // Skip
    socket.on("skip", ({ room }) => {
        let partnerId = activePairs.get(socket.id);

        if (partnerId) {
            // save skip history
            if (!skipHistory.has(socket.id)) skipHistory.set(socket.id, new Set());
            skipHistory.get(socket.id).add(partnerId);

            if (!skipHistory.has(partnerId)) skipHistory.set(partnerId, new Set());
            skipHistory.get(partnerId).add(socket.id);

            // notify partner
            io.to(partnerId).emit("skip");

            // clean old mapping
            activePairs.delete(socket.id);
            activePairs.delete(partnerId);

            // requeue skipping user
            socket.leave(room);
            socket.emit("rejoin"); // tell frontend to call joinroom again
        }
    });

    // socket.on("disconnect", () => {
    //     let index = waitingUsers.findIndex(user => user.id === socket.id)
    //     waitingUsers.splice(index, 1); // kis index se kitne hatana - 1 hatana

    //     // io.boradcast.emit("Lost", socket.id);
    // })

    socket.on("disconnect", () => {
        waitingUsers = waitingUsers.filter((s) => s.id !== socket.id);

        let partnerId = activePairs.get(socket.id);
        if (partnerId) {
            io.to(partnerId).emit("partnerDisconnected");
            activePairs.delete(partnerId);
        }
        activePairs.delete(socket.id);
        skipHistory.delete(socket.id);
    });

});

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const indexRouter = require('./routes/index');

app.use('/', indexRouter);

server.listen(5050);