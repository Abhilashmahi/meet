const path = require('path');
const express = require('express');
const http = require('http');
const moment = require('moment');
const socketio = require('socket.io');
const db = require('./db'); // <--- DB connection
const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const usersInRoom = {}; // { roomId: { socketId: username } }

app.use(express.static(path.join(__dirname, 'public')));

let rooms = {};
let socketroom = {};
let socketname = {};
let micSocket = {};
let videoSocket = {};
let roomBoard = {};

io.on('connect', socket => {

    socket.on("join room", (roomid, username) => {
        socket.join(roomid);
        socketroom[socket.id] = roomid;
        socketname[socket.id] = username;
        micSocket[socket.id] = 'on';
        videoSocket[socket.id] = 'on';

        if (!rooms[roomid]) {
            db.query('INSERT INTO meetings (room_id) VALUES (?)', [roomid], (err) => {
                if (err) console.error('DB insert error (room):', err);
            });
            rooms[roomid] = [socket.id];
            io.to(socket.id).emit('join room', null, null, null, null);
        } else {
            rooms[roomid].push(socket.id);
            socket.to(roomid).emit('message', `${username} joined the room.`, 'Bot', moment().format("h:mm a"));
            io.to(socket.id).emit('join room', rooms[roomid].filter(pid => pid != socket.id), socketname, micSocket, videoSocket);
        }

        io.to(roomid).emit('user count', rooms[roomid].length);
    });

    socket.on('action', msg => {
        if (msg == 'mute') micSocket[socket.id] = 'off';
        else if (msg == 'unmute') micSocket[socket.id] = 'on';
        else if (msg == 'videoon') videoSocket[socket.id] = 'on';
        else if (msg == 'videooff') videoSocket[socket.id] = 'off';

        socket.to(socketroom[socket.id]).emit('action', msg, socket.id);
    });

    socket.on('video-offer', (offer, sid) => {
        socket.to(sid).emit('video-offer', offer, socket.id, socketname[socket.id], micSocket[socket.id], videoSocket[socket.id]);
    });

    socket.on('video-answer', (answer, sid) => {
        socket.to(sid).emit('video-answer', answer, socket.id);
    });

    socket.on('new icecandidate', (candidate, sid) => {
        socket.to(sid).emit('new icecandidate', candidate, socket.id);
    });

    socket.on('message', (msg, username, roomid) => {
        const time = moment().format("h:mm a");
        io.to(roomid).emit('message', msg, username, time);

        db.query(
            'INSERT INTO chat_messages (room_id, user_name, message) VALUES (?, ?, ?)', 
            [roomid, username, msg], 
            (err) => {
                if (err) console.error('DB insert error (message):', err);
            }
        );
    });

    socket.on('getCanvas', () => {
        if (roomBoard[socketroom[socket.id]]) {
            socket.emit('getCanvas', roomBoard[socketroom[socket.id]]);
        }
    });

    socket.on('draw', (newx, newy, prevx, prevy, color, size) => {
        socket.to(socketroom[socket.id]).emit('draw', newx, newy, prevx, prevy, color, size);
    });

    socket.on('clearBoard', () => {
        socket.to(socketroom[socket.id]).emit('clearBoard');
    });

    socket.on('store canvas', url => {
        roomBoard[socketroom[socket.id]] = url;
    });

    socket.on('disconnect', () => {
        if (!socketroom[socket.id]) return;

        socket.to(socketroom[socket.id]).emit('message', `${socketname[socket.id]} left the chat.`, 'Bot', moment().format("h:mm a"));
        socket.to(socketroom[socket.id]).emit('remove peer', socket.id);

        let index = rooms[socketroom[socket.id]].indexOf(socket.id);
        if (index !== -1) {
            rooms[socketroom[socket.id]].splice(index, 1);
        }

        io.to(socketroom[socket.id]).emit('user count', rooms[socketroom[socket.id]].length);

        delete socketroom[socket.id];
        delete socketname[socket.id];
        delete micSocket[socket.id];
        delete videoSocket[socket.id];

        console.log('User disconnected:', socket.id);
    });
});

io.on('connection', socket => {
    socket.on('join room', (roomId, username) => {
        socket.join(roomId);
        if (!usersInRoom[roomId]) usersInRoom[roomId] = {};
        usersInRoom[roomId][socket.id] = username;

        // Broadcast updated attendees list
        io.to(roomId).emit('attendees-update', usersInRoom[roomId]);
    });

    socket.on('disconnect', () => {
        for (const roomId in usersInRoom) {
            if (usersInRoom[roomId][socket.id]) {
                delete usersInRoom[roomId][socket.id];
                io.to(roomId).emit('attendees-update', usersInRoom[roomId]);
            }
        }
    });
});


server.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));



