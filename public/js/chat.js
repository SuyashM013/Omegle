const socket = io();
const messagebox = document.querySelector("#messagebox");
const chatform = document.querySelector("#chatform");
const messageContainer = document.querySelector("#message-container");
let room;

// Room banaya 
socket.emit("joinroom")
socket.on("joined", function (roomname) {
    console.log("joined ");
    //class - .class
    room = roomname;
    document.querySelector(".nobody").classList.add("hidden");

})

// chats ka code yaha se chalu

// Yh wala reciver ke lie backend se aya
socket.on("message", function (message) {
    receiveMessage(message);
})


function attachMessage(message) {
    const userMessageContainer = document.createElement('div');
    userMessageContainer.classList.add('flex', 'my-2', 'justify-end');

    const userMessageDiv = document.createElement('div');
    userMessageDiv.classList.add('bg-blue-500', 'text-white', 'p-3', 'rounded-lg', 'max-w-xs');

    const userMessageText = document.createElement('p');
    userMessageText.textContent = message;

    userMessageDiv.appendChild(userMessageText);

    userMessageContainer.appendChild(userMessageDiv);

    document.getElementById('message-container').appendChild(userMessageContainer);

    document.querySelector("#message-container").scrollTop = document.querySelector("#message-container").scrollHeight;
}

function receiveMessage(message) {
    const messageContainer = document.createElement('div');
    messageContainer.classList.add('flex', 'my-2', 'justify-start');

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('bg-gray-300', 'text-gray-800', 'p-3', 'rounded-lg', 'max-w-xs');

    const messageText = document.createElement('p');
    messageText.textContent = message;

    messageDiv.appendChild(messageText);

    messageContainer.appendChild(messageDiv);

    document.getElementById('message-container').appendChild(messageContainer);
    document.querySelector("#message-container").scrollTop = document.querySelector("#message-container").scrollHeight;
}


//id - #id  , message frontend se bhej rahe backend 
chatform.addEventListener("submit", function (e) {
    e.preventDefault();
    console.log(messagebox.value);
    socket.emit('message', { room: room, message: messagebox.value });
    attachMessage(messagebox.value);
    messagebox.value = "";
})

// WEBRTC START

let localStream;  //khud ki video
let remoteStream; // samne wale ki video
let peerConnection;  // dono ka connection
let inCall = false;  // flag call me ho ke ni

// server for peer to peer connection
const rtcSettings = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

// Video access le lie and hmari show bh kr di
const initialize = async () => {

    socket.on('signalingMessage', handleSignalingMessage);

    // socket.on("startVideoCall", initiateCall);
    try {
        localStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true
        })
        document.querySelector("#localVideo").srcObject = localStream;
        document.querySelector("#localVideo").style.display = "block";

        initiateOffer();

        inCall = true;

    } catch (err) {
        console.log("Rejected by browser" + err);
    }
}

const initiateOffer = async () => {
    await createPeerConnection();
    try {
        const offer = await peerConnection.createOffer(); // apna offer banaya and bhej raha
        await peerConnection.setLocalDescription(offer); // apna offer bhej raha
        socket.emit("signalingMessage", {
            room,
            message: JSON.stringify({
                type: "offer",
                offer
            })
        })


    } catch (err) {
        console.log("failed to initiate/create offer" + err);
    }
}

const createPeerConnection = () => {
    peerConnection = new RTCPeerConnection(rtcSettings);

    remoteStream = new MediaStream();

    document.querySelector("#remoteVideo").srcObject = remoteStream;
    document.querySelector("#remoteVideo").style.display = "block";
    document.querySelector("#localVideo").classList.add("smallFrame");

    // me apni audi video peerconnection me dal raha
    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream)
    })

    // samne wale ki audio video peerconnection me dal raha
    peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach(track => {
            remoteStream.addTrack(track);
        })
    }

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            console.log("Sending Ice Candidates");

            socket.emit("signalingMessage", {
                room,
                message: JSON.stringify({
                    type: "candidate",
                    candidate: event.candidate
                })
            })
        }
    }

    peerConnection.onconnectionstatechange = () => {
        console.log("connection State change hui " + peerConnection.connectionState);
    }
}

const handleSignalingMessage = async (data) => {

    const message = JSON.parse(data);
    if (message.type === "offer") {
        handleOffer(message.offer);
    }
    else if (message.type === "answer") {
        handleAnswer(message.answer);
    }
    else if (message.type === "candidate" && peerConnection) {
        try { await peerConnection.addIceCandidate(message.candidate); }
        catch (error) {
            console.log(error);
        }
    }
    else if(message.type === "hangup"){
        hangup()
    }
}

const handleOffer = async (offer) => {
    await createPeerConnection();
    try {
        peerConnection.setRemoteDescription(offer);
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit("signalingMessage", { room, message: JSON.stringify({ type: "answer", answer }) });
        inCall = true;
    }
    catch (err) {
        console.log("failed to handle offer" + err);
    }
}

const handleAnswer = async (answer) => {
    try {
        await peerConnection.setRemoteDescription(answer);

    }
    catch (err) {
        console.log("failed to handle answer" + err);

    }

}

// VIdeo call wala button se start kara rahe sab
document.querySelector("#video-call-btn")
    .addEventListener("click", function () {
        socket.emit("startVideoCall", { room })
    })

// hmne call kia samne wale pr call jaygi
socket.on("incommingcall", function () {
    // console.log("hey");
    document.querySelector("#incoming-call").classList.remove("hidden");
})

// fir hme accept krna yh reject krna
document.querySelector("#accept-call")
    .addEventListener("click", function () {
        document.querySelector("#incoming-call").classList.add("hidden");
        initialize();
        document.querySelector(".videoblock").classList.remove("hidden");
        socket.emit("callAccepted", { room })
    })

// accept pr yh aya
socket.on("callAccepted", function () {
    initialize();
    document.querySelector(".videoblock").classList.remove("hidden");
})

// reject kia to backend me bhej do
document.querySelector("#reject-call")
    .addEventListener("click", function () {
        document.querySelector("#incoming-call").classList.add("hidden");
        document.querySelector(".videoblock").classList.add("hidden");
        socket.emit("callRejected", { room })
    })

    // reject pr yh aya backend se
socket.on("callRejected", function () {
    alert("Call rejected by other user");
})

// vc cut krna
document.querySelector("#hangup")
    .addEventListener("click", function () {
        hangup();
    })

    // vc cut krna hai to yh bhejo
const hangup = () => {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
        localStream.getTracks().forEach(track => track.stop());

        document.querySelector(".videoblock").classList.add("hidden");
        socket.emit("signalingMessage", { room, message: JSON.stringify({ type: "hangup" }) });
        inCall = false;
    }
}
// initialize();