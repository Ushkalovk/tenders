#!/usr/bin/env node
const path = require("path");
const passport = require("passport");
const expressSession = require("express-session");
const express = require("express");
const app = express();
const http = require("http").createServer(app);

const io = require("socket.io")(http);
module.exports = io;
const logger = require("morgan");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const routes = require("./routes/index")(passport);
require("./passport/init")(passport);

app.use(cors({ origin: "http://194.87.236.8/:8082" }));
app.use("/", express.static(path.join(__dirname, "front", "build")));

app.get("/index.html", (req, res) => {
  res.sendFile(path.resolve(__dirname, "front", "build", "index.html"));
});

mongoose.connect(
  "mongodb+srv://vladislav:tender2020@cluster0-5xkru.mongodb.net/test",
  {
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  }
);

app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/", routes);

// Configuring Passport

app.use(
  expressSession({
    secret: "mySecretKey",
    saveUninitialized: true,
    resave: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

http.listen(8082, () => {
  console.log("listening on *:8082");
});
