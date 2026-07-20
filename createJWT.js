const jwt = require("jsonwebtoken");
require("dotenv").config();



function createToken(fn, ln, id, role)
{
    try
    {
        const user = {userId:id, firstName:fn, lastName:ln, role:role};
        const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '20m'});
        return { accessToken };
    }
    catch(e)
    {
        return {error:e.message};
    }
}

exports.createToken = createToken;

