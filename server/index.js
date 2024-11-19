import express from 'express';
import { Server } from "socket.io";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3500;
const ADMIN = "ChatSphere";

const app = express();

app.use(express.static(path.join(__dirname, "public")));

const expressServer = app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
});

// State management
const UsersState = {
    users: [],
    setUsers: function (newUsersArray) {
        this.users = newUsersArray;
    }
};

const io = new Server(expressServer, {
    cors: {
        origin: process.env.NODE_ENV === "production" ? false : ["http://localhost:xxx", "http://127.0.0.1:xxx"]
    }
});

io.on('connection', socket => {
    console.log(`User ${socket.id} connected`);

    // Upon connection - only to user 
    socket.emit('message', buildMsg(ADMIN, "Welcome to ChatShere!"));

    // Handle user joining rooms
    socket.on('joinRoom', ({ name, room }) => {
        const user = activateUser(socket.id, name, room);

        // Join the new room
        socket.join(room);

        // Notify others in the room
        socket.broadcast.to(room).emit('message', buildMsg(ADMIN, `${name} has joined ${room} room`));

        // Update the user's rooms list
        io.to(room).emit('userList', {
            users: getUsersInRoom(room)
        });

        // Update the rooms list for everyone
        io.emit('roomList', {
            rooms: getAllActiveRooms()
        });
    });

    // Handle person-to-person messaging
    socket.on('directMessage', ({ from, to, text }) => {
        const recipient = getUserByName(to);
        if (recipient) {
            io.to(recipient.id).emit('message', buildMsg(from, text));
        }
    });

    // Listen for general messages
    socket.on('message', ({ name, text, room }) => {
        if (room) {
            io.to(room).emit('message', buildMsg(name, text));
        }
    });

    // Handle user disconnect
    socket.on('disconnect', () => {
        const user = getUser(socket.id);
        userLeavesApp(socket.id);

        if (user) {
            io.to(user.room).emit('message', buildMsg(ADMIN, `${user.name} has left ${user.room} room`));

            io.to(user.room).emit('userList', {
                users: getUsersInRoom(user.room)
            });

            io.emit('roomList', {
                rooms: getAllActiveRooms()
            });
        }

        console.log(`User ${socket.id} disconnected`);
    });


    // Handle "typing" notifications
socket.on('typing', ({ name, room, isTyping }) => {
    socket.broadcast.to(room).emit('typing', { name, isTyping });
});


});

// Helper functions
function buildMsg(name, text) {
    return {
        name,
        text,
        time: new Intl.DateTimeFormat('default', {
            hour: 'numeric',
            minute: 'numeric',
        }).format(new Date())
    };
}

function activateUser(id, name, room) {
    const user = { id, name, rooms: [room] };
    const existingUser = UsersState.users.find(user => user.id === id);

    if (existingUser) {
        existingUser.rooms.push(room);
    } else {
        UsersState.users.push(user);
    }
    return user;
}

function userLeavesApp(id) {
    UsersState.setUsers(
        UsersState.users.filter(user => user.id !== id)
    );
}

function getUser(id) {
    return UsersState.users.find(user => user.id === id);
}


function getUserByName(name) {
    return UsersState.users.find(user => user.name === name);
}

function getUsersInRoom(room) {
    return UsersState.users.filter(user => user.rooms.includes(room));
}

function getAllActiveRooms() {
    return Array.from(new Set(UsersState.users.flatMap(user => user.rooms)));
}


