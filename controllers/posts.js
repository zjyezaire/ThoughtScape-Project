const express = require("express");
const router = express.Router();
const Post = require("../models/post.js");
const isSignedIn = require("../middleware/is-signed-in"); // Middleware for authentication

// Apply authentication middleware to all routes in this file
router.use(isSignedIn);

// CREATE - Show form to create a new post
router.get("/new", (req, res) => {
  res.render("posts/new.ejs");
});

// CREATE - Add a new post to the database
router.post("/", async (req, res) => {
  try {
    // Basic validation for required fields
    if (!req.body.title || !req.body.content) {
      return res.send("Title and content are required.");
    }

    const newPost = new Post({
      title: req.body.title.trim(),
      content: req.body.content.trim(),
      author: req.session.user._id,
      isPrivate: req.body.isPrivate === "on",
      genre: req.body.genre
    });

    await newPost.save();
    // Redirect to the new post's page after successful creation
    res.redirect(`/posts/${newPost._id}`);
  } catch (error) {
    console.log(error);
    res.redirect("/");
  }
});

// READ - List all posts with pagination
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10; // Number of posts per page
    const skip = (page - 1) * limit;

    // Find public posts, with pagination
    const posts = await Post.find({ isPrivate: false })
      .populate("author", "username")
      .skip(skip)
      .limit(limit);

    const totalPosts = await Post.countDocuments({ isPrivate: false });
    const totalPages = Math.ceil(totalPosts / limit);

    res.render("posts/index.ejs", { posts, currentPage: page, totalPages });
  } catch (error) {
    console.log(error);
    res.redirect("/");
  }
});

// READ - Show a single post
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate("author", "username");
    // Ensure private posts are only accessible by their author
    if (!post || (post.isPrivate && post.author._id.toString() !== req.session.user._id)) {
      return res.redirect("/posts");
    }
    res.render("posts/show.ejs", { post });
  } catch (error) {
    console.log(error);
    res.redirect("/posts");
  }
});

// UPDATE - Show form to edit a post
router.get("/:id/edit", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    // Ensure only the author can edit the post
    if (!post || post.author.toString() !== req.session.user._id) {
      return res.redirect("/posts");
    }
    res.render("posts/edit.ejs", { post });
  } catch (error) {
    console.log(error);
    res.redirect("/posts");
  }
});

// UPDATE - Update a post in the database
router.put("/:id", async (req, res) => {
  try {
    if (!req.body.title || !req.body.content) {
      return res.send("Title and content are required.");
    }

    const post = await Post.findById(req.params.id);
    // Ensure only the author can update the post
    if (!post || post.author.toString() !== req.session.user._id) {
      return res.redirect("/posts");
    }

    post.title = req.body.title.trim();
    post.content = req.body.content.trim();
    post.isPrivate = req.body.isPrivate === "on";
    post.genre = req.body.genre;
    post.updatedAt = Date.now();

    await post.save();
    res.redirect(`/posts/${req.params.id}`);
  } catch (error) {
    console.log(error);
    res.redirect("/posts");
  }
});

// DELETE - Remove a post
router.delete("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    // Ensure only the author can delete the post
    if (!post || post.author.toString() !== req.session.user._id) {
      return res.redirect("/posts");
    }

    await Post.findByIdAndDelete(req.params.id);
    res.redirect("/posts");
  } catch (error) {
    console.log(error);
    res.redirect("/posts");
  }
});

module.exports = router;
