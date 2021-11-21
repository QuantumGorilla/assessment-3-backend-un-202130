const express = require('express');

const Router = express.Router();

const {
    likeComment,
    deleteComment
} = require('../controllers/comment');


const { authMiddleware } = require('../middlewares/authMiddleware');

Router.post('/:id', authMiddleware, likeComment);
Router.delete('/:id', authMiddleware, deleteComment);


module.exports = Router;
