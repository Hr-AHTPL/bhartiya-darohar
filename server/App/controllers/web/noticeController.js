const noticeModel = require("../../models/noticeDetails.model");

const noticeInsert = (req, res) => {
  const { title, description } = req.body;

  const notice = new noticeModel({
    title,
    description,
  });
 
  notice
    .save()
    .then(() => res.send({ status: 1, message: "Notice added successfully" }))
    .catch((err) =>
      res.send({ status: 0, message: "Error while saving notice", error: err.message })
    );
};

// View All Notices
const noticeView = (req, res) => {
  noticeModel
    .find()
    .sort({ createdAt: -1 }) // optional: shows latest first
    .then((noticeList) => res.send({ status: 1, noticeList }))
    .catch((err) =>
      res.send({ status: 0, message: "Error while fetching notices", error: err.message })
    );
};

// Delete Notice
const noticeDelete = (req, res) => {
  const id = req.params.id;

  noticeModel
    .deleteOne({ _id: id })
    .then(() => res.send({ status: 1, message: "Notice deleted successfully" }))
    .catch((err) =>
      res.send({ status: 0, message: "Error while deleting notice", error: err.message })
    );
};


module.exports = {
  noticeInsert,
  noticeView,
  noticeDelete,
};