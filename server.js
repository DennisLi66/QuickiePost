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
  `SELECT * from posts
  LEFT JOIN
  (select userid,username from users) uzers
  on uzers.userID = posts.userID
  WHERE visibility != 'hidden' AND visibility != 'private';
  `
  connection.query(sQuery,[],function(err,results,fields){
    if (err){
      return res.status(200).json({
        status: -1,
        message: err
      })
    } else if (results){
      console.log(results);
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
})
app.get("/search",function(req,res){
  var title = req.query.title;
  var content = req.query.content;
  var sdate = req.query.sdate;
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
    if (!req.query.postID){
      return res.status(200).json({
        status: -1,
        message: "Post ID Not Given."
      })
    }
    var sQuery =
    `SELECT * FROM posts
    LEFT JOIN
    (select userid,username from users) uzers
    on uzers.userID = posts.userID
    WHERE postID = ?`;
    connection.query(sQuery,[req.query.postid],function(err,results,fields){
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
          console.log(results[0].visibility);
          if (results[0].visibility !== 'private' || results[0].visibility !== 'hidden'){
            return res.status(200).json({
              status: 0,
              title: results[0].title,
              userID: results[0].userID,
              content: results[0].content,
              subDate: results[0].subDate
            })
          }
          else{
            //FIX THIS: return based on permissions
          }
        }
      }
    })
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
    if (!userID){
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
      var iQuery =
      `
      INSERT INTO posts (userID,title,content,visibility,subDate) VALUES (?,?,?,?,NOW());
      `;
      //REPLACE WITH ACTUAL ID
      connection.query(iQuery,[1,req.query.title,req.query.contents,req.query.visibility],function(err,results,fields){
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
app.post("/register",function(req,res){

})
app.post("/login",function(req,res){

})

app.route("/user")
  //Get User and Associated Posts
  .get(function(req,res){
    var userID = req.query.userID;
    //Get hidden posts if mod or admin
    //Get private posts if mod, admin, or owner
    var sQuery = "SELECT * FROM users LEFT JOIN posts ON users.userID = posts.userID WHERE users.userID = ?";
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
              subDate: results[i].subDate, username: results[i].username
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

app.listen(3001, function() {
  console.log("Server Started.")
});
