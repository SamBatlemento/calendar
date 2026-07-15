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

exports.isExpired = function(token)
{
    try
    {
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        return false;
    }
    catch (e)
    {
        return true;
    }
}

exports.refresh = function(token)
{
    try
    {
        const ud = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, { ignoreExpiration: true });
        return createToken(ud.firstName, ud.lastName, ud.userId, ud.role);
    }
    catch (e)
    {
        return { error: "Invalid token" };
    }
}
