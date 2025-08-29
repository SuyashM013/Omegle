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
