const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

require("dotenv").config();
const path = require('path')

const User = require('./models/user')
const Project = require('./models/project');

const errorController = require('./controllers/error')

const userRoutes = require('./routes/user')
const projectRoutes = require('./routes/project');
const authRoutes = require('./routes/auth')

const app = express();
const PORT = process.env.PORT || 8000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs")
app.set("views", "views")

app.use(express.json())
app.use(cookieParser())

app.use(userRoutes)
app.use(projectRoutes)
app.use(authRoutes)


mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Database Connected");
  })
  .catch((err) => {
    console.log(`ERROR: ${err}`);
  });

app.use(errorController.get404);


app.listen(PORT, () => {
  console.log(`Server listening on port: http://localhost:${PORT}/home`);
});