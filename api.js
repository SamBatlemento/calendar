require('express');
const token = require('./createJWT.js');
const  bcrypt = require('bcrypt');
const User = require('./models/User');
const Coach = require('./models/Coach');
const Athlete = require('./models/Athlete');


exports.setApp = function(app, mongoose)
{  
  
  app.post('/api/login', async(req, res) =>
  {
    const { email, password } = req.body;
    let ret;
    
    try
    {
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
        if(!user || !(await bcrypt.compare(password, user.password)))
        {
            return res.status(200).json({ error: 'Invalid email/password' });
        }

        ret = token.createToken(user.firstName, user.lastName, user._id, user.role);
        ret.role = user.role;
    }
    catch(e)
    {
        ret = {error : e.message};
    }
    res.status(200).json(ret);
  });
  

  //More api calls
}
