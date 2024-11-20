const socket = io('ws://localhost:8080');

const msgInput = document.querySelector('#message');
const nameInput = document.querySelector('#name');
const chatRoom = document.querySelector('#room');
const activity = document.querySelector('.activity');
const usersList = document.querySelector('.user-list');
const roomList = document.querySelector('.room-list');
const chatDisplay = document.querySelector('.chat-display');
const directMsgInput = document.querySelector('#directMessage');
const recipientInput = document.querySelector('#recipient');

function sendMessage(e) {
    e.preventDefault();
    if (nameInput.value && msgInput.value && chatRoom.value) {
        socket.emit('message', {
            name: nameInput.value,
            text: msgInput.value,
            room: chatRoom.value
        });
        msgInput.value = "";
    }
    msgInput.focus();
}

function sendDirectMessage(e) {
    e.preventDefault();
    if (nameInput.value && directMsgInput.value && recipientInput.value) {
        socket.emit('directMessage', {
            from: nameInput.value,
            to: recipientInput.value,
            text: directMsgInput.value
        });
        directMsgInput.value = "";
    }
    directMsgInput.focus();
}

function joinRoom(e) {
    e.preventDefault();
    if (nameInput.value && chatRoom.value) {
        socket.emit('joinRoom', {
            name: nameInput.value,
            room: chatRoom.value 
        });
    }
}

document.querySelector('.form-msg').addEventListener('submit', sendMessage);
document.querySelector('.form-direct-msg').addEventListener('submit', sendDirectMessage);
document.querySelector('.form-join').addEventListener('submit', joinRoom);

// Display message with color differentiation
socket.on("message", (data) => {
    activity.textContent = "";
    const { name, text, time } = data;

    const li = document.createElement('li');
    li.className = 'post';
    li.innerHTML = `
        <div class="${name === nameInput.value ? 'my-message' : 'other-message'}">
            <strong>${name}</strong> [${time}]: ${text}
        </div>
    `;

    chatDisplay.appendChild(li);
    chatDisplay.scrollTop = chatDisplay.scrollHeight;
});

socket.on('userList', ({ users }) => {
    usersList.textContent = `Users: ${users.map(user => user.name).join(', ')}`;
});

socket.on('roomList', ({ rooms }) => {
    roomList.textContent = `Active Rooms: ${rooms.join(', ')}`;
});



let typingTimer;
const TYPING_TIMEOUT = 3000; 

// Function to notify typing activity
function handleTyping() {
    clearTimeout(typingTimer);

    socket.emit('typing', {
        name: nameInput.value,
        room: chatRoom.value,
        isTyping: true
    });

    typingTimer = setTimeout(() => {
        socket.emit('typing', {
            name: nameInput.value,
            room: chatRoom.value,
            isTyping: false
        });
    }, TYPING_TIMEOUT);
}



// Show typing activity
socket.on('typing', ({ name, isTyping }) => {
    if (isTyping) {
        activity.textContent = `${name} is typing...`;
    } else {
        activity.textContent = "";
    }
});

// Attach typing listener to message input
msgInput.addEventListener('input', handleTyping);
