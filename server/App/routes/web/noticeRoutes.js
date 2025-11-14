const express = require("express");
const { noticeInsert, noticeView, noticeDelete } = require("../../controllers/web/noticeController");

const noticeRouter = express.Router();

// Routes
noticeRouter.post("/insert", noticeInsert);
noticeRouter.get("/view", noticeView);
noticeRouter.delete("/delete/:id", noticeDelete);

module.exports = noticeRouter;
