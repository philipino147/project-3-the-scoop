// database is let instead of const to allow us to modify it in test.js
let database = {
  users: {},
  articles: {},
  nextArticleId: 1,
  comments: {},
  nextCommentId:1
};

const routes = {
  '/users': {
    'POST': getOrCreateUser
  },
  '/users/:username': {
    'GET': getUser
  },
  '/articles': {
    'GET': getArticles,
    'POST': createArticle
  },
  '/articles/:id': {
    'GET': getArticle,
    'PUT': updateArticle,
    'DELETE': deleteArticle
  },
  '/articles/:id/upvote': {
    'PUT': upvoteArticle
  },
  '/articles/:id/downvote': {
    'PUT': downvoteArticle
  },
  '/comments':{
    'POST': createComment

  },
  '/comments/:id':{
    'PUT': updateComment,
    'DELETE': deleteComment
  },
  '/comments/:id/upvote':{
    'PUT': upvoteComment
  },
  '/comments/:id/downvote':{
    'PUT': downvoteComment
  },
};

function downvoteComment(url,request){

  //Used tp retreive the target comment's Id from the URL
  const downCommentId = Number(url.split('/').filter(segment => segment)[1]);

  const userDownvote = request.body && request.body.username;

  //We allow commentToDownvote to be variable in this case
  //so that it may be reassigned to the downvoted comment afterwards
  let commentToDownvote = database.comments[downCommentId];

  const response = {};

  if(userDownvote && //Checks if a user is given

    //Checks for existence of a valid target comment (taken from URL)
  commentToDownvote &&

  //Checks if given user exists in our database
  database.users[userDownvote]){

    //Updates our target comment to include given user
    //in the comment's downvotedBy array by using the function downvote
    commentToDownvote = downvote(commentToDownvote,userDownvote);

    //Updates the database with the new comment
    database.comments[downCommentId] = commentToDownvote;

    //Returns the new comment and a
    response.body = {comment : commentToDownvote};
    response.status = 200;
  }

  else {
    response.status = 400;
  }

  return response

}

function upvoteComment(url,request){
  const upCommentId = Number(url.split('/').filter(segment => segment)[1]);

  const userUpvote = request.body && request.body.username;

  //We allow commentToUpvote to be variable in this case
  //so that it may be reassigned to the upvoted comment afterwards
  let commentToUpvote = database.comments[upCommentId];

  const response = {};

  if(userUpvote &&
  commentToUpvote &&
  database.users[userUpvote]){
    commentToUpvote = upvote(commentToUpvote,userUpvote);
    database.comments[upCommentId] = commentToUpvote;

    response.body = {comment : commentToUpvote};
    response.status = 200;
  }

  else {
    response.status = 400;
  }

  return response

}

function deleteComment(url,request){
  //Note** The request arg does not have much functionality
  //here but could be useful for validation purposes.
  //One example could be checking that the username of the client
  //matches that of the comments author so that they're not deleting
  //someone else's comment.

  //Checks the URL to find the comment's id
  const delCommentId = Number(url.split('/').filter(function (segment) {
    return segment})[1]);

  //Finds our Comment Object
  const targetComment = database.comments[delCommentId];

  const response = {};

  //Checks if our comment object exists
  if(targetComment){

  //Finds correct article based on our Comment Object
  const targetArticle = database.articles[targetComment.articleId];

  //Finds the index of our comment in the article
  const articleIndex = targetArticle.commentIds.indexOf(delCommentId);

  //Removes the comment's id from the article
  database.articles[targetComment.articleId].commentIds.splice(articleIndex,1)

  //Finds correct user based on our Comment Object
  const targetUser = database.users[targetComment.username];

  //finds the index of our comment in the user's comments
  const userIndex = targetUser.commentIds.indexOf(delCommentId);

  //Removes the comment's id from the user
  database.users[targetComment.username].commentIds.splice(userIndex,1);

  //Removes the existence of the comment in our database
  database.comments[delCommentId] = null;

  //A response code for succesful delete
  response.status = 204;
  }
  else {
    //A response code for non-existent item
    response.status = 404;
  }
  return response;
}

function updateComment(url,request){
  const changeComment = request.body && request.body.comment;
  const response = {};

  if(database.comments[url.slice(-1)] === undefined)
  {
    response.status = 404;
    return response;
    }
  if(changeComment &&

  changeComment.id &&
  changeComment.body &&
  changeComment.username &&
  changeComment.articleId&&

  database.comments[changeComment.id])
  {
    const updatedComment = {
      id: changeComment.id,
      body: changeComment.body,
      username: changeComment.username,
      articleId: changeComment.articleId
    }

    database.comments[changeComment.id] = updatedComment;
    response.status = 200;
  }

  else {
    response.status = 400;
  }
  //console.log(response);
  return  response
}

function createComment(url,request) {
  //This is a faster way to assign a value to requestComment
  //while checking if the derivative objects exists.
  //If request.body did not exist then it would be undefined
  //and would not be assigned to requestComment
  const requestComment = request.body && request.body.comment;
  //console.log(requestComment);

  //Initializes an object for our output
  const response = {};

  //This checks that all objects are defined before using code
  if (requestComment &&

    //Theses are the property objects that should exist for requestComment
    requestComment.body &&
    requestComment.username &&
    requestComment.articleId &&

    //This checks that the request's username
    //exists in our database of users
    database.users[requestComment.username] &&

    //Checks if the request's article exists
    //in our database of articles
    database.articles[requestComment.articleId])

    {
    //Creates our comment object
    const commentToAdd = {
      id: database.nextCommentId++,
      body: requestComment.body,
      articleId: requestComment.articleId,
      username: requestComment.username,
      upvotedBy: [],
      downvotedBy: []
    };


    //Adds our object at the id index
    //of the database.comment object
    database.comments[commentToAdd.id] = commentToAdd;

    //Finds our commentToAdd object's username at index in users,
    //Accesses it's commentIds property (Initially a Blank Array),
    //and pushes the id of our comment object to it
    database.users[commentToAdd.username].commentIds.push(commentToAdd.id);
    //console.log(database.users[commentToAdd.username].commentIds);

    //Finds our object's associated article using articleId
    //Acceses commentIds property (Initially a Blank Array),
    //and pushes the id of our comment object to it
    database.articles[commentToAdd.articleId].commentIds.push(commentToAdd.id);
    //console.log(database.articles[commentToAdd.articleId].commentIds);

    //Creates the property "body" in our response object
    response.body = {comment: commentToAdd};
    response.status = 201;
  }

  else {//Code executed when our if statement above fails
    response.status = 400;
  }
  //console.log(response);
  return response;
}


function getUser(url, request) {
  const username = url.split('/').filter(segment => segment)[1];
  const user = database.users[username];
  const response = {};

  if (user) {
    const userArticles = user.articleIds.map(
        articleId => database.articles[articleId]);
    const userComments = user.commentIds.map(
        commentId => database.comments[commentId]);
    response.body = {
      user: user,
      userArticles: userArticles,
      userComments: userComments
    };
    response.status = 200;
  } else if (username) {
    response.status = 404;
  } else {
    response.status = 400;
  }

  return response;
}

function getOrCreateUser(url, request) {
  const username = request.body && request.body.username;
  const response = {};

  if (database.users[username]) {
    response.body = {user: database.users[username]};
    response.status = 200;
  } else if (username) {
    const user = {
      username: username,
      articleIds: [],
      commentIds: []
    };
    database.users[username] = user;

    response.body = {user: user};
    response.status = 201;
  } else {
    response.status = 400;
  }

  return response;
}

function getArticles(url, request) {
  const response = {};

  response.status = 200;
  response.body = {
    articles: Object.keys(database.articles)
        .map(articleId => database.articles[articleId])
        .filter(article => article)
        .sort((article1, article2) => article2.id - article1.id)
  };

  return response;
}

function getArticle(url, request) {
  const id = Number(url.split('/').filter(segment => segment)[1]);
  const article = database.articles[id];
  const response = {};

  if (article) {
    article.comments = article.commentIds.map(
      commentId => database.comments[commentId]);

    response.body = {article: article};
    response.status = 200;
  } else if (id) {
    response.status = 404;
  } else {
    response.status = 400;
  }

  return response;
}

function createArticle(url, request) {
  const requestArticle = request.body && request.body.article;
  const response = {};

  if (requestArticle && requestArticle.title && requestArticle.url &&
      requestArticle.username && database.users[requestArticle.username]) {
    const article = {
      id: database.nextArticleId++,
      title: requestArticle.title,
      url: requestArticle.url,
      username: requestArticle.username,
      commentIds: [],
      upvotedBy: [],
      downvotedBy: []
    };

    database.articles[article.id] = article;
    database.users[article.username].commentIds.push(article.id);

    response.body = {article: article};
    response.status = 201;
  } else {
    response.status = 400;
  }

  return response;
}

function updateArticle(url, request) {

  //Used to locate the last portion of the URL realted to the article id
  const id = Number(url.split('/').filter(segment => segment)[1]);

  const savedArticle = database.articles[id];
  const requestArticle = request.body && request.body.article;
  const response = {};

  if (!id || !requestArticle) {
    response.status = 400;
  } else if (!savedArticle) {
    response.status = 404;
  } else {
    savedArticle.title = requestArticle.title || savedArticle.title;
    savedArticle.url = requestArticle.url || savedArticle.url;

    response.body = {article: savedArticle};
    response.status = 200;
  }

  return response;
}

function deleteArticle(url, request) {
  const id = Number(url.split('/').filter(segment => segment)[1]);
  const savedArticle = database.articles[id];
  const response = {};

  if (savedArticle) {
    database.articles[id] = null;
    savedArticle.commentIds.forEach(commentId => {
      const comment = database.comments[commentId];
      database.comments[commentId] = null;
      const userCommentIds = database.users[comment.username].commentIds;
      userCommentIds.splice(userCommentIds.indexOf(id), 1);
    });
    const userArticleIds = database.users[savedArticle.username].articleIds;
    userArticleIds.splice(userArticleIds.indexOf(id), 1);
    response.status = 204;
  } else {
    response.status = 400;
  }

  return response;
}

function upvoteArticle(url, request) {
  const id = Number(url.split('/').filter(segment => segment)[1]);
  const username = request.body && request.body.username;
  let savedArticle = database.articles[id];
  const response = {};

  if (savedArticle && database.users[username]) {
    savedArticle = upvote(savedArticle, username);

    response.body = {article: savedArticle};
    response.status = 200;
  } else {
    response.status = 400;
  }

  return response;
}

function downvoteArticle(url, request) {
  const id = Number(url.split('/').filter(segment => segment)[1]);
  const username = request.body && request.body.username;
  let savedArticle = database.articles[id];
  const response = {};

  if (savedArticle && database.users[username]) {
    savedArticle = downvote(savedArticle, username);

    response.body = {article: savedArticle};
    response.status = 200;
  } else {
    response.status = 400;
  }

  return response;
}

function upvote(item, username) {
  //Used to check if our item (comment OR article) was
  //already downvoted by the current user.
  //If true, it removes their name from the downvotedBy array
  if (item.downvotedBy.includes(username)) {
    item.downvotedBy.splice(item.downvotedBy.indexOf(username), 1);
  }

  //Next we check if current user is NOT included in the
  //upvotedBy array for the selected item.
  //If true, we add their name to the upvotedBy array
  if (!item.upvotedBy.includes(username)) {
    item.upvotedBy.push(username);
  }
  return item;
}

function downvote(item, username) {
  if (item.upvotedBy.includes(username)) {
    item.upvotedBy.splice(item.upvotedBy.indexOf(username), 1);
  }
  if (!item.downvotedBy.includes(username)) {
    item.downvotedBy.push(username);
  }
  return item;
}

function loadDatabase(){
  //Used to read text from a yaml file and output it to the console()
  const fileYAML = require('js-yaml');
  const fs = require('fs');

  // Get document, or throw exception on error
try {
  //Attempts to retrieve the file data
  const doc = fileYAML.safeLoad(fs.readFileSync('database.yml', 'utf8'));
  //Sets indents in the loaded JSON object for readability
  const indentedDoc = JSON.stringify(doc, null, 4);
  //console.log(indentedDoc);
  return indentedDoc;
} catch (e) {
  //If data not retreived then outputs the error
  console.log(e);
  return;
}
}



function saveDatabase(){
  const fileYAML = require('js-yaml');
  const fs = require('fs');
  //Used to save the database object to a yaml-encoded file
  const doc = fileYAML.safeDump (database, {
  'sortKeys': false       //does not sort object keys
});
  //console.log(doc);
  return doc;
}

// Write all code above this line.

const http = require('http');
const url = require('url');

const port = process.env.PORT || 4000;
const isTestMode = process.env.IS_TEST_MODE;

const requestHandler = (request, response) => {
  const url = request.url;
  const method = request.method;
  const route = getRequestRoute(url);

  if (method === 'OPTIONS') {
    var headers = {};
    headers["Access-Control-Allow-Origin"] = "*";
    headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, DELETE, OPTIONS";
    headers["Access-Control-Allow-Credentials"] = false;
    headers["Access-Control-Max-Age"] = '86400'; // 24 hours
    headers["Access-Control-Allow-Headers"] = "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept";
    response.writeHead(200, headers);
    return response.end();
  }

  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.setHeader(
      'Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  if (!routes[route] || !routes[route][method]) {
    response.statusCode = 400;
    return response.end();
  }

  if (method === 'GET' || method === 'DELETE') {
    const methodResponse = routes[route][method].call(null, url);
    !isTestMode && (typeof saveDatabase === 'function') && saveDatabase();

    response.statusCode = methodResponse.status;
    response.end(JSON.stringify(methodResponse.body) || '');
  } else {
    let body = [];
    request.on('data', (chunk) => {
      body.push(chunk);
    }).on('end', () => {
      body = JSON.parse(Buffer.concat(body).toString());
      const jsonRequest = {body: body};
      const methodResponse = routes[route][method].call(null, url, jsonRequest);
      !isTestMode && (typeof saveDatabase === 'function') && saveDatabase();

      response.statusCode = methodResponse.status;
      response.end(JSON.stringify(methodResponse.body) || '');
    });
  }
};

const getRequestRoute = (url) => {
  const pathSegments = url.split('/').filter(segment => segment);

  if (pathSegments.length === 1) {
    return `/${pathSegments[0]}`;
  } else if (pathSegments[2] === 'upvote' || pathSegments[2] === 'downvote') {
    return `/${pathSegments[0]}/:id/${pathSegments[2]}`;
  } else if (pathSegments[0] === 'users') {
    return `/${pathSegments[0]}/:username`;
  } else {
    return `/${pathSegments[0]}/:id`;
  }
}

if (typeof loadDatabase === 'function' && !isTestMode) {
  const savedDatabase = loadDatabase();
  if (savedDatabase) {
    for (key in database) {
      database[key] = savedDatabase[key] || database[key];
    }
  }
}

const server = http.createServer(requestHandler);

server.listen(port, (err) => {
  if (err) {
    return console.log('Server did not start succesfully: ', err);
  }

  console.log(`Server is listening on ${port}`);
});
