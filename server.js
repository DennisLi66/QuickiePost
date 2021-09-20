//Things to Do
//Maybe Search By Hashtags?
//add an error for if user is blocked

require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const randomatic = require('randomatic');
const cors = require("cors");
const nodemailer = require("nodemailer");

var transporter = nodemailer.createTransport({
  service: process.env.EMAILSYS,
  auth: {
    user: process.env.EMAILUSER,
    pass: process.env.EMAILPASSWORD
  }
});

const app = express();
app.use(express.static("public"));
app.use(cors({
  origin: 'http://localhost:3000',
  // credentials: true,
  optionsSuccessStatus: 200
}));
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
//Evergreen QUERY
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
  ON sessions.userID = a.userID AND sessions.sessionDate = a.high;
`;
var updateSessionQuery =
`
UPDATE sessions
SET sessionDate = NOW()
WHERE sessionID = ?
;
`;
// Get All Posts
app.get("/posts", function(req, res) {
  //works as intended currently
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
  ORDER BY posts.subDate desc
  `
  var variables = [];
  if (req.query.userID && req.query.sessionID) {
    console.log("Logged In Posts")
    sQuery = //FIX THIS: VISIBILITY PRIVACY
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
    ON comments.postID = posts.postID
    ORDER BY posts.subDate desc;
    `;
    variables.push(req.query.userID);
    connection.query(cQuery + updateSessionQuery, [req.query.userID, req.query.sessionID,req.query.sessionID], function(err1, results1, fields) {
      if (err1) {
        return res.status(200).json({
          status: -1,
          message: err1
        })
      } else if (results1.length === 0) {
        return res.status(200).json({
          status: -11,
          message: "Not Valid Session."
        })
      } else {
        connection.query(sQuery, variables, function(err, results, fields) {
          if (err) {
            return res.status(200).json({
              status: -1,
              message: err
            })
          } else if (results) {
            // console.log(results);
            var toPrep = [];
            for (let i = 0; i < results.length; i++) {
              toPrep.push({
                title: results[i].title,
                userID: results[i].userID,
                content: results[i].content,
                subDate: results[i].subDate,
                username: results[i].username,
                totalLikes: results[i].totalLikes,
                totalComments: results[i].totalComments,
                Liked: results[i].Liked,
                postID: results[i].postID
              });
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
  } else {
    connection.query(sQuery, variables, function(err, results, fields) {
      if (err) {
        return res.status(200).json({
          status: -1,
          message: err
        })
      } else if (results) {
        // console.log(results);
        var toPrep = [];
        for (let i = 0; i < results.length; i++) {
          toPrep.push({
            title: results[i].title,
            userID: results[i].userID,
            content: results[i].content,
            subDate: results[i].subDate,
            username: results[i].username,
            totalLikes: results[i].totalLikes,
            totalComments: results[i].totalComments,
            postID: results[i].postID
          })
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
app.get("/myfeed", function(req, res) {
  //show my posts and posts Im allowed to view from friends
  if (!req.query.userID || !req.query.sessionID) {
    return res.status(200).json({
      status: -1,
      message: "Not Enough Information."
    })
  }
  //check for valid sessions
  var sQuery = //works
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
  connection.query(cQuery + updateSessionQuery, [req.query.userID, req.query.sessionID,req.query.sessionID], function(err1, results1, fields) {
    if (err1) {
      return res.status(200).json({
        status: -1,
        message: err1
      })
    } else if (results1.length === 0) {
      return res.status(200).json({
        status: -11,
        message: "Not Valid Session."
      })
    } else {
      // console.log(req.query.userID);
      connection.query(sQuery, [req.query.userID, req.query.userID], function(err, results, fields) {
        if (err) {
          return res.status(200).json({
            status: -1,
            message: err
          })
        } else if (results) {
          // console.log(results);
          var toPrep = {};
          for (let i = 0; i < results.length; i++) {
            toPrep[i] = {
              title: results[i].title,
              userID: results[i].userID,
              content: results[i].content,
              subDate: results[i].subDate,
              username: results[i].username
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
app.get("/search", function(req, res) {
  var title = req.query.title;
  var content = req.query.content;
  var sdate = req.query.sDate;
  var username = req.query.username;
  var userID = req.query.userID;
  var sessionID = req.query.sessionID;
  if (!title && !content && !sdate && !username) {
    return res.status(200).json({
      status: -1,
      message: "No valid search information included."
    })
  }
  var toJoinQuery = [];
  var variables = [];
  if (title) {
    toJoinQuery.push(" AND title LIKE ?");
    variables.push('%' + title + '%');
  }
  if (content) {
    toJoinQuery.push(" AND content LIKE ?");
    variables.push('%' + content + '%');
  }
  //FIX THIS? Maybe make Day a range
  if (sdate) {
    toJoinQuery.push(' AND DATE(subDate) = ?');
    variables.push(sdate);
  }
  if (username) {
    toJoinQuery.push(" AND username = ?");
    variables.push(username);
  }
  if (sessionID && userID) {
    //logged in version -- perform cQuery -- do other one first
    //update query to consider user being hidden or private
    connection.query(cQuery + updateSessionQuery, [req.query.userID, req.query.sessionID,req.query.sessionID], function(err1, results1, fields) {
      if (err1) {
        return res.status(200).json({
          message: err1,
          status: -1
        })
      } else if (results1.length === 0) {
        return res.status(200).json({
          status: -11,
          message: "Not Valid Session."
        })
      } else {
        var sQuery = //works
          `
          SELECT posts.postID as postID, posts.userID as userID, posts.title as title, posts.content as content,
          posts.visibility as postVisibility, subDate, username, uzers.visibility as userVisibility,
          if(viewerID is null,'false','true') as amViewing, if(likes.userID is null,'false','true') as isLiked
          from posts
          LEFT JOIN
          (select userid,username,visibility,viewerID from users left join
          (select * from viewers WHERE viewerID = ?) viewers on viewers.posterID = users.userID) uzers
          on uzers.userID = posts.userID
          LEFT JOIN (select * from likes WHERE userID = ?) as likes ON likes.postID = posts.postID
          WHERE
          posts.visibility != 'hidden'
          AND uzers.visibility != 'hidden'
          AND (posts.visibility != 'private' OR viewerID is not null)
          AND (uzers.visibility != 'private' OR viewerID is not null)
        `;
        sQuery += toJoinQuery.join("") + " ORDER BY posts.subDate desc";
        var stuff = [userID,userID].concat(variables);
        connection.query(sQuery, stuff, function(err, results, fields) {
          if (err) {
            return res.status(200).json({
              status: -1,
              message: err
            })
          } else {
            if (results.length > 0) {
              var toPrep = [];
              for (let i = 0; i < results.length; i++) {
                toPrep.push({
                  postID: results[i].postID,
                  title: results[i].title,
                  userID: results[i].userID,
                  content: results[i].content,
                  subDate: results[i].subDate,
                  username: results[i].username
                })
              }
              return res.status(200).json({
                status: 0,
                message: "Posts Returned.",
                contents: toPrep
              })
            } else {
              return res.status(200).json({
                status: 1,
                message: "No values returned."
              })
            }
          }
        })
      }
    })
  } else {
    var sQuery = //works
      `
    SELECT * from posts
    LEFT JOIN
    (select userid,username,visibility from users) uzers
    on uzers.userID = posts.userID
    WHERE posts.visibility != 'hidden' AND posts.visibility != 'private'
    AND uzers.visibility != 'hidden' AND uzers.visibility != 'private'
    `;
    sQuery += toJoinQuery.join("") + " ORDER BY posts.subDate desc";
    console.log(sQuery);
    connection.query(sQuery, variables, function(err, results, fields) {
      if (err) {
        return res.status(200).json({
          status: -1,
          message: err
        })
      } else {
        if (results.length > 0) {
          var toPrep = [];
          for (let i = 0; i < results.length; i++) {
            toPrep.push({
              postID: results[i].postID,
              title: results[i].title,
              userID: results[i].userID,
              content: results[i].content,
              subDate: results[i].subDate,
              username: results[i].username
            })
          }
          return res.status(200).json({
            status: 0,
            message: "Posts Returned.",
            contents: toPrep
          })
        } else {
          return res.status(200).json({
            status: 1,
            message: "No values returned."
          })
        }
      }
    })
  }
})
///Post Endpoints
app.route("/post")
  //Retrieve Single Post
  .get(function(req, res) {
    console.log(req.query.postID)
    //Retrieve Amount of Likes and Comments
    // console.log(req.query.userID,req.query.sessionID,req.query.postID)
    if (!req.query.postID) {
      return res.status(200).json({
        status: -1,
        message: "Post ID Not Given."
      })
    } else if (req.query.userID && req.query.sessionID) {
      var sQuery =
        `
        SELECT * FROM (
        SELECT
        posts.postID as postID, comments.commentID, comments.userID as commenterID, comments, comments.visibility as commentVisibility,  users.userName as commenterName,
        users.visibility as commenterVisibility, ifnull(commentLikes,0) as commentLikes,
        comments.submissionDate as commentDate, ifnull(totalLikes,0) as totalLikes, uzers.userID as authorID, title,content,
        posts.visibility as postVisibility, posts.subDate as postDate, uzers.userName as authorName, uzers.visibility as authorVisibility,
        if (isLiked.userID is null, "Unliked","Liked") as postLiked, if (commentLiked.userID is null,"Unliked","Liked") as commentLiked,  postViewers.viewerID as viewerID
        FROM posts
        left join comments on posts.postID = comments.postID
        left join users on users.userID = comments.userID
        left join (select postID, count(*) as totalLikes from likes group by postID) totalLikes on totalLikes.postID = posts.postID
        left join (select * from users) uzers on uzers.userID = posts.userID
        left join (select count(*) as commentLikes, commentID from commentLikes group by commentID) commentLikes ON commentLikes.commentID = comments.commentID
        LEFT JOIN (select * from likes WHERE userID = ?) isLiked ON isLiked.postID = posts.postID
        LEFT JOIN (SELECT * FROM commentLikes WHERE userID = ?) commentLiked on commentLiked.commentID = comments.commentID
        LEFT JOIN (select * from viewers WHERE viewerID = ?) commentViewers ON commentViewers.posterID = comments.userID
        LEFT JOIN (select * from viewers where viewerID = ?) postViewers ON postViewers.posterID = posts.userID
        ) bigQuery
        WHERE postID = ?
        AND postVisibility != 'hidden'  AND (postVisibility != 'private' OR viewerID is not null)
        AND (commentVisibility != 'private'  OR viewerID is not null OR commentVisibility is null) AND (NOT commentVisibility = 'hidden'  OR commentVisibility is null)
        ORDER BY commentDate DESC;
      `;
      connection.query(cQuery + updateSessionQuery, [req.query.userID, req.query.sessionID,req.query.sessionID], function(err1, results1, fields) {
        if (err1) {
          return res.status(200).json({
            status: -1,
            message: err1
          })
        } else if (results1.length === 0) {
          return res.status(200).json({
            status: -11,
            message: "Not Valid Session."
          })
        } else {
          console.log(req.query.userID, req.query.userID, req.query.userID, req.query.userID, req.query.postID);
          connection.query(sQuery, [req.query.userID, req.query.userID, req.query.userID, req.query.userID, req.query.postID], function(err, results, fields) {
            if (err) {
              console.log(err);
              return res.status(200).json({
                status: -1,
                message: err
              })
            } else {
              if (results.length === 0) {
                return res.status(200).json({
                  status: -2,
                  message: "There was no post with that ID. ERR1"
                })
              } else {
                var toPrep = [];
                for (let i = 0; i < results.length; i++) {
                  if (results[i].commentID && results[i].commenterVisibility !== 'hidden' && results[i].commenterVisibility !== 'private' &&
                    results[i].commentVisibility !== 'private' && results[i].commentVisibility !== 'hidden') {
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
    } else {
      var sQuery = //works
        `
        SELECT comments.commentID, posts.postID as postID, comments.userID as commenterID, comments, comments.visibility as commentVisibility,  users.userName as commenterName,
        users.visibility as commenterVisibility, ifnull(commentLikes,0) as commentLikes, comments.submissionDate as commentDate, ifnull(totalLikes,0) as totalLikes, uzers.userID as authorID, title,content,
        posts.visibility as postVisibility, posts.subDate as postDate, uzers.userName as authorName, uzers.visibility as authorVisibility FROM posts
        left join (select * from comments WHERE visibility != 'private' AND visibility != "hidden" )comments on posts.postID = comments.postID
        left join users on users.userID = comments.userID
        left join (select postID, count(*) as totalLikes from likes group by postID) totalLikes
        on totalLikes.postID = posts.postID
        left join (select * from users) uzers on uzers.userID = posts.userID
        left join (select count(*) as commentLikes, commentID from commentLikes group by commentID) commentLikes
        ON commentLikes.commentID = comments.commentID
        WHERE
        posts.postID = ? AND
        posts.visibility != 'hidden' AND posts.visibility != 'private'
        ORDER BY comments.submissionDate DESC
      `;
      connection.query(sQuery, [req.query.postID], function(err, results, fields) {
        if (err) {
          console.log(err);
          return res.status(200).json({
            status: -1,
            message: err
          })
        } else {
          if (results.length === 0) {
            return res.status(200).json({
              status: -2,
              message: "There was no post with that ID. ERR2"
            })
          } else {
            var toPrep = [];
            for (let i = 0; i < results.length; i++) {
              if (results[i].commentID && results[i].commenterVisibility !== 'hidden' && results[i].commenterVisibility !== 'private' &&
                results[i].commentVisibility !== 'private' && results[i].commentVisibility !== 'hidden') {
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
  .delete(function(req, res) {
    //FIX THIS: Will Need to Establish Permissions based on mod powers
    var userID = req.query.userID;
    var sessionID = req.query.sessionID;
    if (!userID) {
      return res.status(200).json({
        status: -1,
        message: "User Not Logged In."
      })
    } else {
      if (!req.query.postID) {
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
        WHERE postID = ?;
        `;
      connection.query(uQuery, [req.query.postid], function(err, results, fields) {
        if (err) {
          console.log(err);
          return res.status(200).json({
            status: -1,
            message: err
          })
        } else {
          if (results.length == 0) {
            return res.status(200).json({
              status: -1,
              message: "Could not find a post with that ID."
            })
          } else {
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
  .put(function(req, res) {
    //GET ID
    var userID = req.query.userID;
    var sessionID = req.query.sessionID;
    var visibility = req.query.visibility;
    if (!userID || !sessionID) {
      return res.status(200).json({
        status: -1,
        message: "User Not Logged In."
      })
    } else {
      //query string has a max length of 2048 characters
      if (!req.query.title || !req.query.contents || !visibility) {
        return res.status(200).json({
          status: -1,
          message: "Not enough information provided."
        })
      } else {
        //search for valid session
        connection.query(cQuery, [userID, sessionID], function(errorr, resultss, fieldss) {
          if (errorr) {
            return res.status(200).json({
              status: -1,
              message: errorr
            })
          } else {
            var iQuery;
            var variables = [];
            iQuery =
              `
            INSERT INTO posts (userID,title,content,visibility,subDate) VALUES (?,?,?,?,NOW());
            SELECT LAST_INSERT_ID();
            `;
            variables = [userID, req.query.title, req.query.contents, visibility];
            connection.query(iQuery, variables, function(err, results, fields) {
              if (err) {
                return res.status(200).json({
                  status: -1,
                  message: err
                })
              } else {
                return res.status(200).json({
                  status: 0,
                  message: "Post Added.",
                  postID: results[0].insertId
                })
              }
            })
          }
        })
      }
    }
  })
  //Edit Single POST
  .patch(function(req, res) {
    //check postID, userID and sessionID
    var postID = req.query.postID;
    var userID = req.query.userID;
    var sessionID = req.query.sessionID;
    //things can change - title, content, visibility
    var title = req.query.title;
    var content = req.query.content;
    var visibility = req.query.visibility;
    //Queries
    if (!userID || !postID || !sessionID) {
      return res.status(200).json({
        status: -1,
        message: "Not Enough Information."
      })
    }
    if (!title && !content && !visibility) {
      return res.status(200).json({
        status: -1,
        message: "Nothing to Change."
      })
    }
    connection.query(cQuery + updateSessionQuery, [req.query.userID, req.query.sessionID,req.query.sessionID], function(err1, results1, fields) {
      if (err1) {
        return res.status(200).json({
          message: err1,
          status: -1
        })
      } else if (results1.length === 0) {
        return res.status(200).json({
          status: -11,
          message: "Not Valid Session."
        })
      } else {
        var checkOwnerQuery =
          `
        SELECT * FROM posts WHERE postID = ? AND userID = ?;
        `;
        connection.query(checkOwnerQuery, [postID, userID], function(err2, results2, fields2) {
          if (err2) {
            return res.status(200).json({
              status: -1,
              message: err2
            })
          } else if (results2.length === 0) {
            return res.status(200), json({
              status: -1,
              message: "Post Not Found."
            })
          } else {
            var setPositions = [];
            var variables;
            if (title) {
              setPositions.push(" title = ? ")
              variables.push(title);
            }
            if (content) {
              setPositions.push(" content = ? ");
              variables.push(content);
            }
            if (visibility) {
              setPositions.push(" visibility = ? ");
              variables.push(visibility);
            }
            variables.push(postID)
            connection.query("UPDATE posts SET " + setPositions.join(",") + " WHERE postID = ?", variables, function(err, results, fields) {
              if (err) {
                return res.status(200).json({
                  status: -1,
                  message: err
                })
              } else {
                return res.status(200).json({
                  status: 0,
                  message: "Update Occured."
                })
              }
            })
          }
        })
      }
    })
  })
app.route("/like")
  .put(function(req, res) {
    //check sessions and userID, then add like
    if (!req.query.userID || !req.query.sessionID || !req.query.postID) {
      return res.status(200).json({
        status: -1,
        message: "Not Enough Information."
      })
    }
    var iQuery =
      `
    INSERT INTO likes (postID,userID) VALUES (?,?);
    `;
    connection.query(cQuery + updateSessionQuery, [req.query.userID, req.query.sessionID,req.query.sessionID], function(err1, results1, fields) {
      if (err1) {
        return res.status(200).json({
          message: err1,
          status: -1
        })
      } else if (results1.length === 0) {
        return res.status(200).json({
          status: -11,
          message: "Not Valid Session"
        })
      } else {
        connection.query(iQuery, [req.query.postID, req.query.userID], function(err2, results2, fields) {
          if (err2) {
            return res.status(200).json({
              message: err2,
              status: -1
            })
          } else {
            return res.status(200).json({
              status: 0,
              message: "Like Inserted."
            })
          }
        })
      }
    })
  })
  .delete(function(req, res) {
    //check sessions and userID, then remove like
    if (!req.query.userID || !req.query.sessionID || !req.query.postID) {
      return res.status(200).json({
        status: -1,
        message: "Not Enough Information."
      })
    }
    var dQuery =
      `
    DELETE FROM likes WHERE userID = ? AND postID = ?;
    `;
    connection.query(cQuery + updateSessionQuery, [req.query.userID, req.query.sessionID,req.query.sessionID], function(err1, results1, fields) {
      if (err1) {
        return res.status(200).json({
          status: -1,
          message: err1
        })
      } else if (results1.length === 0) {
        return res.status(200).json({
          status: -11,
          message: "Not Valid Session"
        })
      } else {
        connection.query(dQuery, [req.query.userID, req.query.postID], function(err2, results2, fields) {
          if (err2) {
            return res.status(200).json({
              status: -1,
              message: err2
            })
          } else {
            return res.status(200).json({
              status: 0,
              message: "Deletion Occured."
            })
          }
        })
      }
    })
  })
app.route("/getPostWithHashtag")
  .get(function(req,res){
    if (!req.query.hashtag){
      return res.status(200).json({
        message: "Not Enough Information.",
        status: -1
      })
    }
    else{
      if (req.query.userID && req.query.sessionID){
        connection.query(cQuery + updateSessionQuery,[req.query.userID, req.query.sessionID,req.query.sessionID],function(err1,resu;ts1,fields1){
          if (err1) {
            return res.status(200).json({
              status: -1,
              message: err1
            })
          } else if (results1.length === 0) {
            return res.status(200).json({
              status: -11,
              message: "Not Valid Session."
            })
          } else {
            var sQuery =
            `
            SELECT
            posts.postID as postID, posts.userID as userID,title,content, posts.visibility as postVisibility, subDate, users.userID as userID,
            userName as username, users.visibility as userVisibility, ifnull(likeAmount,0) as totalLikes, ifnull(commentAmount, 0) as totalComments,
            if(isLiked.userID is null,"false","true") as Liked, if(viewership.viewerID is null,'false','true') as isViewer
            FROM posts
            LEFT JOIN users ON users.userID = posts.userID
            LEFT JOIN (SELECT postID, count(*) as likeAmount FROM likes group by postID) as totalLikes ON posts.postID = totalLikes.postID
            LEFT JOIN (SELECT postID, count(*) as commentAmount FROM comments group by postID) as totalComments ON totalComments.postID = posts.postID
            LEFT JOIN (SELECT postID, userID from likes WHERE userID = ?) isLiked ON isLiked.postID = posts.postID
            LEFT JOIN (SELECT * from viewers WHERE viewerID = ?) viewership on viewership.posterID = posts.userID
            WHERE title LIKE ? OR content LIKE ?
            AND posts.visibility != 'hidden' AND users.visibility != 'hidden'
            AND (posts.visibility != 'private' OR viewerID is not null)
            AND (users.visibility != 'private' OR viewerID is not null)
            order by subDate DESC
            `;
            connection.query(sQuery, [req.query.userID,req.query.userID,'%' + req.query.hashtag + "%",'%' + req.query.hashtag + "%"], function(err, results, fields) {
              if (err){
                return res.status(200).json({
                  status: -1,
                  message: err
                })
              }
              else{
                var toPrep = [];
                for (let i = 0; i < results.length; i++) {
                  toPrep.push({
                    title: results[i].title,
                    userID: results[i].userID,
                    content: results[i].content,
                    subDate: results[i].subDate,
                    username: results[i].username,
                    totalLikes: results[i].totalLikes,
                    totalComments: results[i].totalComments,
                    postID: results[i].postID,
                    isLiked: results[i].Liked
                  })
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
      }else{
        var sQuery =
        `
        SELECT
        posts.postID as postID, posts.userID as userID,title,content, posts.visibility as postVisibility, subDate,
        users.userID as userID, userName as username, users.visibility as userVisibility,
        ifnull(likeAmount,0) as totalLikes, ifnull(commentAmount, 0) as totalComments
        FROM posts LEFT JOIN users ON users.userID = posts.userID
        LEFT JOIN (SELECT postID, count(*) as likeAmount FROM likes group by postID) as totalLikes ON posts.postID = totalLikes.postID
        LEFT JOIN (SELECT postID, count(*) as commentAmount FROM comments group by postID) as totalComments ON totalComments.postID = posts.postID
        WHERE title LIKE ? OR content LIKE ?
        AND posts.visibility != 'hidden'
        AND users.visibility != 'hidden'
        AND (posts.visibility != 'private')
        AND (users.visibility != 'private')
        order by subDate DESC
        `;
        connection.query(sQuery,['%' + req.query.hashtag + '%','%' + req.query.hashtag + '%'],function(err,results,fields){
          if (err){
            return res.status(200).json({
              status: -1,
              message: err
            })
          }
          else{
            var toPrep = [];
            for (let i = 0; i < results.length; i++) {
              toPrep.push({
                title: results[i].title,
                userID: results[i].userID,
                content: results[i].content,
                subDate: results[i].subDate,
                username: results[i].username,
                totalLikes: results[i].totalLikes,
                totalComments: results[i].totalComments,
                postID: results[i].postID
              })
            }
            return res.status(200).json({
              status: 0,
              message: "Request Received.",
              contents: toPrep
            })
          }
        })
      }
    }
  })
// User Info Endpoints
app.post("/register", function(req, res) {
  var email = req.body.email;
  var pswrd = req.body.pswrd;
  var username = req.body.username;
  //checking for uniqueness already occurs
  //encrypt password
  if (!email || !pswrd || !username) {
    return res.status(200).json({
      status: -1,
      message: "Not Enough Data Included."
    })
  } else {
    bcrypt.hash(pswrd, 15, function(e2rr, hash) {
      if (e2rr) {
        return res.status(200).json({
          status: -1,
          message: e2rr
        })
      } else {
        var iQuery = "INSERT INTO users (userName,email,pswrd,visibility,classification) VALUES (?,?,?,'public',?)";
        connection.query(iQuery, [username, email, hash, 'user'], function(err, results, fields) {
          if (err && err.sqlState === '23000') {
            console.log("Already Exists");
            return res.status(200).json({
              status: -2,
              message: "Email already in Use."
            })
          } else if (err) {
            console.log(err);
            return res.status(200).json({
              status: -1,
              message: err
            })
          } else {
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
app.post("/login", function(req, res) {
  var email = req.body.email;
  var pswrd = req.body.pswrd;
  var rememberMe = req.body.rememberMe;
  if (!email || !pswrd || !rememberMe) {
    return res.status(200).json({
      status: -1,
      message: "Not enough information."
    })
  } else {
    var sQuery = "select * from users WHERE email = ?" //works
    connection.query(sQuery, [email], function(e3rr, results, fields) {
      if (e3rr) {
        return res.status(200).json({
          status: -1,
          message: e3rr
        })
      } else {
        if (results.length === 0) {
          return res.status(200).json({
            status: -2,
            message: "That combination did not exist."
          })
        } else {
          //uncrypt password and check
          var resPass = results[0].pswrd;
          bcrypt.compare(pswrd, resPass, function(err3, rresult) {
            if (err3) {
              return res.status(200).json({
                status: -1,
                message: err3
              })
            } else if (rresult) {
              if (results[0].visibility === "hidden"){
                var sessionID = randomatic('Aa0', 20);
                return res.status(200).json({
                  status: -3,
                  message: "Hidden Account",
                  rememberMe: rememberMe,
                  userID: results[0].userID,
                  username: results[0].userName,
                  sessionID: sessionID
                })
              }
              else{
                //Create a Session ID
                var sessionID = randomatic('Aa0', 20);
                if (rememberMe === 'hour') {
                  var iQuery =
                    `
                  INSERT INTO sessions (sessionID,userID,sessionDate,timeDuration) VALUES (?,?,NOW(),"HOUR");
                  `
                  connection.query(iQuery, [sessionID, results[0].userID], function(err, rresults, fields) {
                    if (err) {
                      return res.status(200).json({
                        status: -1,
                        message: err
                      })
                    } else {
                      return res.status(200).json({
                        status: 0,
                        message: "Confirmation.",
                        userID: results[0].userID,
                        username: results[0].userName,
                        sessionID: sessionID
                      })
                    }
                  })
                } else if (rememberMe === 'forever') {
                  var iQuery =
                    `
                  INSERT INTO sessions (sessionID,userID,sessionDate,timeDuration) VALUES (?,?,NOW(),"FOREVER");
                  `
                  connection.query(iQuery, [sessionID, results[0].userID], function(err, rresults, fields) {
                    if (err) {
                      return res.status(200).json({
                        status: -1,
                        message: err
                      })
                    } else {
                      return res.status(200).json({
                        status: 0,
                        message: "Confirmation.",
                        userID: results[0].userID,
                        username: results[0].userName,
                        sessionID: sessionID
                      })
                    }
                  })
                } else {
                  return res.status(200).json({
                    status: -1,
                    message: "Remember Me Not Included Properly."
                  })
                }
              }
            } else {
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
app.route("/reactivationCode")
  .post(function(req,res){
    if (req.body.userID){
      return res.status(200).status(200).json({
        status: -1,
        message: "UserID Not Included."
      })
    }
    else{
      //generate random 6 digit code and submit to mysql database
      var iorUQuery =
      `
      INSERT INTO reactivationCodes
        (userID,reactivationCode,addDate)
      values
        (?,?,NOW())
      ON DUPLICATE KEY UPDATE
        userID = VALUES(userID),
        reactivationCode = VALUES(reactivationCode),
        addDate = VALUES(addDate);
      SELECT * FROM users WHERE userID = ?;
      `;
      var code = randomatic('A0', 6);
      connection.query(iorUQuery,[req.body.userID,code,req.body.userID],function(err,results,fields){
        if (err){
          return res.status(200).json({
            status: -1,
            message: err
          })
        }else{
          var mailOptions = {
            from: process.env.EMAILUSER,
            to: results[1][0].email,
            subject: 'Reactivation Account Link',
            html: 'Your code is ' + code  + '.'
          };
          transporter.sendMail(mailOptions, function(error, info) {
            if (error){
              return res.status(200).json({
                status: 1,
                message: error
              })
            }else{
              return res.status(200).json({
                status: 0,
                message: "Successful Action."
                // ,code: code
              })
            }
          })
        }
      })
    }
  })
  .delete(function(req,res){
    if (req.body.userID){
      return res.status(200).status(200).json({
        status: -1,
        message: "UserID Not Included."
      })
    }
    else{
      // delete 6 digit code from database associated to userID
      var dQuery =
      `
      DELETE FROM reactivationCodes
      WHERE userID = ?;
      `;
      connection.query(dQuery,[req.body.userID],function(err,results,fields){
        if (err){
          return res.status(200).json({
            status: -1,
            message: err
          })
        }
        else{
          return res.status(200).json({
            status: 0,
            message: "Deletion Occurred."
          })
        }
      })
    }
  })
app.route("/checkReactivationCode")
  .post(function(req,res){
    if (!req.body.userID || !req.body.reactivationCode){
      return res.status(200).json({
        status: -1,
        message: "Not Enough Information."
      })
    }else{
      var sQuery =
      `
      SELECT * FROM
      reactivationCodes
      WHERE userID = ? AND reactivationCode = ?
      `;
      connection.query(sQuery,[req.body.userID,req.body.reactivationCOde],function(err,results,fields){
        if (err){
          return res.status(200).json({
            status: -1,
            message: err
          })
        }
        else if (results.length === 0){
          return res.status(200).status({
            message: "Invalid Combination.",
            status: -2
          })
        }else{
          return res.status(200).json({
            status: 0,
            message: "Worked."
          })
        }
      })
    }
  })
  app.route("/forgotPassword")
    .post(function(req,res){
      if (!req.body.email){
        return res.status(200).json({
          status: -1,
          message: "Not Enough Information."
        })
      }
      else{
        //generate random code and insert
        var code = randomatic('A0', 6);
        var iorUQuery =
        `
        INSERT INTO forgottenPasswordCodes
          (email,fpCode,addDate)
        values
          (?,?,NOW())
        ON DUPLICATE KEY UPDATE
          email = VALUES(email),
          fpCode = VALUES(fpCode),
          addDate = VALUES(addDate);
        SELECT * FROM users WHERE email = ?;
        `;
        connection.query(iorUQuery,[req.body.email,code,req.body.email],function(error,results,fields){
          if (err){
            return res.status(200).json({
              status: -1,
              message: error
            })
          }else{
            var mailOptions = {
              from: process.env.EMAILUSER,
              to: req.body.email,
              subject: 'Password Recovery Link',
              html: 'Your code is ' + code  + '.'
            };
            transporter.sendMail(mailOptions,function(error,info){
              if (error){
                return res.status(200).json({
                  status: 1,
                  message: error
                })
              }
              else{
                return res.status(200).json({
                  status: 0,
                  message: "Successful Forgotten Password Stored."
                })
              }
          })
        }
        })
        }
      })
  app.route("/checkForgottenPassword")
    .post(function(req,res){
      //will need to edit user
      if (!req.body.email || !req.body.fpCode){
        return res.status(200).json({
          status: -1,
          message: "Not enough information."
        })
      }
      else{
        var sQuery =
        `
        SELECT * FROM
        forgottenPasswordCodes
        WHERE email = ? AND fpCode = ?;
        `
        connection.query(sQuery,[req.body.email,req.body.fpCode],function(err,results,fields){
          if (err){
            return res.status(200).json({
              status: -1,
              message: err
            })
          }
          else if (results.length === 0){
            return res.status(200).status({
              message: "Invalid Combination.",
              status: -2
            })
          }else{
            return res.status(200).json({
              status: 0,
              message: "Worked."
            })
          }
        })
      }
    })
//User Info Endpoints
app.route("/user")
  .get(function(req, res) {
  //Get User and Associated Posts
    var sessionID = req.query.sessionID;
    var userID = req.query.userID;
    var profileID = req.query.profileID;
    if (!profileID) {
      return res.status(200).json({
        status: -1,
        message: "Need User's Profile"
      })
    } else if (!sessionID || !userID) {
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
      connection.query(uQuery, [profileID], function(err, results, fields) {
        if (err) {
          return res.status(200).json({
            status: -1,
            message: err
          })
        } else if (results.length === 0) {
          return res.status(200).json({
            status: -1,
            message: "No Valid Profile."
          })
        } else {
          connection.query(sQuery1, [profileID], function(err1, results1, fields) {
            if (err1) {
              return res.status(200).json({
                status: -1,
                message: err1
              })
            } else {
              connection.query(sQuery2, [profileID], function(err2, results2, fields) {
                if (err2) {
                  return res.status(200).json({
                    status: -1,
                    message: err2
                  })
                } else {
                  var commentsList = [];
                  var postsList = [];
                  for (let i = 0; i < results1.length; i++) {
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
                  for (let i = 0; i < results2.length; i++) {
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
    } else {
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
      connection.query(cQuery, [userID, sessionID], function(cErr, cResults, cFields) {
        if (cErr) {
          return res.status(200).json({
            status: -1,
            message: cErr
          })
        } else if (cResults.length === 0) {
          return res.status(200).json({
            status: -11,
            message: "Not Valid Session"
          })
        } else {
          connection.query(uQuery, [profileID, userID], function(err1, results1, fields1) {
            if (err1) {
              return res.status(200).json({
                status: -1,
                message: err1
              })
            } else if (results1.length === 0) {
              return res.status(200).json({
                status: -1,
                message: "No such account."
              })
            } else {
              connection.query(sQuery1, [userID, userID, profileID, userID], function(err2, results2, fields2) {
                if (err2) {
                  return res.status(200).json({
                    status: -1,
                    message: err2
                  })
                } else {
                  var listOfPosts = [];
                  for (let i = 0; i < results2.length; i++) {
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
                  connection.query(sQuery2, [userID, userID, profileID, userID, userID], function(err3, results3, fields3) {
                    if (err3) {
                      return res.status(200).json({
                        status: -1,
                        message: err3
                      })
                    } else {
                      var listOfComments = [];
                      for (let i = 0; i < results3.length; i++) {
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
  .patch(function(req, res) {   //Edit User Info
    if ((!req.body.email && !req.body.userID) || (!req.body.visibility) && (!req.body.userName) || (!req.body.pswrd)){
      return res.status(200).json({
        status: -1,
        message: "Not enough information."
      })
    }
    else{
      var uQueryFragment =
      `
      UPDATE users
      SET
      `
      var fragments = [];
      var variables = [];
      if (req.body.visibility){
        fragments.push('visibility = ?');
        variables.push(req.body.visibility);
      }
      if (req.body.userName){
        fragments.push('userName = ?');
        variables.push(req.body.userName);
      }
      if (req.body.pswrd){
        fragments.push('pswrd = ?');
        variables.push(req.body.pswrd);
      }
      var finalFragment;
      if (req.body.email){
        finalFragment = " WHERE email = ?;"
        variables.push(req.body.email);
      }else{
        finalFragment = " WHERE userID = ?;"
        variables.push(req.body.userID);
      }
      var finalQuery = uQueryFragment + fragments.join(",") + finalFragment;
      connection.query(finalQuery,variables,function(err,results,fields){
        if (err){
          return res.status(200).json({
            message: err,
            status: -1
          })
        }else{
          return res.status(200).json({
            status: 0,
            message: "Update Successful."
          })
        }
      })
    }
  })
app.route("/comment")
  .get(function(req, res) {
    //REWORK THIS ROUTE
    var commentID = req.query.commentID;
    if (!commentID) {
      return res.status(200).json({
        status: -1,
        message: "No Comment ID"
      })
    } else {
      var sessionID = req.query.sessionID;
      var userID = req.query.userID;
      if (!sessionID || !userID) {
        //can pull not friendly private comments
        //FIX THIS QUERY
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
        connection.query(sQuery, [commentID], function(err, result, fields) {
          if (err) {
            return res.status(200).json({
              status: -1,
              message: err
            })
          } else if (result.length === 0) {
            return res.status(200).json({
              status: -1,
              message: "No such comment exists."
            })
          } else {
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
      } else {
        //can pull friendly comments
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
        connection.query(cQuery, [userID, sessionID], function(err1, results1, fields) {
          if (err1) {
            return res.status(200).json({
              status: -1,
              message: err1
            })
          } else if (results1.length == 0) {
            return res.status(200).json({
              status: -11,
              message: "Not Valid Session"
            })
          } else {
            connection.query(sQuery, [userID, userID, userID, userID, userID, userID, userID, commentID], function(err2, results2, fields) {
              if (err2) {
                return res.status(200).json({
                  status: -1,
                  message: err2
                })
              } else if (results2.length === 0) {
                return res.status(200).json({
                  status: -1,
                  message: "No such comment."
                })
              } else {
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
  .patch(function(req, res) {
    //FIX THIS
    var sessionID = req.query.sessionID;
    var userID = req.query.userID;
    var commentID = req.query.commentID;
    //can change comments and visibility
    var comments = req.query.comments;
    var visibility = req.query.visibility;
    visibility = !visibility ? 'public' : visibility;
    if (!sessionID || !userID || !commentID) {
      return res.status(200).json({
        status: -1,
        message: "Not Enough Information."
      })
    }
    if (!visibility && !comments) {
      return res.status(200).json({
        status: -1,
        message: "No search terms."
      })
    }
    connection.query(cQuery + updateSessionQuery, [req.query.userID, req.query.sessionID,req.query.sessionID], function(err1, results1, fields) {
      if (err1) {
        return res.status(200).json({
          message: err1,
          status: -1
        })
      } else if (results1.length === 0) {
        return res.status(200).json({
          status: -11,
          message: "Not Valid Session"
        })
      } else {
        //update
        var updateQuery =
          `
        UPDATE COMMENTS
        SET
        WHERE postID = ? AND userID = ?;
        `
        var updateStrings = [];
        var variables = [];
        if (comments) {
          updateStrings.push(" COMMENTS = ? ");
          variables.push(comments);
        }
        if (visibility) {
          updateStrings.push(" VISIBILITY = ? ");
          variables.push(visibility);
        }
        variables.push(commentID);
        variables.push(userID);
        connection.query("UPDATE COMMENTS SET " + updateStrings.join("") + "WHERE commentID = ? AND userID = ?", variables, function(err, results, fields) {
          if (err) {
            return res.status(200).json({
              status: -1,
              message: err
            })
          } else {
            return res.status(200).json({
              status: 0,
              message: "Update Occured."
            })
          }
        })
      }
    })
  })
  .put(function(req, res) {
    if (!req.query.userID || !req.query.sessionID || !req.query.postID || !req.query.content) {
      return res.status(200).json({
        status: -1,
        message: "Not Enough Information"
      })
    }
    var privacy = (!req.query.privacy ? 'public' : req.query.privacy);
    var iQuery =
      `
    INSERT INTO comments (postID,userID,comments,submissionDate,visibility) VALUES (?,?,?,NOW(),?);
    `;
    var variables = [req.query.postID, req.query.userID, req.query.content, privacy]
    connection.query(cQuery + updateSessionQuery, [req.query.userID, req.query.sessionID,req.query.sessionID], function(err1, results1, fields) {
      if (err1) {
        return res.status(200).json({
          message: err1,
          status: -1
        })
      } else if (results1.length === 0) {
        return res.status(200).json({
          status: -11,
          message: "Not Valid Session"
        })
      } else {
        connection.query(iQuery, variables, function(err2, results2, fields) {
          if (err2) {
            return res.status(200).json({
              message: err2,
              status: -1
            })
          } else {
            return res.status(200).json({
              status: 0,
              message: "Comment Inserted."
            })
          }
        })
      }
    })
  })
  .delete(function(req, res) {
    //set comment to hidden
    if (!req.query.commentID || !req.query.sessionID || !req.query.userID) {
      return res.status(200).json({
        status: -1,
        message: "Not Enough Information"
      })
    }
    var eQuery =
      `
    UPDATE comments
    SET visibility = 'hidden'
    WHERE commentID = ?;
    `;
    connection.query(cQuery + updateSessionQuery, [req.query.userID, req.query.sessionID,req.query.sessionID], function(err1, results1, fields) {
      if (err1) {
        return res.status(200).json({
          status: -1,
          message: err1
        })
      } else if (results1.length === 0) {
        return res.status(200).json({
          status: -11,
          message: "Not Valid Session"
        })
      } else {
        connection.query(eQuery, [req.query.commentID], function(err2, results2, fields) {
          if (err2) {
            return res.status(200).json({
              status: -1,
              message: err2
            })
          } else {
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
  .put(function(req, res) {
    if (!req.query.commentID || !req.query.userID || !req.query.sessionID) {
      return res.status(200).json({
        status: -1,
        message: 'Not Enough Information'
      })
    }
    var iQuery =
      `
    INSERT INTO commentLikes (commentID,userID) VALUES (?,?);
    `;
    connection.query(cQuery + updateSessionQuery, [req.query.userID, req.query.sessionID,req.query.sessionID], function(err1, results1, fields) {
      if (err1) {
        return res.status(200).json({
          message: err1,
          status: -1
        })
      } else if (results1.length === 0) {
        return res.status(200).json({
          status: -11,
          message: "Not Valid Session"
        })
      } else {
        connection.query(iQuery, [req.query.commentID, req.query.userID], function(err2, results2, fields) {
          if (err2) {
            return res.status(200).json({
              message: err2,
              status: -1
            })
          } else {
            return res.status(200).json({
              status: 0,
              message: "Like Inserted."
            })
          }
        })
      }
    })

  })
  .delete(function(req, res) {
    if (!req.query.userID || !req.query.sessionID || !req.query.commentID) {
      return res.status(200).json({
        status: -1,
        message: "Not Enough Information."
      })
    }
    var dQuery =
      `
    DELETE FROM commentLikes WHERE userID = ? AND commentID = ?;
    `;
    connection.query(cQuery + updateSessionQuery, [req.query.userID, req.query.sessionID,req.query.sessionID], function(err1, results1, fields) {
      if (err1) {
        return res.status(200).json({
          status: -1,
          message: err1
        })
      } else if (results1.length === 0) {
        return res.status(200).json({
          status: -11,
          message: "Not Valid Session"
        })
      } else {
        connection.query(dQuery, [req.query.userID, req.query.commentID], function(err2, results2, fields) {
          if (err2) {
            return res.status(200).json({
              status: -1,
              message: err2
            })
          } else {
            return res.status(200).json({
              status: 0,
              message: "Deletion Occured."
            })
          }
        })
      }
    })
  })
app.route("/block")
  .get(function(req, res) {
    //get all users a person is blocking
    var sQuery =
      `
    select blockedID,blockerID,userName from blocked
    LEFT JOIN users ON blocked.blockedID = users.userID
    WHERE blockerID = ?
    `;
    if (!req.query.sessionID || !req.query.userID) {
      return res.status(200).json({
        status: -1,
        message: 'Not Enough Information'
      })
    } else {
      connection.query(cQuery + updateSessionQuery, [req.query.userID, req.query.sessionID,req.query.sessionID], function(err1, results1, fields) {
        if (err1) {
          return res.status(200).json({
            message: err1,
            status: -1
          })
        } else if (results1.length === 0) {
          return res.status(200).json({
            status: -11,
            message: "Not Valid Session"
          })
        } else {
          connection.query(sQuery, [req.query.userID], function(err2, results2, fields) {
            if (err2) {
              return res.status(200).json({
                message: err2,
                status: -1
              })
            } else {
              var listOfBlockedUsers = [];
              for (let i = 0; i < results2.length; i++) {
                listOfBlockedUsers.push({
                  userID: results2[i].blockedID,
                  username: results2[i].userName
                })
              }
              return res.status(200).json({
                status: 0,
                message: "Results Retrieved.",
                blockedUsers: listOfBlockedUsers
              })
            }
          })
        }
      })
    }
  })
  .put(function(req, res) {
    if (!req.query.sessionID || !req.query.userID || !req.query.blockedID) {
      return res.status(200).json({
        message: "Not Enough Information.",
        status: -1
      })
    } else {
      var iQuery =
        `
      INSERT INTO blocked (blockedID,blockerID) VALUES (?,?);
      DELETE FROM viewers WHERE (posterID = ? AND viewerID = ?) OR (posterID = ? AND viewerID = ?)
      `;
      connection.query(cQuery + updateSessionQuery, [req.query.userID, req.query.sessionID,req.query.sessionID], function(err1, results1, fields) {
        if (err1) {
          return res.status(200).json({
            message: err1,
            status: -1
          })
        } else if (results1.length === 0) {
          return res.status(200).json({
            status: -11,
            message: "Not Valid Session"
          })
        } else {
          connection.query(iQuery, [req.query.blockedID, req.query.userID,req.query.blockedID, req.query.userID, req.query.userID,req.query.blockedID], function(err2, results2, fields) {
            if (err2) {
              return res.status(200).json({
                message: err2,
                status: -1
              })
            } else {
              return res.status(200).json({
                status: 0,
                message: "Block Inserted."
              })
            }
          })
        }
      })
    }
  })
  .delete(function(req, res) {
    if (!req.query.sessionID || !req.query.userID || !req.query.blockedID) {
      return res.status(200).json({
        message: "Not Enough Information.",
        status: -1
      })
    } else {
      var dQuery =
        `
      DELETE FROM blocked WHERE blockedID = ? AND blockerID = ?;
      `;
      connection.query(cQuery + updateSessionQuery, [req.query.userID, req.query.sessionID,req.query.sessionID], function(err1, results1, fields) {
        if (err1) {
          return res.status(200).json({
            status: -1,
            message: err1
          })
        } else if (results1.length === 0) {
          return res.status(200).json({
            status: -11,
            message: "Not Valid Session"
          })
        } else {
          connection.query(dQuery, [req.query.blockedID, req.query.userID], function(err2, results2, fields) {
            if (err2) {
              return res.status(200).json({
                status: -1,
                message: err2
              })
            } else {
              return res.status(200).json({
                status: 0,
                message: "Deletion of Block Occured."
              })
            }
          })
        }
      })
    }
  })
app.route("/viewership")
  .put(function(req, res) {
    //viewership needs to be confirmed by both sides
    if (!req.query.sessionID || !req.query.userID || !req.query.viewerID || !req.query.posterID) {
      return res.status(200).json({
        status: -1,
        message: "Not Enough Information."
      })
    } else if ((req.query.userID !== req.query.viewerID) && (req.query.userID !== req.query.posterID)) {
      return res.status(200).json({
        status: -1,
        message: "Not Correctly Sent Information"
      })
    } else {
      var sQuery =
        `
      SELECT * FROM viewershipRequests WHERE
      (posterID = ? AND viewerID = ? AND initiatedBy = ?)
      `; //check that viewership has been initiated
      var variables = [];
      if (req.query.userID === req.query.viewerID) {
        variables = [req.query.posterID, req.query.viewerID, req.query.posterID];
      } else {
        variables = [req.query.posterID, req.query.viewerID, req.query.viewerID];
      }
      connection.query(cQuery + updateSessionQuery, [req.query.userID, req.query.sessionID,req.query.sessionID], function(err1, results1, fields) {
        if (err1) {
          return res.status(200).json({
            status: -1,
            message: err1
          })
        } else if (results1.length === 0) {
          return res.status(200).json({
            status: -11,
            message: "Not Valid Session"
          })
        } else {
          connection.query(sQuery, variables, function(err2, results2, fields) {
            if (err2) {
              return res.status(200).json({
                status: -1,
                message: err2
              })
            } else if (results2.length === 0) {
              //insertion
              var iQuery =
                `
              INSERT INTO viewershipRequests (posterID,viewerID,initiatedBy) values (?,?,?)
              `;
              connection.query(iQuery, [req.query.posterID, req.query.viewerID, req.query.userID], function(err3, results3, fields) {
                if (err3) {
                  return res.status(200).json({
                    status: -1,
                    message: err3
                  })
                } else {
                  return res.status(200).json({
                    status: 0,
                    message: "Viewership Request Inserted."
                  })
                }
              })
            } else {
              //insertion into viewer and delete request
              var iAnddQuery =
                `
              DELETE FROM viewershipRequests WHERE viewerID = ? AND posterID = ?;
              INSERT INTO viewers (viewerID,posterID) VALUES (?,?);
              `;
              connection.query(iAnddQuery, [req.query.viewerID, req.query.posterID, req.query.viewerID, req.query.posterID], function(err3, results3, fields3) {
                if (err3) {
                  return res.status(200).json({
                    status: -1,
                    message: err3
                  })
                } else {
                  return res.status(200).json({
                    status: 0,
                    message: "Deletion and Insertion Occurred."
                  })
                }
              })
            }
          })
        }
      })
    }
  })
  .patch(function(req, res) {
    //used to delete requests but not actual viewers
    var dQuery;
    var variables;
    if (!req.query.sessionID || !req.query.userID || !req.query.viewerID || !req.query.posterID) {
      return res.status(200).json({
        status: -1,
        message: "Not Enough Information."
      })
    } else if ((req.query.userID !== req.query.viewerID) && (req.query.userID !== req.query.posterID)) {
      return res.status(200).json({
        status: -1,
        message: "Not Correctly Sent Information"
      })
    } else {
      var dQuery =
        `
      DELETE FROM viewershipRequests
      WHERE req.query.posterID = ? AND req.query.viewerID = ? and initiatedBy = ?;
      `
      if (req.query.userID === req.query.viewerID) {
        variables = [];
      } else {
        variables = [];
      }
      connection.query(cQuery + updateSessionQuery, [req.query.userID, req.query.sessionID,req.query.sessionID], function(err1, results1, fields) {
        if (err1) {
          return res.status(200).json({
            status: -1,
            message: err1
          })
        } else if (results1.length === 0) {
          return res.status(200).json({
            status: -11,
            message: "Not Valid Session"
          })
        } else {
          connection.query(dQuery, variables, function(err2, results2, fields) {
            if (err2) {
              return res.status(200).json({
                status: -1,
                message: err2
              })
            } else {
              return res.status(200).json({
                status: 0,
                message: "Deletion of VIEWERSHIP REQUEST Occured."
              })
            }
          })
        }
      })
    }
  })
  .delete(function(req, res) {
    var dQuery =
      `
    DELETE from viewers WHERE posterID = ? AND viewerID = ?;
    `;
    if (!req.query.sessionID || !req.query.userID || !req.query.posterID || !req.query.viewerID) {
      return res.status(200).json({
        message: "Not Enough Information.",
        status: -1
      })
    } else {
      connection.query(cQuery + updateSessionQuery, [req.query.userID, req.query.sessionID,req.query.sessionID], function(err1, results1, fields) {
        if (err1) {
          return res.status(200).json({
            status: -1,
            message: err1
          })
        } else if (results1.length === 0) {
          return res.status(200).json({
            status: -11,
            message: "Not Valid Session"
          })
        } else {
          connection.query(dQuery, [req.query.posterID, req.query.viewerID], function(err2, results2, fields) {
            if (err2) {
              return res.status(200).json({
                status: -1,
                message: err2
              })
            } else {
              return res.status(200).json({
                status: 0,
                message: "Deletion of VIEWERSHIP Occured."
              })
            }
          })
        }
      })
    }
  })
app.route("/relationship")
  .get(function(req, res) {
    //Retrieve isBlocked and isViewer and isViewee
    if (!req.query.sessionID || !req.query.userID || !req.query.profileID) {
      return res.status(200).json({
        message: "Not Enough Data",
        status: -1
      })
    }
    var sQuery =
      `
    SELECT base.userID as userID, if(blockingThem.blockerID is null,'false','true') as blockingThem, if(blockingMe.blockedID is null,'false','true') as blockingMe,
    if(viewingThem.viewerID is null,'false','true') as viewingThem, if(viewingMe.viewerID is null,'false','true') as viewingMe,
    if (theirViewershipRequestToViewMe.posterID is null,'false','true') as theyHaveRequestedToViewMe,
    if (myViewershipRequestToViewMe.posterID is null,'false','true') as iHaveRequestedToViewMe,
    if (theirViewershipRequestToViewThem.posterID is null,'false','true') as theyHaveRequestedToViewThem,
    if (myViewershipRequestToViewThem.posterID is null,'false','true') as iHaveRequestedToViewThem
    FROM (select ? as userID) base LEFT JOIN
    (select * from blocked WHERE blockerID = ? and blockedID = ?) blockingThem
    ON base.userID = blockingThem.blockerID LEFT JOIN
    (select * from blocked WHERE blockerID = ? and blockedID = ?) blockingMe
    ON base.userID = blockingMe.blockedID LEFT JOIN
    (select * from viewers WHERE viewerID = ? AND posterID = ?) viewingThem
    ON viewingThem.viewerID = base.userID LEFT JOIN
    (select * from viewers WHERE posterID = ? AND viewerID = ?) viewingMe
    ON base.userID = viewingMe.posterID LEFT JOIN
    (select * from viewershipRequests WHERE posterID = ? AND viewerID = ? AND initiatedBy = ?) theirViewershipRequestToViewMe
    ON base.userID = theirViewershipRequestToViewMe.posterID LEFT JOIN
    (select * from viewershipRequests WHERE posterID = ? AND viewerID = ? AND initiatedBy = ?) myViewershipRequestToViewMe
    ON base.userID = myViewershipRequestToViewMe.posterID LEFT JOIN
    (select * from viewershipRequests WHERE posterID = ? AND viewerID = ? AND initiatedBy = ?) myViewershipRequestToViewThem
    ON base.userID = myViewershipRequestToViewThem.viewerID LEFT JOIN
    (select * from viewershipRequests WHERE posterID = ? AND viewerID = ? AND initiatedBy = ?) theirViewershipRequestToViewThem
    ON base.userID = theirViewershipRequestToViewThem.viewerID;
    `;
    var u = req.query.userID;
    var p = req.query.profileID;
    var variables = [u, u, p, p, u, u, p, u, p, u, p, p, u, p, u, p, u, u, p, u, p];
    connection.query(cQuery + updateSessionQuery, [req.query.userID, req.query.sessionID,req.query.sessionID], function(err1, results1, fields) {
      if (err1) {
        return res.status(200).json({
          status: -1,
          message: err1
        })
      } else if (results1.length === 0) {
        return res.status(200).json({
          status: -11,
          message: "Not Valid Session"
        })
      } else {
        connection.query(sQuery, variables, function(err2, results2, fields) {
          if (err2) {
            return res.status(200).json({
              status: -1,
              message: err2
            })
          } else {
            return res.status(200).json({
              status: 0,
              message: "Records Retrieved",
              blockingThem: results2[0].blockingThem,
              blockingMe: results2[0].blockingMe,
              viewingThem: results2[0].viewingThem,
              viewingMe: results2[0].viewingMe,
              theyHaveRequestedToViewMe: results2[0].theyHaveRequestedToViewMe,
              theyHaveRequestedToViewThem: results2[0].theyHaveRequestedToViewThem,
              iHaveRequestedToViewMe: results2[0].iHaveRequestedToViewMe,
              iHaveRequestedToViewThem: results2[0].iHaveRequestedToViewThem
            })
          }
        })
      }
    })
  })
app.route("/whosviewingme")
  .get(function(req, res) {
    var sQuery =
      `
    select viewerID,userName from viewers left join users on users.userID = viewers.viewerID WHERE viewers.posterID = ?;
    `;
    if (!req.query.sessionID || !req.query.userID) {
      return res.status(200).json({
        status: -1,
        message: "Not Enough Information."
      })
    }
    connection.query(cQuery + updateSessionQuery, [req.query.userID, req.query.sessionID,req.query.sessionID], function(err1, results1, fields) {
      if (err1) {
        return res.status(200).json({
          status: -1,
          message: err1
        })
      } else if (results1.length === 0) {
        return res.status(200).json({
          status: -11,
          message: "Not Valid Session"
        })
      } else {
        connection.query(sQuery, [req.query.userID], function(err2, results2, fields) {
          if (err2) {
            return res.status(200).json({
              status: -1,
              message: err2
            })
          } else {
            var listOfToView = [];
            for (let i = 0; i < results2.length; i++) {
              listOfToView.push({
                userID: results2[i].viewerID,
                username: results2[i].userName
              })
            }
            return res.status(200).json({
              status: 0,
              message: "Records Retrieved",
              listOfToView: listOfToView
            })
          }
        })
      }
    })
  })
app.route("/whoimviewing")
  .get(function(req, res) {
    var sQuery =
      `
    select posterID,userName from viewers left join users on users.userID = viewers.posterID WHERE viewers.viewerID = ?;
    `;
    if (!req.query.sessionID || !req.query.userID) {
      return res.status(200).json({
        status: -1,
        message: "Not Enough Information."
      })
    }
    connection.query(cQuery + updateSessionQuery, [req.query.userID, req.query.sessionID,req.query.sessionID], function(err1, results1, fields) {
      if (err1) {
        return res.status(200).json({
          status: -1,
          message: err1
        })
      } else if (results1.length === 0) {
        return res.status(200).json({
          status: -11,
          message: "Not Valid Session"
        })
      } else {
        connection.query(sQuery, [req.query.userID], function(err2, results2, fields) {
          if (err2) {
            return res.status(200).json({
              status: -1,
              message: err2
            })
          } else {
            var listOfToView = [];
            for (let i = 0; i < results2.length; i++) {
              listOfToView.push({
                userID: results2[i].posterID,
                username: results2[i].userName
              })
            }
            return res.status(200).json({
              status: 0,
              message: "Records Retrieved",
              listOfToView: listOfToView
            })
          }
        })
      }
    })
  })
app.route("/changeVisibility")
  .post(function(req, res) {
    if (!req.body.sessionID || !req.body.userID || !req.body.password || !req.body.email || !req.body.visibility) {
      return res.status(200).json({
        status: -1,
        message: "Not Enough Information."
      })
    } else {
      var cQuery2 = // check user
        `
      SELECT * FROM users WHERE email = ?;
      `;
      var uQuery = // update user and thier p
        `
      UPDATE users
      SET visibility = ?
      WHERE email = ?;
      `;
      connection.query(cQuery, [req.body.userID, req.body.sessionID], function(err1, results1, fields1) {
        if (err1) {
          return res.status(200).json({
            status: -1,
            message: err1
          })
        } else if (results1.length === 0) {
          return res.status(200).json({
            status: -11,
            message: "Not Valid Session"
          })
        } else {
          connection.query(cQuery2, [req.body.email], function(err2, results2, fields2) {
            if (err2) {
              return res.status(200).json({
                status: -1,
                message: err2
              })
            } else if (results2.length !== 1) {
              return res.status.json({
                status: -2,
                message: "Not Valid Username/Passcode Combo"
              })
            } else {
              bcrypt.compare(pswrd, resPass, function(err3, rresult) {
                if (err3) {
                  return res.status(200).json({
                    status: -1,
                    message: err3
                  })
                } else if (rresult) {
                  connection.query(uQuery, [req.body.visibility, req.qbody.email], function(err3, results3, fields3) {
                    if (err3) {
                      return res.status(200).json({
                        status: -1,
                        message: err3
                      })
                    } else {
                      return res.status(200).json({
                        status: 0,
                        message: "Account Hidden"
                      })
                    }
                  })
                } else {
                  return res.status(200).json({
                    status: -2,
                    message: "Not Valid Username/Passcode Combo"
                  })
                }
              })
            }
          })
        }
      })
    }
  })
app.route("/mylikedposts")
  .get(function(req, res) {
    if (!req.query.sessionID || !req.query.userID) {
      return res.status(200).json({
        status: -1,
        message: "Not Enough Information."
      })
    } else {
      var sQuery =
        `
      SELECT *
    	FROM (
    	select
    		posts.postID as postID, posts.userID as userID , users.userName as username,title, content, posts.visibility as postVisibility, users.visibility as userVisibility,viewerID, subDate
    		from posts
    		left join likes
    		ON likes.postID = posts.postID
    		left join users on users.userID = posts.userID
    		left join (select * from viewers WHERE viewerID = ?) viewers on users.userID = viewers.posterID
    		WHERE likes.userID = ?
    		order by subDate desc
        ) posts
        WHERE postVisibility != 'hidden' AND userVisibility != 'hidden'
       AND ((postVisibility != 'private'AND userVisibility != 'private') OR userID = ? OR viewerID is not null)
      order by subDate desc
      `;
      connection.query(cQuery + updateSessionQuery, [req.query.userID, req.query.sessionID,req.query.sessionID], function(err1, results1, fields1) {
        if (err1) {
          return res.status(200).json({
            status: -1,
            message: err1
          })
        } else if (results1.length === 0) {
          return res.status(200).json({
            status: -11,
            message: "Not Valid Session"
          })
        } else {
          connection.query(sQuery, [req.query.userID, req.query.userID, req.query.userID], function(err, results, fields) {
            if (err) {
              return res.status(200).json({
                message: err,
                status: -1
              })
            } else {
              var toPrep = [];
              for (let i = 0; i < results.length; i++) {
                toPrep.push({
                  title: results[i].title,
                  userID: results[i].userID,
                  content: results[i].content,
                  subDate: results[i].subDate,
                  username: results[i].username,
                  postID: results[i].postID,
                  postVisibility: results[i].postVisibility,
                  userVisibility: results[i].userVisibility
                })
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
  })
app.route("/mylikedcomments")
  .get(function(req, res) {
    if (!req.query.sessionID || !req.query.userID) {
      return res.status(200).json({
        status: -1,
        message: "Not Enough Information."
      })
    } else {
      var sQuery =
        `
      SELECT * FROM
      (
      select
      comments.commentID as commentID, comments.postID as postID, comments.userID as commenterID, comments.comments, comments.visibility as commentVisibility,
      posts.userID as posterID, comments.submissionDate as commentDate, title, content, posts.visibility as postVisibility,
      posts.subDate as postDate, users.userName as username, users.visibility as commenterVisibility,
      pusers.visibility as posterVisibility, viewers.viewerID as commentViewerID, viewerz.viewerID as postViewerID
      from comments
      left join posts on posts.postID = comments.postID
      left join users on users.userID = comments.userID
      left join users as pusers on pusers.userID = posts.userID
      left join (select * from viewers WHERE viewerID = ?) viewers on comments.userID = viewers.posterID
      left join (select * from viewers WHERE viewerID = ?) viewerz on posts.userID = viewers.posterID
      left join commentLikes on commentLikes.commentID = comments.commentID
      WHERE commentLikes.userID = 3
      order by submissionDate desc
      ) comments
      WHERE commentVisibility != 'hidden' AND postVisibility != 'hidden' AND commenterVisibility != 'hidden'
      AND ((commenterVisibility != 'private' AND commentVisibility != 'private') OR commentViewerID is not null OR commenterID = ?)
      AND ((posterVisibility != 'private' AND postVisibility != 'private') OR posterVisibility is not null OR posterID = ?)
      `;
      connection.query(cQuery + updateSessionQuery, [req.query.userID, req.query.sessionID,req.query.sessionID], function(err1, results1, fields1) {
        if (err1) {
          return res.status(200).json({
            status: -1,
            message: err1
          })
        } else if (results1.length === 0) {
          return res.status(200).json({
            status: -11,
            message: "Not Valid Session"
          })
        } else {
          connection.query(sQuery, [req.query.userID, req.query.userID, req.query.userID, req.query.userID], function(err, results, fields) {
            if (err) {
              return res.status(200).json({
                status: -1,
                message: err
              })
            } else {
              var toPrep = [];
              for (let i = 0; i < results.length; i++) {
                toPrep.push({
                  commentID: results[i].commentID,
                  commenterID: results[i].commenterID,
                  comments: results[i].comments,
                  commentVisibility: results[i].commentVisibility,
                  posterID: results[i].posterID,
                  commentDate: results[i].commentDate,
                  postDate: results[i].postDate,
                  commenterVisibility: results[i].commenterVisibility,
                  posterVisibility: results[i].posterVisibility,
                  commentViewerID: results[i].commentViewerID,
                  postViewerID: results[i].postViewerID,
                  title: results[i].title,
                  userID: results[i].userID,
                  content: results[i].content,
                  // subDate: results[i].subDate,
                  username: results[i].username,
                  postID: results[i].postID,
                  postVisibility: results[i].postVisibility,
                  userVisibility: results[i].userVisibility
                })
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
  })

app.listen(3001, function() {
  console.log("Server Started.")
});
