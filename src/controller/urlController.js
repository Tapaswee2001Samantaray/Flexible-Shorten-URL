const checkValidUrl = require("valid-url");
const ShortId = require("shortid");
const urlModel = require("../model/urlModel");

const createShortUrl = async function (req, res) {
    try {
        let data = req.body;
        let longUrl = data.longUrl;

        if (Object.keys(data).length != 0) {

            if (!longUrl || longUrl == "") {
                return res.status(400).send({ status: false, message: "Long URL is required and Long URL can not be empty." });
            }

            if (typeof longUrl != "string") {
                return res.status(400).send({ status: false, message: "Long url must be String." });
            }

            if (!checkValidUrl.isWebUri(longUrl.trim())) {
                return res.status(400).send({ status: false, message: "Please Enter a valid URL." });
            }

            const findUrlDetails = await urlModel.findOne({ longUrl: longUrl }).select({ longUrl: 1, shortUrl: 1, urlCode: 1, _id: 0 });
            if (findUrlDetails) {
                return res.status(200).send({ status: true, data: findUrlDetails });
            }

            let uniqueUrlCode = ShortId.generate();
            data.urlCode = uniqueUrlCode;

            let shortUrl = " http://localhost:3000/" + uniqueUrlCode;
            data.shortUrl = shortUrl;

            const createUrlData = await urlModel.create(data);

            const finalResult = await urlModel.findById(createUrlData._id).select({ longUrl: 1, shortUrl: 1, urlCode: 1, _id: 0 });

            res.status(201).send({ status: true, data: finalResult });
        } else {
            return res.status(400).send({ status: false, message: "Invalid request." });
        }
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }

}


const getUrl = async function(req , res){
    try{
        let data = req.params;
        let urlCode = data.urlCode;
        if(Object.keys(data).length != 0){
            
            if(!urlCode){
                return res.status(400).send({status:false , message:"URL Code is required."});
            }

            let checkUrlCode = await urlModel.findOne({urlCode:urlCode});
            if(!checkUrlCode){
                return res.status(404).send({status:false , message:"No URL found with this URL code."});
            }

            res.status(302).redirect(checkUrlCode.longUrl);
        }else{
            return res.status(400).send({status:false , message:"Invalid request.Please provide valid information."});
        }
    }catch(err){
        return res.status(500).send({status:false , message:err.message});
    }
}

module.exports = { createShortUrl , getUrl};