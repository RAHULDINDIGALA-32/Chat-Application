const io = require("socket.io-client");

const SERVER_URL = "http://localhost:8080"; 
const TOTAL_CLIENTS = 100;
const MESSAGE_INTERVAL = 1000; // 1 second

const clients = [];

for (let i = 0; i < TOTAL_CLIENTS; i++) {
    const socket = io(SERVER_URL);

    socket.on("connect", () => {
        console.log(`Client ${i} connected`);
        socket.emit("joinRoom", { name: `User${i}`, room: "TestRoom" });

        // Send messages at intervals
        setInterval(() => {
            socket.emit("message", { name: `User${i}`, text: `Hello from User${i}` });
        }, MESSAGE_INTERVAL);
    });

    socket.on("message", (data) => {
        console.log(`Client ${i} received: ${data.text}`);
    });

    socket.on("disconnect", () => {
        console.log(`Client ${i} disconnected`);
    });

    clients.push(socket);
}

// Close all clients after 30 seconds
setTimeout(() => {
    clients.forEach((socket) => socket.disconnect());
    console.log("All clients disconnected.");
}, 30000);
