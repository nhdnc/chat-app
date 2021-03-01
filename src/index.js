const path = require("path")
const http = require("http")
const express = require("express")
const socketio = require("socket.io") // Would return a function
const Filter = require("bad-words")
const {
    generateMessage,
    generateLocationMessage,
} = require("./utils/messages")
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()

// Creates our own server outside the Express library
// and configures it to use Express app
const server = http.createServer(app)

// Socket expects to be called
// with a raw HTTP server as a parameter
// When Express creates a server(using http.createServer)
// behind the scenes, we won't have access to that instance
// so we won't be able to pass that instance to socketio

// The main reason why we created our
// own server is so that we can pass it here
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, "../public")

app.use(express.static(publicDirectoryPath))

// socket.emit - sends an event to specific client
// io.emit - sends an event to every connected client
// socket.broadcast.emit - sends an event to every connected client except this one
// io.to.emit - sends an event to every connected client to specific chat room

// socket is an object that contains
// information about that new connection
io.on("connection", (socket) => {
    console.log("New WebSocket connection!")

    socket.on("join", (options, callback) => {

        // socket.id is a unique id generated by socket
        const {error, user} = addUser({ id: socket.id, ...options })

        // Return an error as an
        // acknowledgement
        if(error){
            return callback(error)
        }

        // socket.join can only be used
        // in the server
        // You'd have the ability to join
        // or emit something for a specific room
        socket.join(user.room)

        socket.emit("message", generateMessage("Admin", "Welcome!"))

        // Emits the event to all the connected clients
        // on specific room except for this one
        socket.broadcast.to(user.room).emit("message", generateMessage('Admin', `${user.username} has joined!`))


        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

    })

    socket.on("sendMessage", (message, callback) => {

        const user = getUser(socket.id)

        const filter = new Filter()

        if (filter.isProfane(message)) {
            return callback("Profanity is not allowed.")
        }

        io.to(user.room).emit("message", generateMessage(user.username, message))
        callback()
    })

    socket.on("sendLocation", (coords, callback) => {

        const user = getUser(socket.id)

        io.to(user.room).emit(
            "locationMessage",
            generateLocationMessage(
                user.username,
                `https://google.com/maps?q=${coords.latitude},${coords.longitude}`
            )
        )

        callback()
    })

    socket.on("disconnect", () => {

        const user = removeUser(socket.id)

        if(user){
            io.to(user.room).emit("message", generateMessage("Admin", `${user.username} has left!`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }

        
    })
})

// Starts the server that we've created
server.listen(port, () => {
    console.log(`Server is up on port ${port}!`)
})