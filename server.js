const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const helmet = require('helmet');
const rateLimit = require("express-rate-limit");

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

// Security Middlewares
app.use(helmet());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs")
app.set("views", "views")

app.use(express.json())
app.use(cookieParser())

app.use(userRoutes)
app.use(projectRoutes)
app.use(authRoutes)

app.use(errorController.get404);
app.use((error, req, res, next) => {
  console.error(error.stack);
  res
    .status(500)
    .render("500", { pageTitle: "Error", errorMessage: error.message });
});


mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Database Connected");
    app.listen(PORT, () => {
      console.log(`Server listening on port: http://localhost:${PORT}/home`);
    });
  })
  .catch((err) => {
    console.error(`ERROR: ${err}`);
  });