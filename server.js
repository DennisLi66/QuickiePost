//Things to Do
//Cookies
//MYSQL
//POST Request for Password
//GET Requests for Posts
//Maybe Search By Hashtags?
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const randomatic = require('randomatic');
const cors = require("cors");

const app = express();
app.use(express.static("public"));
app.use(cors(
  {
    origin: 'http://localhost:3000',
    // credentials: true,
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
  }
));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(function(req, res, next) {
res.header('Content-Type', 'application/json;charset=UTF-8')
res.header('Access-Control-Allow-Credentials', true)
res.header(
  'Access-Control-Allow-Headers',
  'Origin, X-Requested-With, Content-Type, Accept'
)
next()
})
app.use(bodyParser.json());
app.use(cookieParser());
var connection = mysql.createConnection({
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  multipleStatements: true
})
connection.connect();

// Get All Posts
app.get("/posts",function(req,res){
  //Should change to get username as well
  var sQuery =
  `
  SELECT posts.postID as postID, posts.userID as userID, title, content, username, visibility, uvisibility as userVisibility, ifnull(total,0) as totalLikes, ifnull(totalComments,0) as totalComments, subDate FROM
  ( SELECT * from posts
    LEFT JOIN
    (select userid as UID,username,visibility as uvisibility from users) uzers
    on uzers.UID = posts.userID
    WHERE posts.visibility != 'hidden' AND posts.visibility != 'private'
    AND uzers.uvisibility != 'hidden' AND uzers.uvisibility != 'private'
    ORDER BY subDate DESC
    ) posts
    LEFT JOIN
  (SELECT count(*) as total, postID FROM likes GROUP BY postID) totalLikes
  on totalLikes.postID = posts.postID
  LEFT JOIN
  (  SELECT count(*) as totalComments, postID from comments GROUP BY postID) comments
  ON comments.postID = posts.postID
  `
  var variables = [];
  if (req.query.userID && req.query.sessionID){
    var cQuery =
    `
    SELECT * FROM
    (select userID,max(sessionDate) as high from sessions group by userID) a
    RIGHT JOIN
    (
    Select * from sessions WHERE userID = ? AND sessionID = ? AND
    (timeduration = 'FOREVER' OR (timeduration = "HOUR" AND NOW() < date_add(sessionDate,Interval 1 Hour)))
    )
    sessions
    ON sessions.userID = a.userID AND sessions.sessionDate = a.high
    `;
    sQuery =
    `
    SELECT posts.postID as postID, posts.userID as userID, title, content, username, visibility, uvisibility as userVisibility, ifnull(total,0) as totalLikes, if(desig.userID is null,'Unliked','Liked') as Liked,  ifnull(totalComments,0) as totalComments, subDate FROM
    ( SELECT * from posts
    LEFT JOIN
    (select userid as UID,username,visibility as uvisibility from users) uzers
    on uzers.UID = posts.userID
    WHERE posts.visibility != 'hidden' AND posts.visibility != 'private'
    AND uzers.uvisibility != 'hidden' AND uzers.uvisibility != 'private'
    ORDER BY subDate DESC
    ) posts
    LEFT JOIN
    (SELECT count(*) as total, postID FROM likes GROUP BY postID) totalLikes
    on totalLikes.postID = posts.postID
    LEFT JOIN
    (  select * from likes WHERE userID = ?) desig
    on desig.postID = posts.postID
    LEFT JOIN
    (  SELECT count(*) as totalComments, postID from comments GROUP BY postID) comments
    ON comments.postID = posts.postID;
    `;
    variables.push(req.query.userID);
    connection.query(cQuery,[req.query.userID,req.query.sessionID],function(err1,results1,fields){
      if (err1){
        return res.status(200).json({
          status: -1,
          message: err1
        })
      }
      else if (results1.length === 0){
        return res.status(200).json({
          status: -1,
          message: "Not Valid Session."
        })
      }else{
        connection.query(sQuery,variables,function(err,results,fields){
        if (err){
          return res.status(200).json({
            status: -1,
            message: err
          })
        } else if (results){
          // console.log(results);
          var toPrep = {};
          for (let i = 0; i < results.length; i++){
            toPrep[i] = {
              title: results[i].title,
              userID: results[i].userID,
              content: results[i].content,
              subDate: results[i].subDate,
              username: results[i].username,
              totalLikes: results[i].totalLikes,
              totalComments: results[i].totalComments,
              Liked: results[i].Liked,
              postID: results[i].postID
            }
          }
          return res.status(200).json({
            status: 0,
            message: "Request Received.",
            contents: toPrep
          })
        }
      })
      }
    })


  }
  else{
    connection.query(sQuery,variables,function(err,results,fields){
    if (err){
      return res.status(200).json({
        status: -1,
        message: err
      })
    } else if (results){
      // console.log(results);
      var toPrep = {};
      for (let i = 0; i < results.length; i++){
        toPrep[i] = {
          title: results[i].title,
          userID: results[i].userID,
          content: results[i].content,
          subDate: results[i].subDate,
          username: results[i].username,
          totalLikes: results[i].totalLikes,
          totalComments: results[i].totalComments,
          postID: results[i].postID
        }
      }
      return res.status(200).json({
        status: 0,
        message: "Request Received.",
        contents: toPrep
      })
    }
  })
  }
})
app.get("/myfeed",function(req,res){
  //show my posts and posts Im allowed to view from friends
  if (!req.query.userID || !req.query.sessionID){
    return res.status(200).json({
      status: -1,
      message: "Not Enough Information."
    })
  }
  // console.log(req.query.userID);
  // console.log(req.query.sessionID);
  //check for valid sessions
  var cQuery =
  `
  SELECT * FROM
  (select userID,max(sessionDate) as high from sessions group by userID) a
  RIGHT JOIN
  (
  Select * from sessions WHERE userID = ? AND sessionID = ? AND
  (timeduration = 'FOREVER' OR (timeduration = "HOUR" AND NOW() < date_add(sessionDate,Interval 1 Hour)))
  )
  sessions
  ON sessions.userID = a.userID AND sessions.sessionDate = a.high
  `
  var sQuery =
  `
  select * from posts
  LEFT JOIN viewers ON
  viewers.posterID = posts.userID
  LEFT JOIN
  (select userid,username,visibility from users) uzers
  on uzers.userID = posts.userID
  WHERE (viewers.viewerID = ? OR posts.userID = ?) AND uzers.visibility != 'hidden' AND posts.visibility != 'hidden'
  ORDER by subDate DESC
  ;
  `;
  connection.query(cQuery,[req.query.userID,req.query.sessionID],function(err1,results1,fields){
    if (err1){
      return res.status(200).json({
        status: -1,
        message: err1
      })
    }
    else if (results1.length === 0){
      return res.status(200).json({
        status: -1,
        message: "No Valid Session."
      })
    }
    else {
      // console.log(req.query.userID);
      connection.query(sQuery,[req.query.userID,req.query.userID],function(err,results,fields){
        if (err){
          return res.status(200).json({
            status: -1,
            message: err
          })
        } else if (results){
          // console.log(results);
          var toPrep = {};
          for (let i = 0; i < results.length; i++){
            toPrep[i] = {
              title: results[i].title,
              userID: results[i].userID,
              content: results[i].content,
              subDate: results[i].subDate, username: results[i].username
            }
          }
          return res.status(200).json({
            status: 0,
            message: "Request Received.",
            contents: toPrep
          })
        }
      })
    }
  })
})
app.get("/search",function(req,res){
  var title = req.query.title;
  var content = req.query.content;
  var sdate = req.query.sDate;
  var username = req.query.username;
  if (!title && !content && !sdate && !username){
    return res.status(200).json({
      status: -1,
      message: "No valid search information included."
    })
  }
  else if (title && content && sdate){
    var sQuery =
    `
    SELECT * from posts
    LEFT JOIN
    (select userid,username from users) uzers
    on uzers.userID = posts.userID
    WHERE visibility != 'hidden' AND visibility != 'private'
    AND title = ?
    AND content LIKE ?
    AND DATE(subDate) = ?;
    `;
    connection.query(sQuery,[title,'%' + content + '%',sdate],function(err,results,fields){
      if (err){
        return res.status(200).json({
          status: -1,
          message: err
        })
      }else{
        if (results.length > 0){
          var toPrep = {};
          for (let i = 0; i < results.length; i++){
            toPrep[i] = {
              title: results[i].title,
              userID: results[i].userID,
              content: results[i].content,
              subDate: results[i].subDate, username: results[i].username
            }
          }
          return res.status(200).json({
            status: 0,
            message: "Posts Returned.",
            contents: toPrep
          })
        }else{
          return res.status(200).json({
            status: 1,
            message: "No values returned."
          })
        }
      }
    })
  }else if (title && content && username){
    var sQuery =
    `
    SELECT * from posts
    LEFT JOIN
    (select userid,username from users) uzers
    on uzers.userID = posts.userID
    WHERE visibility != 'hidden' AND visibility != 'private'
    AND title = ?
    AND content LIKE ?
    AND username = ?;
    `;
    connection.query(sQuery,[title,'%' + content + '%',username],function(err,results,fields){
      if (err){
        return res.status(200).json({
          status: -1,
          message: err
        })
      }else{
        if (results.length > 0){
          var toPrep = {};
          for (let i = 0; i < results.length; i++){
            toPrep[i] = {
              title: results[i].title,
              userID: results[i].userID,
              content: results[i].content,
              subDate: results[i].subDate, username: results[i].username
            }
          }
          return res.status(200).json({
            status: 0,
            message: "Posts Returned.",
            contents: toPrep
          })
        }else{
          return res.status(200).json({
            status: 1,
            message: "No values returned."
          })
        }
      }
    })
  }else if (title && username && sdate){
    var sQuery =
    `
    SELECT * from posts
    LEFT JOIN
    (select userid,username from users) uzers
    on uzers.userID = posts.userID
    WHERE visibility != 'hidden' AND visibility != 'private'
    AND title = ?
    AND DATE(subDate) = ?;
    AND username = ?;
    `;
    connection.query(sQuery,[title,sdate,username],function(err,results,fields){
      if (err){
        return res.status(200).json({
          status: -1,
          message: err
        })
      }else{
        if (results.length > 0){
          var toPrep = {};
          for (let i = 0; i < results.length; i++){
            toPrep[i] = {
              title: results[i].title,
              userID: results[i].userID,
              content: results[i].content,
              subDate: results[i].subDate, username: results[i].username
            }
          }
          return res.status(200).json({
            status: 0,
            message: "Posts Returned.",
            contents: toPrep
          })
        }else{
          return res.status(200).json({
            status: 1,
            message: "No values returned."
          })
        }
      }
    })
  }else if (username && content && sdate){
    var sQuery =
    `
    SELECT * from posts
    LEFT JOIN
    (select userid,username from users) uzers
    on uzers.userID = posts.userID
    WHERE visibility != 'hidden' AND visibility != 'private'
    AND content LIKE ?
    AND DATE(subDate) = ?
    AND username = ?;
    `;
    connection.query(sQuery,['%' + content + '%',sdate,username],function(err,results,fields){
      if (err){
        return res.status(200).json({
          status: -1,
          message: err
        })
      }else{
        if (results.length > 0){
          var toPrep = {};
          for (let i = 0; i < results.length; i++){
            toPrep[i] = {
              title: results[i].title,
              userID: results[i].userID,
              content: results[i].content,
              subDate: results[i].subDate, username: results[i].username
            }
          }
          return res.status(200).json({
            status: 0,
            message: "Posts Returned.",
            contents: toPrep
          })
        }else{
          return res.status(200).json({
            status: 1,
            message: "No values returned."
          })
        }
      }
    })
  }
  else if (title && content){
    var sQuery =
    `
    SELECT * from posts
    LEFT JOIN
    (select userid,username from users) uzers
    on uzers.userID = posts.userID
    WHERE visibility != 'hidden' AND visibility != 'private'
    AND title = ?
    AND content LIKE ?;
    `;
    connection.query(sQuery,[title,'%' + content + '%'],function(err,results,fields){
      if (err){
        return res.status(200).json({
          status: -1,
          message: err
        })
      }else{
        if (results.length > 0){
          var toPrep = {};
          for (let i = 0; i < results.length; i++){
            toPrep[i] = {
              title: results[i].title,
              userID: results[i].userID,
              content: results[i].content,
              subDate: results[i].subDate, username: results[i].username
            }
          }
          return res.status(200).json({
            status: 0,
            message: "Posts Returned.",
            contents: toPrep
          })
        }else{
          return res.status(200).json({
            status: 1,
            message: "No values returned."
          })
        }
      }
    })
  }else if (title && sdate){
    var sQuery =
    `
    SELECT * from posts
    LEFT JOIN
    (select userid,username from users) uzers
    on uzers.userID = posts.userID
    WHERE visibility != 'hidden' AND visibility != 'private'
    AND title = ?
    AND DATE(subDate) = ?;
    `;
    connection.query(sQuery,[title,sdate],function(err,results,fields){
      if (err){
        return res.status(200).json({
          status: -1,
          message: err
        })
      }else{
        if (results.length > 0){
          var toPrep = {};
          for (let i = 0; i < results.length; i++){
            toPrep[i] = {
              title: results[i].title,
              userID: results[i].userID,
              content: results[i].content,
              subDate: results[i].subDate, username: results[i].username
            }
          }
          return res.status(200).json({
            status: 0,
            message: "Posts Returned.",
            contents: toPrep
          })
        }else{
          return res.status(200).json({
            status: 1,
            message: "No values returned."
          })
        }
      }
    })
  }else if (title && username){
    var sQuery =
    `
    SELECT * from posts
    LEFT JOIN
    (select userid,username from users) uzers
    on uzers.userID = posts.userID
    WHERE visibility != 'hidden' AND visibility != 'private'
    AND title = ?
    AND username = ?;
    `;
    connection.query(sQuery,[title,username],function(err,results,fields){
      if (err){
        return res.status(200).json({
          status: -1,
          message: err
        })
      }else{
        if (results.length > 0){
          var toPrep = {};
          for (let i = 0; i < results.length; i++){
            toPrep[i] = {
              title: results[i].title,
              userID: results[i].userID,
              content: results[i].content,
              subDate: results[i].subDate, username: results[i].username
            }
          }
          return res.status(200).json({
            status: 0,
            message: "Posts Returned.",
            contents: toPrep
          })
        }else{
          return res.status(200).json({
            status: 1,
            message: "No values returned."
          })
        }
      }
    })
  }else if (content && username){
    var sQuery =
    `
    SELECT * from posts
    LEFT JOIN
    (select userid,username from users) uzers
    on uzers.userID = posts.userID
    WHERE visibility != 'hidden' AND visibility != 'private'
    AND content LIKE ?
    AND username = ?;
    `;
    connection.query(sQuery,['%' + content + '%',username],function(err,results,fields){
      if (err){
        return res.status(200).json({
          status: -1,
          message: err
        })
      }else{
        if (results.length > 0){
          var toPrep = {};
          for (let i = 0; i < results.length; i++){
            toPrep[i] = {
              title: results[i].title,
              userID: results[i].userID,
              content: results[i].content,
              subDate: results[i].subDate, username: results[i].username
            }
          }
          return res.status(200).json({
            status: 0,
            message: "Posts Returned.",
            contents: toPrep
          })
        }else{
          return res.status(200).json({
            status: 1,
            message: "No values returned."
          })
        }
      }
    })
  }else if (content && sdate){
    var sQuery =
    `
    SELECT * from posts
    LEFT JOIN
    (select userid,username from users) uzers
    on uzers.userID = posts.userID
    WHERE visibility != 'hidden' AND visibility != 'private'
    AND content LIKE ?
    AND DATE(subDate) = ?;
    `;
    connection.query(sQuery,['%' + content + '%',sdate],function(err,results,fields){
      if (err){
        return res.status(200).json({
          status: -1,
          message: err
        })
      }else{
        if (results.length > 0){
          var toPrep = {};
          for (let i = 0; i < results.length; i++){
            toPrep[i] = {
              title: results[i].title,
              userID: results[i].userID,
              content: results[i].content,
              subDate: results[i].subDate, username: results[i].username
            }
          }
          return res.status(200).json({
            status: 0,
            message: "Posts Returned.",
            contents: toPrep
          })
        }else{
          return res.status(200).json({
            status: 1,
            message: "No values returned."
          })
        }
      }
    })
  }else if (username && sdate){
    var sQuery =
    `
    SELECT * from posts
    LEFT JOIN
    (select userid,username from users) uzers
    on uzers.userID = posts.userID
    WHERE visibility != 'hidden' AND visibility != 'private'
    AND DATE(subDate) = ?;
    AND username = ?;
    `;
    connection.query(sQuery,[sdate,username],function(err,results,fields){
      if (err){
        return res.status(200).json({
          status: -1,
          message: err
        })
      }else{
        if (results.length > 0){
          var toPrep = {};
          for (let i = 0; i < results.length; i++){
            toPrep[i] = {
              title: results[i].title,
              userID: results[i].userID,
              content: results[i].content,
              subDate: results[i].subDate, username: results[i].username
            }
          }
          return res.status(200).json({
            status: 0,
            message: "Posts Returned.",
            contents: toPrep
          })
        }else{
          return res.status(200).json({
            status: 1,
            message: "No values returned."
          })
        }
      }
    })
  }
  else if (title){
    var sQuery =
    `
    SELECT * from posts
    LEFT JOIN
    (select userid,username from users) uzers
    on uzers.userID = posts.userID
    WHERE visibility != 'hidden' AND visibility != 'private'
    AND title = ?;
    `;
    connection.query(sQuery,[title],function(err,results,fields){
      if (err){
        return res.status(200).json({
          status: -1,
          message: err
        })
      }else{
        if (results.length > 0){
          var toPrep = {};
          for (let i = 0; i < results.length; i++){
            toPrep[i] = {
              title: results[i].title,
              userID: results[i].userID,
              content: results[i].content,
              subDate: results[i].subDate, username: results[i].username
            }
          }
          return res.status(200).json({
            status: 0,
            message: "Posts Returned.",
            contents: toPrep
          })
        }else{
          return res.status(200).json({
            status: 1,
            message: "No values returned."
          })
        }
      }
    })
  }else if (content){
    var sQuery =
    `
    SELECT * from posts
    LEFT JOIN
    (select userid,username from users) uzers
    on uzers.userID = posts.userID
    WHERE visibility != 'hidden' AND visibility != 'private'
    AND content LIKE ?;
    `;
    connection.query(sQuery,['%' + content + '%'],function(err,results,fields){
      if (err){
        return res.status(200).json({
          status: -1,
          message: err
        })
      }else{
        if (results.length > 0){
          var toPrep = {};
          for (let i = 0; i < results.length; i++){
            toPrep[i] = {
              title: results[i].title,
              userID: results[i].userID,
              content: results[i].content,
              subDate: results[i].subDate, username: results[i].username
            }
          }
          return res.status(200).json({
            status: 0,
            message: "Posts Returned.",
            contents: toPrep
          })
        }else{
          return res.status(200).json({
            status: 1,
            message: "No values returned."
          })
        }
      }
    })
  }else if (sdate){
    var sQuery =
    `
    SELECT * from posts
    LEFT JOIN
    (select userid,username from users) uzers
    on uzers.userID = posts.userID
    WHERE visibility != 'hidden' AND visibility != 'private'
    AND DATE(subDate) = ?;
    `;
    connection.query(sQuery,[sdate],function(err,results,fields){
      if (err){
        return res.status(200).json({
          status: -1,
          message: err
        })
      }else{
        if (results.length > 0){
          var toPrep = {};
          for (let i = 0; i < results.length; i++){
            toPrep[i] = {
              title: results[i].title,
              userID: results[i].userID,
              content: results[i].content,
              subDate: results[i].subDate, username: results[i].username
            }
          }
          return res.status(200).json({
            status: 0,
            message: "Posts Returned.",
            contents: toPrep
          })
        }else{
          return res.status(200).json({
            status: 1,
            message: "No values returned."
          })
        }
      }
    })
  }else if (username){
    var sQuery =
    `
    SELECT * from posts
    LEFT JOIN
    (select userid,username from users) uzers
    on uzers.userID = posts.userID
    WHERE visibility != 'hidden' AND visibility != 'private'
    AND username = ?;
    `;
    connection.query(sQuery,[username],function(err,results,fields){
      if (err){
        return res.status(200).json({
          status: -1,
          message: err
        })
      }else{
        if (results.length > 0){
          var toPrep = {};
          for (let i = 0; i < results.length; i++){
            toPrep[i] = {
              title: results[i].title,
              userID: results[i].userID,
              content: results[i].content,
              subDate: results[i].subDate, username: results[i].username
            }
          }
          return res.status(200).json({
            status: 0,
            message: "Posts Returned.",
            contents: toPrep
          })
        }else{
          return res.status(200).json({
            status: 1,
            message: "No values returned."
          })
        }
      }
    })
  }
})
app.route("/post")
  //Retrieve Single Post
  .get(function(req,res){
    console.log(req.query.postID)
    //Retrieve Amount of Likes and Comments
    // console.log(req.query.userID,req.query.sessionID,req.query.postID)
    if (!req.query.postID){
      return res.status(200).json({
        status: -1,
        message: "Post ID Not Given."
      })
    }
    else if (req.query.userID && req.query.sessionID){
      var cQuery =
      `
      SELECT * FROM
      (select userID,max(sessionDate) as high from sessions group by userID) a
      RIGHT JOIN
      (
      Select * from sessions WHERE userID = ? AND sessionID = ? AND
      (timeduration = 'FOREVER' OR (timeduration = "HOUR" AND NOW() < date_add(sessionDate,Interval 1 Hour)))
      )
      sessions
      ON sessions.userID = a.userID AND sessions.sessionDate = a.high
      `;
      //FIX THIS THE QUERY BELOW NEEDS TO BE FIXED -- FIX THIS QUERY-- FIX THIS QUERY-- FIX THIS QUERY-- FIX THIS QUERY
      var sQuery =
      `
      SELECT comments.commentID, posts.postID as postID, comments.userID as commenterID, comments, comments.visibility as commentVisibility,  users.userName as commenterName,
      users.visibility as commenterVisibility, ifnull(commentLikes,0) as commentLikes, comments.submissionDate as commentDate, ifnull(totalLikes,0) as totalLikes, uzers.userID as authorID, title,content,
      posts.visibility as postVisibility, posts.subDate as postDate, uzers.userName as authorName, uzers.visibility as authorVisibility,
      if (isLiked.userID is null, "Unliked","Liked") as postLiked, if (commentLiked.userID is null,"Unliked","Liked") as commentLiked
      FROM posts
      left join comments on posts.postID = comments.postID
      left join users on users.userID = comments.userID
      left join (select postID, count(*) as totalLikes from likes group by postID) totalLikes
      on totalLikes.postID = posts.postID
      left join (select * from users) uzers on uzers.userID = posts.userID
      left join (select count(*) as commentLikes, commentID from commentLikes group by commentID) commentLikes
      ON commentLikes.commentID = comments.commentID
      LEFT JOIN (select * from likes WHERE userID = ?) isLiked
      ON isLiked.postID = posts.postID
      LEFT JOIN (SELECT * FROM commentLikes WHERE userID = ?) commentLiked
      on commentLiked.commentID = comments.commentID
      LEFT JOIN (select * from viewers WHERE viewerID = ?) commentViewers
      ON commentViewers.posterID = comments.userID
      LEFT JOIN (select * from viewers where viewerID = ?) postViewers
      ON postViewers.posterID = posts.userID
      WHERE posts.postID = ?
      AND posts.visibility != 'hidden' AND (posts.visibility != 'private' OR  postViewers.viewerID is not null)
      AND comments.visibility != 'hidden' AND (comments.visibility != 'private'  OR commentViewers.viewerID is not null)
      ORDER BY comments.submissionDate
      `;
      connection.query(cQuery,[req.query.userID,req.query.sessionID],function(err1,results1,fields){
        if (err1){
          return res.status(200).json({
            status: -1,
            message: err1
          })
        }
        else if (results1.length === 0){
          return res.status(200).json({
            status: -1,
            message: "No Valid Session."
          })
        }else{
          connection.query(sQuery,[req.query.userID,req.query.userID,req.query.userID,req.query.userID,req.query.postID],function(err,results,fields){
            if (err){
              console.log(err);
              return res.status(200).json({
                status: -1,
                message: err
              })
            }else{
              if (results.length === 0){
                return res.status(200).json({
                  status: -2,
                  message: "There was no post with that ID."
                })
              }else{
                var toPrep = [];
                for (let i = 0; i < results.length; i++){
                  if (results[i].commentID && results[i].commenterVisibility !== 'hidden' && results[i].commenterVisibility !== 'private'
                && results[i].commentVisibility !== 'private' && results[i].commentVisibility !== 'hidden'){
                    toPrep.push({
                      commentID: results[i].commentID,
                      commenterID: results[i].commenterID,
                      commenterName: results[i].commenterName,
                      comments: results[i].comments,
                      commentLikes: results[i].commentLikes,
                      commentVisibility: results[i].commentVisibility,
                      commenterVisibility: results[i].commenterVisibility,
                      commentDate: results[i].commentDate,
                      commentLiked: results[i].commentLiked
                    })
                  }
                }
                return res.status(200).json({
                  status: 0,
                  message: "Here's your post!",
                  postID: results[0].postID,
                  totalLikes: results[0].totalLikes,
                  authorID: results[0].authorID,
                  title: results[0].title,
                  content: results[0].content,
                  postVisibility: results[0].postVisibility,
                  postDate: results[0].postDate,
                  authorName: results[0].authorName,
                  authorVisibility: results[0].authorVisibility,
                  likedPost: results[0].postLiked,
                  comments: toPrep
                })
              }
            }
          })
        }
      })
    }else{
      var sQuery =
      `
      SELECT comments.commentID, posts.postID as postID, comments.userID as commenterID, comments, comments.visibility as commentVisibility,  users.userName as commenterName,
      users.visibility as commenterVisibility, ifnull(commentLikes,0) as commentLikes, comments.submissionDate as commentDate, ifnull(totalLikes,0) as totalLikes, uzers.userID as authorID, title,content,
      posts.visibility as postVisibility, posts.subDate as postDate, uzers.userName as authorName, uzers.visibility as authorVisibility FROM posts
      left join comments on posts.postID = comments.postID
      left join users on users.userID = comments.userID
      left join (select postID, count(*) as totalLikes from likes group by postID) totalLikes
      on totalLikes.postID = posts.postID
      left join (select * from users) uzers on uzers.userID = posts.userID
      left join (select count(*) as commentLikes, commentID from commentLikes group by commentID) commentLikes
      ON commentLikes.commentID = comments.commentID
      WHERE posts.postID = ?
      AND posts.visibility != 'hidden' AND posts.visibility != 'private'
      ORDER BY comments.submissionDate
      `;
      connection.query(sQuery,[req.query.postID],function(err,results,fields){
        if (err){
          console.log(err);
          return res.status(200).json({
            status: -1,
            message: err
          })
        }else{
          if (results.length === 0){
            return res.status(200).json({
              status: -2,
              message: "There was no post with that ID."
            })
          }else{
            var toPrep = [];
            for (let i = 0; i < results.length; i++){
              if (results[i].commentID && results[i].commenterVisibility !== 'hidden' && results[i].commenterVisibility !== 'private'
            && results[i].commentVisibility !== 'private' && results[i].commentVisibility !== 'hidden'){
                toPrep.push({
                  commentID: results[i].commentID,
                  commenterID: results[i].commenterID,
                  commenterName: results[i].commenterName,
                  comments: results[i].comments,
                  commentLikes: results[i].commentLikes,
                  commentVisibility: results[i].commentVisibility,
                  commenterVisibility: results[i].commenterVisibility,
                  commentDate: results[i].commentDate
                })
              }
            }
            return res.status(200).json({
              status: 0,
              message: "Here's your post!",
              postID: results[0].postID,
              totalLikes: results[0].totalLikes,
              authorID: results[0].authorID,
              title: results[0].title,
              content: results[0].content,
              postVisibility: results[0].postVisibility,
              postDate: results[0].postDate,
              authorName: results[0].authorName,
              authorVisibility: results[0].authorVisibility,
              comments: toPrep
            })
          }
        }
      })
    }
  })
  //Change Post Visibility to Hidden
  .delete(function(req,res){
    //FIX THIS: Will Need to Establish Permissions
    var userID = req.query.userID;
    if (!userID){
      return res.status(200).json({
        status: -1,
        message: "User Not Logged In."
      })
    }
    else{
      if (!req.query.postID){
        return res.status(200).json({
          status: -1,
          message: "Post ID Not Given."
        })
      }
      //If user is admin or mod, allow regardless
      //IF user is owner, Allow
      //If user not logged in or not owner, disallow
      var uQuery = `
        UPDATE posts
        SET visibility = "hidden"
        WHERE postID = 3;
        `;
      connection.query(uQuery,[req.query.postid],function(err,results,fields){
        if (err){
          console.log(err);
          return res.status(200).json({
            status: -1,
            message: err
          })
        }
        else{
          if (results.length == 0){
            return res.status(200).json({
              status: -1,
              message: "Could not find a post with that ID."
            })
          }
          else{
            return res.status(200).json({
              status: 0,
              message: "Update Occured."
            })
          }
        }
      })
    }
  })
  //Add Single POST
  .put(function(req,res){
    //GET ID
    var userID = req.query.userID;
    var sessionID = req.query.sessionID;
    if (!userID || !sessionID){
      return res.status(200).json({
        status: -1,
        message: "User Not Logged In."
      })
    }
    else{
    //query string has a max length of 2048 characters
    if (!req.query.title || !req.query.contents || !req.query.visibility){
      return res.status(200).json({
        status: -1,
        message: "Not enough information provided."
      })
    }
    else{
      //search for valid session
      var sQuery =
      `
      SELECT * FROM
      (select userID,max(sessionDate) as high from sessions group by userID) a
      RIGHT JOIN
      (
      Select * from sessions WHERE userID = ? AND sessionID = ? AND
      (timeduration = 'FOREVER' OR (timeduration = "HOUR" AND NOW() < date_add(sessionDate,Interval 1 Hour)))
      )
      sessions
      ON sessions.userID = a.userID AND sessions.sessionDate = a.high
      `

      connection.query(sQuery,[userID,sessionID],function(errorr,resultss,fieldss){
        if (errorr){
          return res.status(200).json({
            status: -1,
            message: errorr
          })
        }
        else{
          var iQuery =
          `
          INSERT INTO posts (userID,title,content,visibility,subDate) VALUES (?,?,?,?,NOW());
          `;
          connection.query(iQuery,[userID,req.query.title,req.query.contents,req.query.visibility],function(err,results,fields){
            if (err){
              return res.status(200).json({
                status: -1,
                message: err
              })
            }
            else{
              return res.status(200).json({
                status: 0,
                message: "Post Added."
              })
            }
          })
        }
      })
    }
  }
  })
  //Edit Single POST
  .patch(function(req,res){
    //FIX THIS: Do Later, Im not sure how I want this
    //check userID
    //things can change - title, content, visibility
    if (!req.query.postID){
      return res.status(200).json({
        status: -1,
        message: "No Post ID"
      })
    }
    var userID = req.query.userID;
    if (!userID){
      return res.status(200).json({
        status: -1,
        message: "User Not Logged In."
      })
    }
    else{
    if (!req.query.title && !req.query.content && !req.query.visibility){
      return res.status(200).json({
        status: -1,
        message: "Not enough information."
      })
    }
    else if (req.query.title && req.query.content && req.query.visibility){
      var uQuery =
      `
      Update posts
      SET title = ?, content = ?, visibility = ?
      WHERE postID = ?
      `;
      connection.query(uQuery,[req.query.title,req.query.content,req.query.visibility,req.query.postID],function(err,results,fields){
        if (err){
          return res.status(200).json({
            status: -1,
            message: err
          })
        }
        else{
          if (results.length === 0){
            return res.status(200).json({
              status: -1,
              message: "Nothing Was Updated."
            })
          }
          else{
            return res.status(200).json({
              status: 0,
              message: "Post Updated."
            })
          }
        }
      })
    }else if (req.query.title && req.query.content){
      var uQuery =
      `
      Update posts
      SET title = ?, content = ?
      WHERE postID = ?
      `;
      connection.query(uQuery,[req.query.title,req.query.content,req.query.postID],function(err,results,fields){
        if (err){
          return res.status(200).json({
            status: -1,
            message: err
          })
        }
        else{
          if (results.length === 0){
            return res.status(200).json({
              status: -1,
              message: "Nothing Was Updated."
            })
          }
          else{
            return res.status(200).json({
              status: 0,
              message: "Post Updated."
            })
          }
        }
      })
    }else if (req.query.title && req.query.visibility){
      var uQuery =
      `
      Update posts
      SET title = ?, visiblity = ?
      WHERE postID = ?
      `;
      connection.query(uQuery,[req.query.title,req.query.visibility,req.query.postID],function(err,results,fields){
        if (err){
          return res.status(200).json({
            status: -1,
            message: err
          })
        }
        else{
          if (results.length === 0){
            return res.status(200).json({
              status: -1,
              message: "Nothing Was Updated."
            })
          }
          else{
            return res.status(200).json({
              status: 0,
              message: "Post Updated."
            })
          }
        }
      })
    }else if (req.query.content && req.query.visibility){
      var uQuery =
      `
      Update posts
      SET content = ?, visiblity = ?
      WHERE postID = ?
      `;
      connection.query(uQuery,[req.query.content,req.query.visibility,req.query.postID],function(err,results,fields){
        if (err){
          return res.status(200).json({
            status: -1,
            message: err
          })
        }
        else{
          if (results.length === 0){
            return res.status(200).json({
              status: -1,
              message: "Nothing Was Updated."
            })
          }
          else{
            return res.status(200).json({
              status: 0,
              message: "Post Updated."
            })
          }
        }
      })
    }else if (req.query.content){
      var uQuery =
      `
      Update posts
      SET content = ?
      WHERE postID = ?
      `;
      connection.query(uQuery,[req.query.content,req.query.postID],function(err,results,fields){
        if (err){
          return res.status(200).json({
            status: -1,
            message: err
          })
        }
        else{
          if (results.length === 0){
            return res.status(200).json({
              status: -1,
              message: "Nothing Was Updated."
            })
          }
          else{
            return res.status(200).json({
              status: 0,
              message: "Post Updated."
            })
          }
        }
      })
    }else if (req.query.title){
      var uQuery =
      `
      Update posts
      SET title = ?
      WHERE postID = ?
      `;
      connection.query(uQuery,[req.query.title,req.query.postID],function(err,results,fields){
        if (err){
          return res.status(200).json({
            status: -1,
            message: err
          })
        }
        else{
          if (results.length === 0){
            return res.status(200).json({
              status: -1,
              message: "Nothing Was Updated."
            })
          }
          else{
            return res.status(200).json({
              status: 0,
              message: "Post Updated."
            })
          }
        }
      })
    }else if (req.query.visibility){
      var uQuery =
      `
      Update posts
      SET visibility = ?
      WHERE postID = ?
      `;
      connection.query(uQuery,[req.query.visbility,req.query.postID],function(err,results,fields){
        if (err){
          return res.status(200).json({
            status: -1,
            message: err
          })
        }
        else{
          if (results.length === 0){
            return res.status(200).json({
              status: -1,
              message: "Nothing Was Updated."
            })
          }
          else{
            return res.status(200).json({
              status: 0,
              message: "Post Updated."
            })
          }
        }
      })
    }
  }
  })
// Register Account -- Requires Look up
//FIX THIS: have message for duplicate entries
app.post("/register",function(req,res){
  var email = req.body.email;
  var pswrd = req.body.pswrd;
  var username = req.body.username;
  //checking for uniqueness already occurs
  //encrypt password
  if (!email || !pswrd || !username){
    return res.status(200).json({
      status: -1,
      message: "Not Enough Data Included."
    })
  }
  else{
  bcrypt.hash(pswrd,15,function(e2rr,hash){
    if (e2rr){
      return res.status(200).json({
        status: -1,
        message: e2rr
      })
    }
    else{
      var iQuery = "INSERT INTO users (userName,email,pswrd,visibility,classification) VALUES (?,?,?,?,?)";
      connection.query(iQuery,[username,email,hash,'public','user'],function(err,results,fields){
        if (err && err.sqlState === '23000'){
          console.log("Already Exists");
          return res.status(200).json({
            status: -2,
            message: "Email already in Use."
          })
        }
        else if (err){
          console.log(err);
          return res.status(200).json({
            status: -1,
            message: err
          })
        }
        else{
          return res.status(200).json({
            status: 0,
            message: "Insertion Performed."
          })
        }
      })
    }
  })
}
})
app.post("/login",function(req,res){
  var email = req.body.email;
  var pswrd = req.body.pswrd;
  var rememberMe = req.body.rememberMe;
  if (!email || !pswrd || !rememberMe){
    return res.status(200).json({
      status: -1,
      message: "Not enough information."
    })
  }
  else{
    var sQuery = "select * from users WHERE email = ?"
    connection.query(sQuery,[email],function(e3rr,results,fields){
      if (e3rr){
        return res.status(200).json({
          status: -1,
          message: e3rr
        })
      }
      else{
        if (results.length === 0){
          return res.status(200).json({
            status: -2,
            message: "That combination did not exist."
          })
        }else{
          //uncrypt password and check
          var resPass = results[0].pswrd;
          bcrypt.compare(pswrd,resPass,function(err3,rresult){
            if (err3){
              return res.status(200).json({
                status: -1,
                message: err3
              })
            }
            else if (rresult){
              //Create a Session ID
              var sessionID = randomatic('Aa0', 20);
              if (rememberMe === 'hour'){
                var iQuery =
                `
                INSERT INTO sessions (sessionID,userID,sessionDate,timeDuration) VALUES (?,?,NOW(),"HOUR");
                `
                connection.query(iQuery,[sessionID,results[0].userID],function(err,rresults,fields){
                  if (err){
                    return res.status(200).json({
                      status: -1,
                      message: err
                    })
                  }
                  else{
                    return res.status(200).json({
                      status: 0,
                      message: "Confirmation.",
                      userID: results[0].userID,
                      username: results[0].userName,
                      sessionID: sessionID
                    })
                  }
                })
              }else if (rememberMe === 'forever'){
                var iQuery =
                `
                INSERT INTO sessions (sessionID,userID,sessionDate,timeDuration) VALUES (?,?,NOW(),"FOREVER");
                `
                connection.query(iQuery,[sessionID,results[0].userID],function(err,rresults,fields){
                  if (err){
                    return res.status(200).json({
                      status: -1,
                      message: err
                    })
                  }
                  else{
                    return res.status(200).json({
                      status: 0,
                      message: "Confirmation.",
                      userID: results[0].userID,
                      username: results[0].userName,
                      sessionID: sessionID
                    })
                  }
                })
              }else{
                return res.status(200).json({
                  status: -1,
                  message: "Remember Me Not Included Properly."
                })
              }
            }
            else{
              return res.status(200).json({
                status: -2,
                message: "That combination did not exist."
              })
            }
          })
        }
      }
    })
  }
})

app.route("/user")
  //Get User and Associated Posts
  .get(function(req,res){
    var userID = req.query.userID;
    //Get hidden posts if mod or admin
    //Get private posts if mod, admin, or owner
    var sQuery = "SELECT * FROM users LEFT JOIN posts ON users.userID = posts.userID WHERE users.userID = ? ORDER BY subDate DESC";
    connection.query(sQuery,[req.query.userID],function(err,results,fields){
      if (err){
        console.log(err);
        return res.status(200).json({
          status: -1,
          message: err
        })
      }
      else{
        if (results.length === 0){
          return res.status(200).json({
            status: -1,
            message: "There were no valid users with that ID."
          })
        }else{
          //convert into a list
          var toPrep = {};
          for (let i = 0; i < results.length; i++){
            toPrep[i] = {
              title: results[i].title,
              userID: results[i].userID,
              content: results[i].content,
              subDate: results[i].subDate,
              username: results[i].userName
            }
          }
          return res.status(200).json({
            status: 0,
            message: "User Found",
            username: results[0].userName,
            posts: toPrep
          })
        }
      }
  })

})
  //Edit User Info
  .patch(function(req,res){//right now only visibility is updatable, maybe pswrd, maybe classification

  })
  //Delete User (and maybe posts) // Set a user to hidden
  .delete(function(req,res){
    var userID = req.query.userID;
    if (!userID){
      return res.status(200).json({
        status: -1,
        message: "User ID Not Given."
      })
    }else{
    var uQuery =
    `
    Update posts
    SET visibility = 'hidden'
    WHERE userID = ?;
    Update users
    SET visibility = 'hidden'
    WHERE userID = ?;
    `;
    connection.query(uQuery,[req.query.userID,req.query.userID],function(err,results,fields){
      if (err){
        console.log(err);
        return res.status(200).json({
          status: -1,
          message: err
        })
      }
      else{
        if (results[0].length === 0){
          return res.status(200).json({
            status: -1,
            message: "There were no valid users with that ID."
          })
        }else{
          if (results[0].length === 0){
            return res.status(200).json({
              status: -1,
              message: "There were no valid users with that ID."
            })
          }else{
            return res.status(200).json({
              status: 0,
              message: "User Updated."
            })
          }
        }
      }
    })
  }
  })

app.route("/comment")
  .get(function(req,res){
    var commentID = req.query.commentID;
    if (!commentID){
      return res.status(200).json({
        status: -1,
        message: "No Comment ID"
      })
    }
    else{
      var sessionID = req.query.sessionID;
      var userID = req.query.userID;
      if (!sessionID || !userID){
        //can pull not friendly private comments
        var sQuery =
        `
        select commentID, comments.postID as postID, comments, comments.userID as commenterID, comments.visibility as commentVisibility, comments.submissionDate as commentDate, uzers.username as commenterUsername
        , uzers.visibility as commenterVisibility, ucers.userID as authorID, title, content, posts.visibility as postVisibility, subDate as postDate, ucers.username as posterUsername, ucers.visibility as posterVisibility
        from comments LEFT JOIN (select userID,username,visibility from users) uzers
        on uzers.userID = comments.userID LEFT JOIN posts ON comments.postID = posts.postID
        LEFT JOIN (select userID, username,visibility from users) ucers
        ON posts.userID = ucers.userID
        WHERE comments.visibility != 'hidden' AND comments.visibility != 'private'
        AND posts.visibility != 'hidden' AND posts.visibility != 'private'
        AND ucers.visibility != 'hidden' AND ucers.visibility != 'private'
        AND uzers.visibility != 'hidden' AND uzers.visibility != 'private'
        AND commentID = ?
        `
        connection.query(sQuery,[commentID],function(err,result,fields){
          if (err){
            return res.status(200).json({
              status: -1,
              message: err
            })
          }
          else if (result.length === 0){
            return res.status(200).json({
              status: -1,
              message: "No such post."
            })
          }else{
            // console.log(results);
            results = result[0];
            return res.status(200).json({
              status: 0,
              message: "Here's your comment.",
              comment: results.comments,
              commentID: results.commentID,
              commenterID: results.commenterID,
              commentVisibility: results.commentVisibility,
              commentDate: results.commentDate,
              commenterUsername: results.commenterUsername,
              commenterVisibility: results.commenterVisibility,
              posterID: results.authorID,
              postID: results.postID,
              title: results.title,
              content: results.content,
              postVisibility: results.postVisibility,
              postDate: results.postDate,
              posterUsername: results.posterUsername,
              posterVisibility: results.posterVisibility
            })
          }
        })
      }else{
        //can pull friendly comments
        var cQuery =
        `
        SELECT * FROM
        (select userID,max(sessionDate) as high from sessions group by userID) a
        RIGHT JOIN
        (
        Select * from sessions WHERE userID = ? AND sessionID = ? AND
        (timeduration = 'FOREVER' OR (timeduration = "HOUR" AND NOW() < date_add(sessionDate,Interval 1 Hour)))
        )
        sessions
        ON sessions.userID = a.userID AND sessions.sessionDate = a.high
        `;
        var sQuery =
        `
        select comments.commentID, comments.postID as postID, comments.userID as commenterID, comments, comments.visibility as commentVisibility, comments.submissionDate as commentDate, uzers.username as commenterUsername
        , uzers.visibility as commenterVisibility, ucers.userID as authorID, title, content, posts.visibility as postVisibility, subDate as postDate, ucers.username as posterUsername, ucers.visibility as posterVisibility
        ,if (isLiked.userID is null, "Unliked","Liked") as postLiked
        ,if (commentLiked.userID is null,"Unliked","Liked") as commentLiked
        from comments LEFT JOIN (select userID,username,visibility from users) uzers
        on uzers.userID = comments.userID LEFT JOIN posts ON comments.postID = posts.postID
        LEFT JOIN (select userID, username,visibility from users) ucers
        ON posts.userID = ucers.userID
        LEFT JOIN (select * from viewers) commenterViewer
        ON commenterViewer.posterID = ucers.userID
        LEFT JOIN (select * from viewers) postViewer
        ON postViewer.posterID = uzers.userID
        LEFT JOIN (select * from likes WHERE userID = ?) isLiked -- variable
        ON isLiked.postID = posts.postID
        LEFT JOIN (SELECT * FROM commentLikes WHERE userID = ?) commentLiked
        on commentLiked.commentID = comments.commentID
        WHERE
        (
        comments.visibility != 'hidden'
        AND posts.visibility != 'hidden'
        AND ucers.visibility != 'hidden'
        AND uzers.visibility != 'hidden'
        )
        AND posts.userID  = ? OR
        (
        (comments.visibility != 'private' OR commenterViewer.viewerID = ?)
        AND (posts.visibility != 'private' OR postViewer.viewerID = ?)
        AND (ucers.visibility != 'private' or commenterViewer.viewerID = ?)
        AND (uzers.visibility != 'private' or postViewer.viewerID = ?)
        )
        AND comments.commentID = ?
        `;
        connection.query(cQuery,[userID,sessionID],function(err1,results1,fields){
          if (err1){
            return res.status(200).json({
              status: -1,
              message: err1
            })
          }else if (results1.length == 0){
            return res.status(200).json({
              status: -1,
              message: "Session did not exist."
            })
          }else{
            connection.query(sQuery,[userID,userID,userID,userID,userID,userID,userID,commentID],function(err2,results2,fields){
              if (err2){
                return res.status(200).json({
                  status: -1,
                  message: err2
                })
              }
              else if (results2.length === 0){
                return res.status(200).json({
                  status: -1,
                  message: err2
                })
              }else{
                var results = results2[0];
                return res.status(200).json({
                  status: 0,
                  message: "Here's your comment.",
                  comment: results.comments,
                  commentID: results.commentID,
                  commenterID: results.commenterID,
                  commentVisibility: results.commentVisibility,
                  commentDate: results.commentDate,
                  commenterUsername: results.commenterUsername,
                  commenterVisibility: results.commenterVisibility,
                  commentLiked: results.commentLiked,
                  postLiked: results.postLiked,
                  posterID: results.authorID,
                  postID: results.postID,
                  title: results.title,
                  content: results.content,
                  postVisibility: results.postVisibility,
                  postDate: results.postDate,
                  posterUsername: results.posterUsername,
                  posterVisibility: results.posterVisibility
                })
              }
            })
          }
        })
      }
    }
  })
  .patch(function(req,res){

  })
  .put(function(req,res){
    if (!req.query.userID || !req.query.sessionID || !req.query.postID || !req.query.content){
      return res.status(200).json({
        status: -1,
        message: "Not Enough Information"
      })
    }
    var cQuery =
    `
    SELECT * FROM
    (select userID,max(sessionDate) as high from sessions group by userID) a
    RIGHT JOIN
    (
    Select * from sessions WHERE userID = ? AND sessionID = ? AND
    (timeduration = 'FOREVER' OR (timeduration = "HOUR" AND NOW() < date_add(sessionDate,Interval 1 Hour)))
    )
    sessions
    ON sessions.userID = a.userID AND sessions.sessionDate = a.high
    `;
    var iQuery =
    `
    INSERT INTO comments (postID,userID,comments,submissionDate) VALUES (?,?,?,NOW());
    `;
    connection.query(cQuery,[req.query.userID,req.query.sessionID],function(err1,results1,fields){
      if (err1){
        return res.status(200).json({
          message: err1,
          status: -1
        })
      }
      else if (results1.length === 0){
        return res.status(200).json({
          status: -1,
          message: "No Valid Session."
        })
      }
      else{
        connection.query(iQuery,[req.query.postID,req.query.userID,req.query.content],function(err2,results2,fields){
          if (err2){
            return res.status(200).json({
              message: err2,
              status: -1
            })
          }
          else{
            return res.status(200).json({
              status: 0,
              message: "Comment Inserted."
            })
          }
        })
      }
    })
  })
  .delete(function(req,res){
    //set comment to hidden
    if (!req.query.commentID || !req.query.sessionID || !req.query.userID){
      return res.status(200).json({
        status: -1,
        message: "Not Enough Information"
      })
    }
    var cQuery =
    `
    SELECT * FROM
    (select userID,max(sessionDate) as high from sessions group by userID) a
    RIGHT JOIN
    (
    Select * from sessions WHERE userID = ? AND sessionID = ? AND
    (timeduration = 'FOREVER' OR (timeduration = "HOUR" AND NOW() < date_add(sessionDate,Interval 1 Hour)))
    )
    sessions
    ON sessions.userID = a.userID AND sessions.sessionDate = a.high
    `;
    var eQuery =
    `
    UPDATE comments
    SET visibility = 'hidden'
    WHERE commentID = ?;
    `;
    connection.query(cQuery,[req.query.userID,req.query.sessionID],function(err1,results1,fields){
      if (err1){
        return res.status(200).json({
          status: -1,
          message: err1
        })
      }
      else if (results1.length === 0){
        return res.status(200).json({
          status: -1,
          message: "No Valid Session."
        })
      }else{
        connection.query(eQuery,[req.query.commentID],function(err2,results2,fields){
          if (err2){
            return res.status(200).json({
              status: -1,
              message: err2
            })
          }else{
            return res.status(200).json({
              status: 0,
              message: "Deletion Occured."
            })
          }
        })
      }
    })
  })
app.route("/like")
  .put(function(req,res){
    //check sessions and userID, then add like
    if (!req.query.userID || !req.query.sessionID || !req.query.postID){
      return res.status(200).json({
        status: -1,
        message: "Not Enough Information."
      })
    }
    var cQuery =
    `
    SELECT * FROM
    (select userID,max(sessionDate) as high from sessions group by userID) a
    RIGHT JOIN
    (
    Select * from sessions WHERE userID = ? AND sessionID = ? AND
    (timeduration = 'FOREVER' OR (timeduration = "HOUR" AND NOW() < date_add(sessionDate,Interval 1 Hour)))
    )
    sessions
    ON sessions.userID = a.userID AND sessions.sessionDate = a.high
    `;
    var iQuery =
    `
    INSERT INTO likes (postID,userID) VALUES (?,?);
    `;
    connection.query(cQuery,[req.query.userID,req.query.sessionID],function(err1,results1,fields){
      if (err1){
        return res.status(200).json({
          message: err1,
          status: -1
        })
      }
      else if (results1.length === 0){
        return res.status(200).json({
          status: -1,
          message: "No Valid Session."
        })
      }
      else{
        connection.query(iQuery,[req.query.postID,req.query.userID],function(err2,results2,fields){
          if (err2){
            return res.status(200).json({
              message: err2,
              status: -1
            })
          }
          else{
            return res.status(200).json({
              status: 0,
              message: "Like Inserted."
            })
          }
        })
      }
    })
  })
  .delete(function(req,res){
    //check sessions and userID, then remove like
    if (!req.query.userID || !req.query.sessionID || !req.query.postID){
      return res.status(200).json({
        status: -1,
        message: "Not Enough Information."
      })
    }
    var cQuery =
    `
    SELECT * FROM
    (select userID,max(sessionDate) as high from sessions group by userID) a
    RIGHT JOIN
    (
    Select * from sessions WHERE userID = ? AND sessionID = ? AND
    (timeduration = 'FOREVER' OR (timeduration = "HOUR" AND NOW() < date_add(sessionDate,Interval 1 Hour)))
    )
    sessions
    ON sessions.userID = a.userID AND sessions.sessionDate = a.high
    `;
    var dQuery =
    `
    DELETE FROM likes WHERE userID = ? AND postID = ?;
    `;
    connection.query(cQuery,[req.query.userID,req.query.sessionID],function(err1,results1,fields){
      if (err1){
        return res.status(200).json({
          status: -1,
          message: err1
        })
      }
      else if (results1.length === 0){
        return res.status(200).json({
          status: -1,
          message: "No Valid Session."
        })
      }else{
        connection.query(dQuery,[req.query.userID,req.query.postID],function(err2,results2,fields){
          if (err2){
            return res.status(200).json({
              status: -1,
              message: err2
            })
          }else{
            return res.status(200).json({
              status: 0,
              message: "Deletion Occured."
            })
          }
        })
      }
    })
  })
app.route("/likeComment")
  .put(function(req,res){
    if (!req.query.commentID || !req.query.userID || !req.query.sessionID){
      return res.status(200).json({
        status: -1,
        message: 'Not Enough Information'
      })
    }
    var cQuery =
    `
    SELECT * FROM
    (select userID,max(sessionDate) as high from sessions group by userID) a
    RIGHT JOIN
    (
    Select * from sessions WHERE userID = ? AND sessionID = ? AND
    (timeduration = 'FOREVER' OR (timeduration = "HOUR" AND NOW() < date_add(sessionDate,Interval 1 Hour)))
    )
    sessions
    ON sessions.userID = a.userID AND sessions.sessionDate = a.high
    `;
    var iQuery =
    `
    INSERT INTO commentLikes (commentID,userID) VALUES (?,?);
    `;
    connection.query(cQuery,[req.query.userID,req.query.sessionID],function(err1,results1,fields){
      if (err1){
        return res.status(200).json({
          message: err1,
          status: -1
        })
      }
      else if (results1.length === 0){
        return res.status(200).json({
          status: -1,
          message: "No Valid Session."
        })
      }
      else{
        connection.query(iQuery,[req.query.commentID,req.query.userID],function(err2,results2,fields){
          if (err2){
            return res.status(200).json({
              message: err2,
              status: -1
            })
          }
          else{
            return res.status(200).json({
              status: 0,
              message: "Like Inserted."
            })
          }
        })
      }
    })

  })
  .delete(function(req,res){
    if (!req.query.userID || !req.query.sessionID || !req.query.commentID){
      return res.status(200).json({
        status: -1,
        message: "Not Enough Information."
      })
    }
    var cQuery =
    `
    SELECT * FROM
    (select userID,max(sessionDate) as high from sessions group by userID) a
    RIGHT JOIN
    (
    Select * from sessions WHERE userID = ? AND sessionID = ? AND
    (timeduration = 'FOREVER' OR (timeduration = "HOUR" AND NOW() < date_add(sessionDate,Interval 1 Hour)))
    )
    sessions
    ON sessions.userID = a.userID AND sessions.sessionDate = a.high
    `;
    var dQuery =
    `
    DELETE FROM commentLikes WHERE userID = ? AND commentID = ?;
    `;
    connection.query(cQuery,[req.query.userID,req.query.sessionID],function(err1,results1,fields){
      if (err1){
        return res.status(200).json({
          status: -1,
          message: err1
        })
      }
      else if (results1.length === 0){
        return res.status(200).json({
          status: -1,
          message: "No Valid Session."
        })
      }else{
        connection.query(dQuery,[req.query.userID,req.query.commentID],function(err2,results2,fields){
          if (err2){
            return res.status(200).json({
              status: -1,
              message: err2
            })
          }else{
            return res.status(200).json({
              status: 0,
              message: "Deletion Occured."
            })
          }
        })
      }
    })
  })
app.route("/commentsandposts")
  .get(function(req,res){
    //get comments of affiliated user
    var sessionID = req.query.sessionID;
    var userID = req.query.userID;
    var profileID = req.query.profileID;
    if (!profileID){
      return res.status(200).json({
        status: -1,
        message: "Need User's Profile"
      })
    }
    else if (!sessionID || !userID){
      //only use commenterID
      var sQuery1 =
      `
      select comments.commentID as commentID,postID,comments.userID as userID,comments,
      comments.visibility as commentVisibility, submissionDate,
      userName as username, users.visibility as userVisibility, ifnull(totalLikes,0) as totalLikes from comments
      LEFT JOIN users ON users.userID = comments.userID
      LEFT JOIN (select commentID,count(*) as totalLikes from commentLikes group by commentID) totalLikes ON totalLikes.commentID = comments.commentID

      WHERE users.userID = ?
      AND users.visibility != 'hidden' AND comments.visibility != 'private'
      AND comments.visibility != 'hidden' AND users.visibility != 'private'
      ;
      `;
      var sQuery2 =
      `
      select posts.postID as postID,posts.userID as userID, title, content, posts.visibility, posts.subDate, users.userName as username,
      users.visibility as userVisibility,ifnull(totalLikes,0) as totalLikes, ifnull(totalComments,0) as totalComments from posts
      LEFT JOIN users ON users.userID = posts.userID
      LEFT JOIN (select postID,count(*) as totalComments from comments group by postID) totalComments ON totalComments.postID = posts.postID
      LEFT JOIN (select postID,count(*) as totalLikes from likes group by postID) totalLikes ON totalLikes.postID = posts.postID
       WHERE users.userID = ?
      AND users.visibility != 'hidden' AND posts.visibility != 'private'
      AND posts.visibility != 'hidden' AND users.visibility != 'private'
      ;
      `;
      var uQuery =
      `
      SELECT userID,username as username, visibility FROM users WHERE users.userID = ? AND users.visibility != 'hidden' AND users.visibility != 'private';
      `;
      connection.query(uQuery,[profileID],function(err,results,fields){
        if (err){
          return res.status(200).json({
            status: -1,
            message: err
          })
        }else if (results.length === 0){
          return res.status(200).json({
            status: -1,
            message: "No Valid Profile."
          })
        }else{
          connection.query(sQuery1,[profileID],function(err1,results1,fields){
            if (err1){
              return res.status(200).json({
                status: -1,
                message: err1
              })
            }
            else{
              connection.query(sQuery2,[profileID],function(err2,results2,fields){
                if (err2){
                  return res.status(200).json({
                    status: -1,
                    message: err2
                  })
                }
                else{
                  var commentsList = [];
                  var postsList = [];
                  for (let i = 0; i < results1.length; i++){
                    var res1 = results1[i];
                    commentsList.push({
                      commentID: res1.commentID,
                      postID: res1.postID,
                      userID: res1.userID,
                      comments: res1.comments,
                      cVisibility: res1.commentVisibility,
                      submissionDate: res1.submissionDate,
                      username: res1.username,
                      totalLikes: res1.totalLikes,
                      userVisibility: res1.userVisibility
                    })
                  }
                  for (let i = 0; i < results2.length; i++){
                    var res2 = results2[i];
                    postsList.push({
                      postID: res2.postID,
                      userID: res2.userID,
                      title: res2.title,
                      content: res2.content,
                      postVisibility: res2.postVisibility,
                      subDate: res2.subDate,
                      username: res2.username,
                      userVisibility: res2.userVisibility,
                      totalLikes: res2.totalLikes,
                      totalComments: res2.totalComments
                    })
                  }
                  return res.status(200).json({
                    status: 0,
                    message: "Profile Returned.",
                    username: results[0].username,
                    userID: results[0].userID,
                    comments: commentsList,
                    posts: postsList
                  })
                }
              })
            }
          })
        }
      })
    }else{
      //logged in version
      var sQuery1 =
      `
      select posts.postID,posts.userID as userID, title, content, posts.visibility, posts.subDate, users.userName as username, users.visibility as userVisibility,
      ifnull(totalLikes,0) as totalLikes, ifnull(totalComments,0) as totalComments, if(isLiked.userID is null,"Unliked","Liked") as Liked from posts
      LEFT JOIN users ON users.userID = posts.userID
      LEFT JOIN (select * from viewers where viewers.viewerID = ?) viewers ON users.userID = viewers.posterID
      LEFT JOIN (select postID,count(*) as totalComments from comments group by postID) totalComments ON totalComments.postID = posts.postID
      LEFT JOIN (select postID,count(*) as totalLikes from likes group by postID) totalLikes ON totalLikes.postID = posts.postID
      LEFT JOIN (select * from likes WHERE userID = ?) isLiked ON isLiked.postID = posts.postID
      WHERE users.userID = ?
      AND users.visibility != 'hidden'
      AND posts.visibility != 'hidden'
      AND (users.visibility != 'private' AND posts.visibility != 'private' OR users.userID = ? or viewers.viewerID is not null);
      `;
      var sQuery2 =
      `
      select comments.commentID as commentID,comments.postID as postID,comments.userID as userID,comments.comments as comments,comments.visibility as commentVisibility,
      comments.submissionDate as submissionDate, userName, users.visibility as userVisibility, ifnull(totalLikes,0) as totalLikes,
      if(isLiked.userID is null,"Unliked","Liked") as Liked
      from comments LEFT JOIN users ON users.userID = comments.userID
      LEFT JOIN (select * from viewers where viewers.viewerID = ?) viewers ON users.userID = viewers.posterID
      LEFT JOIN (select commentID,count(*) as totalLikes from commentLikes group by commentID) totalLikes ON totalLikes.commentID = comments.commentID
      LEFT JOIN (select * from commentLikes WHERE userID = ?) isLiked ON isLiked.commentID = comments.commentID
      WHERE users.userID = ?
      AND users.visibility != 'hidden'
      AND comments.visibility != 'hidden'
      AND (comments.visibility != 'private' or users.visibility != 'private' OR users.userID = ? or viewers.viewerID = ?)
      ;
      `;
      var uQuery =
      `
      SELECT userID,userName, visibility FROM users WHERE users.userID = ?
      AND users.visibility != 'hidden' AND
      (users.visibility != 'private' OR users.userID = ?);
      `;
      var cQuery =
      `
      SELECT * FROM
      (select userID,max(sessionDate) as high from sessions group by userID) a
      RIGHT JOIN
      (
      Select * from sessions WHERE userID = ? AND sessionID = ? AND
      (timeduration = 'FOREVER' OR (timeduration = "HOUR" AND NOW() < date_add(sessionDate,Interval 1 Hour)))
      )
      sessions
      ON sessions.userID = a.userID AND sessions.sessionDate = a.high
      `;
      connection.query(cQuery,[userID,sessionID],function(cErr,cResults,cFields){
        if (cErr){
          return res.status(200).json({
            status: -1,
            message: cErr
          })
        }
        else if (cResults.length === 0){
          return res.status(200).json({
            status: -1,
            message: "No Valid Session"
          })
        }else{
          connection.query(uQuery,[profileID,userID],function(err1,results1,fields1){
            if (err1){
              return res.status(200).json({
                status: -1,
                message: err1
              })
            }
            else if (results1.length === 0){
              return res.status(200).json({
                status: -1,
                message: "No such account."
              })
            }else{
              connection.query(sQuery1,[userID,userID,profileID,userID],function(err2,results2,fields2){
                if (err2){
                  return res.status(200).json({
                    status: -1,
                    message: err2
                  })
                }else{
                  var listOfPosts = [];
                  for (let i = 0; i < results2.length; i++){
                    var res2 = results2[i];
                    listOfPosts.push({
                      postID: res2.postID,
                      userID: res2.userID,
                      title: res2.title,
                      content: res2.content,
                      postVisibility: res2.postVisibility,
                      subDate: res2.subDate,
                      username: res2.username,
                      userVisibility: res2.userVisibility,
                      totalLikes: res2.totalLikes,
                      totalComments: res2.totalComments,
                      isLiked: res2.Liked
                    })
                  }
                  connection.query(sQuery2,[userID,userID,profileID,userID,userID],function(err3,results3,fields3){
                    if (err3){
                      return res.status(200).json({
                        status: -1,
                        message: err3
                      })
                    }
                    else{
                      var listOfComments = [];
                      for (let i = 0; i < results3.length; i++){
                        var com = results3[i];
                        listOfComments.push({
                          commentID: com.commentID,
                          postID: com.postID,
                          userID: com.userID,
                          comments: com.comments,
                          commentVisibility: com.commentVisibility,
                          submissionDate: com.submissionDate,
                          username: com.userName,
                          userVisibility: com.userVisibility,
                          totalLikes: com.totalLikes,
                          Liked: com.Liked
                        })
                      }
                      return res.status(200).json({
                        status: 0,
                        message: "Profile Returned.",
                        username: results1[0].userName,
                        userID: results1[0].userID,
                        comments: listOfComments,
                        posts: listOfPosts
                      })
                    }
                  })
                }
              })
            }
          })
        }
      })
    }
  })
app.listen(3001, function() {
  console.log("Server Started.")
});
