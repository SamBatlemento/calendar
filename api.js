require('express');
require('mongodb');

exports.setApp = function(app, client)
{
    
  app.post('/api/addcard', async(req, res, next) =>
  {  
      const {userId, card} = req.body;
  
      const newCard = {Card:card,UserId:userId};
      var error = '';
  
      try
      {
          const db = client.db('COP4331Cards');
          const result = db.collection('Cards').insertOne(newCard);
      }
      catch(e)
      {
          error = e.toString();
      }
      cardList.push( card );
      var ret = { error: error };
      res.status(200).json(ret);
  });
  
  
  app.post('/api/login', async(req, res, next) =>
  {
      var error = '';
  
      const {login, password} = req.body;
  
      const db = client.db('COP4331Cards');
      const results = await db.collection('Users').find({Login:login, Password:password}).toArray();
  
      var id = -1;
      var fn = '';
      var ln = '';
  
      if(/*login.toLowerCase() == 'rickl' && password == 'COP4331'*/results.length>0)
      {
          id = results[0].UserID;
          fn = results[0].FirstName;
          ln = results[0].LastName;
      }
      else
      {
          error='Invalid username/password';
      }
  
      var ret = {id:id, firstName:fn, lastName:ln, error:''};
      res.status(200).json(ret);
  });
  
  app.post('/api/searchcards', async(req, res, next) =>
  {
      var error = '';
  
      const {userId, search} = req.body;
  
      var _search = search.trim();
  
      const db = client.db('COP4331Cards');
      const results = await db.collection('Cards').find({"Card":{$regex:_search+'.*', $options:'i'}}).toArray();
  
  
      var _ret = [];
  
      for(var i=0; i<results.length; i++)
      {
          _ret.push(results[i].Card);
      }
  
      var ret = {results:_ret, error:error};
      res.status(200).json(ret);
  });
  
}
