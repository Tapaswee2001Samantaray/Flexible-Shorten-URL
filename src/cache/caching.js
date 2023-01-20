const redis = require("redis");
const { promisify } = require("util");

//1. Conneting to the redis server
const redisClient = redis.createClient(
    11272,
    "redis-11272.c301.ap-south-1-1.ec2.cloud.redislabs.com",
    { no_ready_check: true }
);
redisClient.auth("v2cPcRxKVCAR0felVMHVdaX3Zy7LdUAp", function (err) {
    if (err) throw err;
});

redisClient.on("connect", async function () {
    console.log("Connected to Redis..");
});



//2. Prepare the functions for each command

const SETEX_ASYNC = promisify(redisClient.SETEX).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

module.exports = { SETEX_ASYNC, GET_ASYNC };