const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.verifyJWT = function(req, res, next)
{
    const authHeader = req.headers.authorization;

    if(!authHeader)
    {
        return res.status(401).json({ error: 'No token provided' });
    }

    const parts = authHeader.split(' ');
    const token = parts[1]; // expects "Bearer <token>"

    if(!token)
    {
        return res.status(401).json({ error: 'Malformed authorization header' });
    }

    try
    {
        const verified = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        req.user = verified; // { userId, firstName, lastName, role, iat, exp }
        next();
    }
    catch(e)
    {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

exports.requireRole = function(role)
{
    return function(req, res, next)
    {
        if(req.user.role !== role)
        {
            return res.status(403).json({ error: 'Forbidden' });
        }
        next();
    };
}