require('dotenv').config();

const express = require("express");
const app = express();
const server = require("http").Server(app);
const { v4: uuidv4 } = require("uuid");

const passport = require("passport");
const cookieSession = require('cookie-session')
require('./public/passport-setup');

app.use(cookieSession({
  name: 'tuto-session',
  keys: ['key1', 'key2']
}))


app.set("view engine", "ejs");
const io = require("socket.io")(server, {
  cors: {
    origin: '*'
  }
});


const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
  debug: true,
});


// Auth middleware that checks if the user is logged in
const isLoggedIn = (req, res, next) => {
  if (req.user) {
    next();
  } else {
    res.sendStatus(401);
  }
}

// Initializes passport and passport sessions
app.use(passport.initialize());
app.use(passport.session());


app.use("/peerjs", peerServer);
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/index", (req, res) => {
  res.redirect(`/${uuidv4()}`);
});


// Auth Routes
app.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/google/callback', passport.authenticate('google', { failureFlash: true, failureRedirect: '/login', successRedirect: '/resume' }));


// app.get('/google/callback', passport.authenticate('google', { failureRedirect: '/' }),
//   function (req, res) {

//     res.redirect('/index');
//   }
// );

app.get('/logout', (req, res) => {
  req.session = null;
  req.logout();
  res.redirect('/');
})



app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId, userName) => {
    socket.join(roomId);
    socket.to(roomId).broadcast.emit("user-connected", userId);
    socket.on("message", (message) => {
      io.to(roomId).emit("createMessage", message, userName);
    });
  });
});





server.listen(process.env.PORT || 3000);
