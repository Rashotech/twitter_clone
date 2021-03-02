const express = require('express');
const Post = require('../../models/PostModel');
const router = express.Router();
const User = require('../../models/UserModel');

router.get('/posts', async (req, res, next) => {
    var results = await getPosts({});
    return res.status(200).send(results)
});

router.get('/posts/:id', async (req, res, next) => {
    const postId = req.params.id;

    var results = await getPosts({ _id: postId});
    results = results[0];
    return res.status(200).send(results);
});

router.post('/posts', (req, res, next) => {

    if(!req.body.content) {
        console.log("Content not sent");
        return res.sendStatus(400);
    }

    var postData = {
        content: req.body.content,
        postedBy: req.session.user
    }

    Post.create(postData)
    .then(async (newPost) => {
        newPost = await User.populate(newPost, {path: "postedBy"})
        return res.status(201).send(newPost);
    })
    .catch((error) => {
        console.log(error);
        return res.sendStatus(400);
    });
});

router.put('/posts/:id/like', async (req, res, next) => {  
    var postId = req.params.id;
    var userId = req.session.user._id;
   
    var isLiked = req.session.user.likes && req.session.user.likes.includes(postId);
    var option = isLiked ? "$pull" : "$addToSet";

    req.session.user = await User.findByIdAndUpdate(userId, { [option]: { likes: postId } }, { new: true});

    const post = await Post.findByIdAndUpdate(postId, { [option]: { likes: userId } }, { new: true});
    return res.status(201).send(post);
});

router.post('/posts/:id/retweet', async (req, res, next) => {  
    var postId = req.params.id;
    var userId = req.session.user._id;
   
    var deletedPost = await Post.findOneAndDelete({ postedBy: userId, retweetData: postId});

    var option = deletedPost !== null ? "$pull" : "$addToSet";

    var repost = deletedPost;

    if (repost === null) {
        repost = await Post.create({ postedBy: userId, retweetData: postId})
    }

    req.session.user = await User.findByIdAndUpdate(userId, { [option]: { retweets: repost._id } }, { new: true});

    const post = await Post.findByIdAndUpdate(postId, { [option]: { retweetUsers: userId } }, { new: true});

        const reposts = await Post.populate(repost, {path: "postedBy"})
        const newPosts = await Post.populate(reposts, {path: "retweetData",
        populate: {
          path: 'postedBy'
        }
      })
    return res.status(201).send({post, newPosts});
});

router.post('/posts/reply', (req, res, next) => {  
    const { content, replyTo } = req.body;

    if(!req.body.content) {
        console.log("Content not sent");
        return res.sendStatus(400);
    }

    var postData = {
        content: content,
        postedBy: req.session.user,
        replyTo: replyTo
    }

    Post.create(postData)
    .then(async (newPost) => {
        newPost = await User.populate(newPost, {path: "postedBy"})
        return res.status(201).send(newPost);
    })
    .catch((error) => {
        console.log(error);
        return res.sendStatus(400);
    });
});

async function getPosts(filter) {
    var results = await Post.find(filter)
    .populate("postedBy")
    .populate("retweetData")
    .populate("replyTo")
    .sort({ "createdAt": -1 })
    .catch(error => console.log(error));

    results = await User.populate(results, { path: "replyTo.postedBy"})
    return await User.populate(results, { path: "retweetData.postedBy"})
}

module.exports = router;