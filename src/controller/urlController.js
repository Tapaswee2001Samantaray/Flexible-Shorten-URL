const checkValidUrl = require("valid-url");
const ShortId = require("shortid");
const axios = require("axios");

const urlModel = require("../model/urlModel");
const caching = require("../cache/caching");


//==============router handler for short url===============
const createShortUrl = async function (req, res) {
    try {
        let data = req.body;
        let longUrl = data.longUrl;

        //======long URL validation=====
        if (!longUrl || longUrl == "") {
            return res.status(400).send({ status: false, message: "Long URL is required and Long URL can not be empty." });
        }

        if (typeof longUrl != "string") {
            return res.status(400).send({ status: false, message: "Long url must be String." });
        }

        if (!checkValidUrl.isWebUri(longUrl.trim())) {
            return res.status(400).send({ status: false, message: "Please Enter a valid URL syntax." });
        }

        let checkUrl = await axios.get(longUrl) //this will work only on Public URL not private URL
            .then(() => longUrl)
            .catch(() => null)

        if (!checkUrl) {
            return res.status(400).send({ status: false, message: "Please enter a valid URL." });
        }

        //=====check if long URL exists and show its details from cached memory======
        let longUrlData = await caching.GET_ASYNC(longUrl);
        let cachedUrl = JSON.parse(longUrlData);
        if (cachedUrl) {
            return res.status(200).send({ status: true, data: cachedUrl });
        }

        const findUrlDetails = await urlModel.findOne({ longUrl: longUrl }).select({ longUrl: 1, shortUrl: 1, urlCode: 1, _id: 0 });
        if (findUrlDetails) {
            await caching.SETEX_ASYNC(longUrl, 86400, JSON.stringify(findUrlDetails));
            return res.status(200).send({ status: true, data: findUrlDetails });
        }

        //====if long url is unique then generate URL code and short URL=====
        let uniqueUrlCode = ShortId.generate();
        data.urlCode = uniqueUrlCode;

        let shortUrl = "http://localhost:3000/" + uniqueUrlCode;
        data.shortUrl = shortUrl.toLowerCase();

        //====here we are creating tha data=====
        const createUrlData = await urlModel.create(data);

        const finalResult = await urlModel.findById(createUrlData._id).select({ longUrl: 1, shortUrl: 1, urlCode: 1, _id: 0 });
        await caching.SETEX_ASYNC(longUrl, 86400, JSON.stringify(finalResult));

        res.status(201).send({ status: true, data: finalResult });
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }

}


//==============router handler for get url===============
const getUrl = async function (req, res) {
    try {
        let data = req.params;
        let urlCode = data.urlCode;

        //=====validation for URL code=======
        if (!urlCode) {
            return res.status(400).send({ status: false, message: "URL Code is required." });
        }

        //====checking the URL code is valid or not=====
        if (!ShortId.isValid(urlCode)) {
            return res.status(400).send({ status: false, message: "Please enter a valid URL code." });
        }

        let cachedUrlCode = await caching.GET_ASYNC(urlCode);
        let getCachedUrlCode = JSON.parse(cachedUrlCode);
        if (getCachedUrlCode) {
            return res.status(302).redirect(getCachedUrlCode);
        }

        let checkUrlCode = await urlModel.findOne({ urlCode: urlCode });
        if (!checkUrlCode) {
            return res.status(404).send({ status: false, message: "No URL found with this URL code." });
        } else {
            await caching.SETEX_ASYNC(urlCode, 86400, JSON.stringify(checkUrlCode.longUrl));
            return res.status(302).redirect(checkUrlCode.longUrl);
        }

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
}

module.exports = { createShortUrl, getUrl };