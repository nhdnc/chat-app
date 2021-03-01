// This function is provided by socket.io.js
// having access to socket allows us to send
// and receive events from client and server
const socket = io()

// $ is just a convention to indicate that it's a form element
const $messageForm = document.querySelector("#message-form")
const $messageFormInput = $messageForm.querySelector("input")
const $messageFormButton = $messageForm.querySelector("button")
const $sendLocationButton = document.querySelector("#send-location")
const $messages = document.querySelector("#messages")

// Templates
const messageTemplate = document.querySelector("#message-template").innerHTML
const locationTemplate = document.querySelector("#location-message-template").innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
// qs is a library we've includded
// location.search returns query parameter of the url
// Would return object of the query parameter
// ignoreQueryPrefix is used to remove the ? in ?username=test
const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true
})

const autoscroll = () => {

    // New message element
    // We'd use the $ convention
    // Bec. we're storing an element
    const $newMessage = $messages.lastElementChild


    // Height of the new message
    // getComputedStyle is JS
    
    // Get the margin
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    // Add the margin to the height
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Get the visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    // scrolltop gives us the amount of distance
    // scrolled from the top. Top is 0
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }

    console.log(newMessageMargin)

}

socket.on("message", (message) => {
    console.log(message)

    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.created_at).format("h:mm a")
    })

    $messages.insertAdjacentHTML("beforeend", html)
    autoscroll()
})

socket.on("locationMessage", (message) => {
    console.log(message)

    const html = Mustache.render(locationTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.created_at).format("h:mm a")
    })

    $messages.insertAdjacentHTML("beforeend", html)

    autoscroll()
})


socket.on('roomData', ({ room, users }) => {

    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })

    document.querySelector('#sidebar').innerHTML = html

})



$messageForm.addEventListener("submit", (e) => {
    e.preventDefault()

    $messageFormButton.setAttribute("disabled", "disabled")

    const message = e.target.elements.message.value

    // Argument on the callback is from the server
    socket.emit("sendMessage", message, (error) => {
        $messageFormButton.removeAttribute("disabled")
        $messageFormInput.value = ""
        $messageFormInput.focus()

        if (error) {
            return console.log(error)
        }

        console.log("Message delivered!")
    })
})

$sendLocationButton.addEventListener("click", () => {
    if (!navigator.geolocation) {
        return alert("Geolocation is not supported by your browswer.")
    }

    $sendLocationButton.setAttribute("disabled", "disabled")

    navigator.geolocation.getCurrentPosition((position) => {
        // console.log(latitude, longitude)
        socket.emit(
            "sendLocation",
            {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            },
            () => {
                $sendLocationButton.removeAttribute("disabled")
                console.log("Location shared!")
            }
        )
    })
})

socket.emit("join", { username, room }, (error) => {
   
    if(error){
        alert(error)
        location.href = '/'
    }

})
