const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const morgan = require('morgan');
const session = require('express-session');
const isSignedIn = require("./middleware/is-signed-in.js");
const passUserToView = require("./middleware/pass-user-to-view.js");



const authController = require('./controllers/auth.js');
const postsController = require("./controllers/posts.js");
const Post = require("./models/post.js")


const port = process.env.PORT ? process.env.PORT : '3000';

mongoose.connect(process.env.MONGODB_URI);

mongoose.connection.on('connected', () => {
  console.clear();
  console.log(`Connected to MongoDB ${mongoose.connection.name}.`);
});

app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'))
app.use(methodOverride('_method'));
app.use(morgan('dev'));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passUserToView);


app.get('/', async (req, res) => {
  const publicPosts = await Post.find({isPrivate: false}).populate("author")
  res.render('index.ejs', { publicPosts});
});


app.use('/auth', authController);
app.use(isSignedIn);
app.use("/posts", postsController)

// app.get("/sign-in", (req, res) => {
//   res.render("sign-in.ejs");
// });

// app.get("/sign-up", (req, res) => {

//     res.render("sign-up.ejs")
// })
// app.use((req, res, next) => {
//   res.locals.session = req.session;
//   next();
// });


mongoose.connection.on('connected', () => {
  console.clear();
  console.log(`Connected to MongoDB ${mongoose.connection.name}.`);
  app.listen(port, () => {
    console.log(`The express app is ready on port ${port}!`);
});
});


