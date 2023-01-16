const express = require("express");
const router = express.Router();
const urlController = require("../controller/urlController");

router.post("/url/shorten" , urlController.createShortUrl);
router.get("/:urlCode" , urlController.getUrl);

router.all("/*" , function(req ,res){
    res.status(400).send({status:false , message:"Please input a valid URL."});
});

module.exports = router;