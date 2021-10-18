//Test Search Dates

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
  SELECT a.userID as userID, high, sessions.sessionID as sessionID, sessions.sessionDate as sessionDate,
  timeDuration, classification, if(bannedID is null,"false","true") isBanned FROM
  (select userID,max(sessionDate) as high from sessions group by userID) a
  RIGHT JOIN
  (
  Select * from sessions WHERE userID = ? AND sessionID = ? AND
  (timeduration = 'FOREVER' OR (timeduration = "HOUR" AND NOW() < date_add(sessionDate,Interval 1 Hour)))
  )
  sessions
  ON sessions.userID = a.userID AND sessions.sessionDate = a.high
  LEFT JOIN (SELECT userID, classification, bannedID FROM users LEFT JOIN bans on bannedID = userID) users ON users.userID = a.userID
  ;
`;
var updateSessionQuery =
  `
UPDATE sessions
SET sessionDate = NOW()
WHERE sessionID = ?
;
`;
function checkSessionQueries(userID,sessionID,followUpFunction){
  connection.query(cQuery + updateSessionQuery,[userID,sessionID,sessionID],function(err1,results1,fields1){
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
    } else if (results1[0].isBanned === "true"){
        return res.status(200).json({
          status: -69,
          message: "User is Banned."})
        }
    else{
      followUpFunction();
    }
  })
}
///////Actual Endpoints
// Get All Posts
app.get("/posts", function(req, res) {
  //works as intended currently
  var sQuery =
    `
  SELECT posts.postID as postID, posts.userID as userID, title, content, username, visibility, uvisibility as userVisibility,
  ifnull(total,0) as totalLikes, ifnull(tComments,0) as totalComments, subDate FROM
  ( SELECT * from posts
    LEFT JOIN
    (select userid as UID,username,visibility as uvisibility from users) uzers
    on uzers.UID = posts.userID
    WHERE posts.visibility = 'public'
    AND uzers.uvisibility = 'public'
    ORDER BY subDate DESC
    ) posts
    LEFT JOIN
  (SELECT count(*) as total, postID FROM likes GROUP BY postID) totalLikes
  on totalLikes.postID = posts.postID
  LEFT JOIN
  (
    select postID, count(*) as tComments from comments
    LEFT JOIN users on users.userID = comments.userID
    WHERE users.visibility = "public"
    AND comments.visibility = "public" GROUP BY postID
  ) comments
  ON comments.postID = posts.postID
  ORDER BY posts.subDate desc
  `
  var variables = [];
  if (req.query.userID && req.query.sessionID) {
    sQuery =
      `
      SELECT * FROM (
      SELECT posts.postID as postID, posts.userID as userID, posts.title as title, posts.content as content, posts.visibility as postVisibility, posts.subDate as postDate,
      users.userName as username, users.email as email, users.visibility as userVisibility, ifnull(tLikes,0) as totalLikes, if(isLiked.postID is null,"false","true") as Liked,
      ifnull(tComments,0) as totalComments, if(blockingThem.blockerID is null, "false","true") as amBlockingThem, if(blockingMe.blockedID is null,"false","true") as isBlockingMe,
      if(viewers.viewerID is null, "false","true") as isViewer, checkAdmin.classification as viewerClassification
      FROM posts LEFT JOIN users ON posts.userID = users.userID
      LEFT JOIN (select postID,count(*) as tLikes from likes GROUP BY postID) totalLikes ON totalLikes.postID = posts.postID -- totalLikes
      LEFT JOIN (select * FROM likes as Liked WHERE userID = ?) isLiked ON isLiked.postID = posts.postID -- isLiked
      LEFT JOIN (
        select postID, count(*) as tComments
        from comments LEFT JOIN users on users.userID = comments.userID
        LEFT JOIN (select * from viewers WHERE viewers.viewerID = ?) viewers on viewers.posterID = comments.userID
        LEFT JOIN (select * from blocked WHERE blockedID = ?) isBlockingMe on isBlockingMe.blockerID = comments.userID
        LEFT JOIN (select * from blocked WHERE blockerID = ?) amBlockingThem on amBlockingThem.blockedID = comments.userID,
        (select userID,classification from users WHERE userID = ?) classification
        WHERE (classification.classification = "admin")
        OR ((comments.visibility != "hidden" and  users.visibility != "hidden")
        AND (isBlockingMe.blockedID is null AND amBlockingThem.blockerID is null)
        AND ((comments.visibility != 'private' AND users.visibility != 'private')
        OR viewers.viewerID is not null)) GROUP BY postID
      ) comments ON comments.postID = posts.postID -- totalComments
      LEFT JOIN (select * from blocked WHERE blockerID = ?) blockingThem ON blockingThem.blockedID = posts.userID --  meblockingthem
      LEFT JOIN (select * from blocked where blockedID = ?) blockingMe on blockingMe.blockerID = posts.userID  -- themblockingme
      LEFT JOIN (select * from viewers WHERE viewerID = ?) viewers on viewers.posterID = posts.userID -- viewingThem
      , (select * from users WHERE userID = ?) checkAdmin) posts
      WHERE viewerClassification = "admin" OR ((amBlockingThem = "false" AND isBlockingMe = "false")
      AND userVisibility != "hidden" AND postVisibility != "hidden" AND ((isViewer = "true") OR (userVisibility != "private" OR postVisibility != "private" OR userID = ?)))
      Order BY postDate DESC
      `;
    variables.push(req.query.userID,req.query.userID,req.query.userID,req.query.userID,req.query.userID,req.query.userID,req.query.userID,req.query.userID,req.query.userID,req.query.userID);
    return checkSessionQueries(req.query.userID,req.query.sessionID,function(){
      connection.query(sQuery, variables, function(err, results, fields) {
        if (err) {
          return res.status(200).json({
            status: -1,
            message: err
          })
        } else if (results) {
          var toPrep = [];
          for (let i = 0; i < results.length; i++) {
            toPrep.push({
              title: results[i].title,
              userID: results[i].userID,
              content: results[i].content,
              subDate: results[i].postDate,
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
    })
  } else {
    connection.query(sQuery, variables, function(err, results, fields) {
      if (err) {
        return res.status(200).json({
          status: -1,
          message: err
        })
      } else if (results) {
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
  var sQuery = //works
    `
  select posts.postID as postID, title, content, subDate, uzers.username as username,
  totalLikes, tComments as totalComments
   from posts
  LEFT JOIN viewers ON
  viewers.posterID = posts.userID
  LEFT JOIN
  (select userid,username,visibility from users) uzers
  on uzers.userID = posts.userID
  LEFT JOIN (select postID, count(*) as totalLikes from likes group by postID) likes ON likes.postID = posts.postID
  LEFT JOIN (
    select postID, count(*) as tComments
    from comments LEFT JOIN users on users.userID = comments.userID
    LEFT JOIN (select * from viewers WHERE viewers.viewerID = ?) viewers on viewers.posterID = comments.userID
    LEFT JOIN (select * from blocked WHERE blockedID = ?) isBlockingMe on isBlockingMe.blockerID = comments.userID
    LEFT JOIN (select * from blocked WHERE blockerID = ?) amBlockingThem on amBlockingThem.blockedID = comments.userID,
    (select userID,classification from users WHERE userID = ?) classification
    WHERE (classification.classification = "admin")
    OR ((comments.visibility != "hidden" and  users.visibility != "hidden")
    AND (isBlockingMe.blockedID is null AND amBlockingThem.blockerID is null)
    AND ((comments.visibility != 'private' AND users.visibility != 'private')
    OR viewers.viewerID is not null)) GROUP BY postID
  ) comments ON comments.postID = posts.postID
  WHERE (viewers.viewerID = ? OR posts.userID = ?) AND uzers.visibility != 'hidden' AND posts.visibility != 'hidden'
  ORDER by subDate DESC
  ;
  `;
  return checkSessionQueries(req.query.userID,req.query.sessionID,function(){
    connection.query(sQuery, [req.query.userID, req.query.userID,req.query.userID, req.query.userID,req.query.userID, req.query.userID], function(err, results, fields) {
      if (err) {
        return res.status(200).json({
          status: -1,
          message: err
        })
      } else if (results) {
        var toPrep = [];
        for (let i = 0; i < results.length; i++) {
          toPrep.push({
            title: results[i].title,
            userID: results[i].userID,
            content: results[i].content,
            subDate: results[i].subDate,
            totalLikes: results[i].totalLikes,
            totalComments: results[i].totalComments,
            username: results[i].username
          });
        }
        return res.status(200).json({
          status: 0,
          message: "Request Received.",
          contents: toPrep
        })
      }
    })
  })
})
app.get("/search", function(req, res) {
  var title = req.query.title;
  var content = req.query.content;
  var dateIdentification = req.query.dI;
  var firstDate = req.query.bD;
  var secondDate = req.query.aD;
  var sdate = req.query.sDate;
  var username = req.query.username;
  var userID = req.query.userID;
  var sessionID = req.query.sessionID;
  if (!title && !content && !sdate && !username && !firstDate && !secondDate) {
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
  if (dateIdentification){ //FIX THIS: test new date routes
    if (dateIdentification === "before"){
      if (sdate){
        toJoinQuery.push('AND Date(subDate) <= ?')
        variables.push(sdate);
      }
    }else if (dateIdentification === "after"){
      if (sdate){
        toJoinQuery.push('AND Date(subDate) >= ?')
        variables.push(sdate);
      }
    }else if (dateIdentification === "oneDay"){
      if (sdate) {
        toJoinQuery.push(' AND DATE(subDate) = ?');
        variables.push(sdate);
      }
    }else if (dateIdentification === "range"){
      if (firstDate && secondDate){
        toJoinQuery.push(' AND DATE(subDate) <= ? AND Date(subDate) >= ?');
        variables.push(firstDate);
        variables.push(secondDate);
      }else if (firstDate){
        toJoinQuery.push(' AND DATE(subDate) >= ?');
        variables.push(firstDate);
      }else if (secondDate){
        toJoinQuery.push(' AND DATE(subDate) <= ?');
        variables.push(secondDate);
      }
    }
  }
  if (username) {
    toJoinQuery.push(" AND username = ?");
    variables.push(username);
  }
  if (sessionID && userID) {
  return checkSessionQueries(req.query.userID,req.query.sessionID,function(){
    var sQuery = //works
      `
      SELECT * FROM (
      SELECT posts.postID as postID, posts.userID as userID, posts.title as title, posts.content as content, posts.visibility as postVisibility, posts.subDate as postDate,
      users.userName as username, users.email as email, users.visibility as userVisibility, ifnull(tLikes,0) as totalLikes, if(isLiked.postID is null,"false","true") as Liked,
      ifnull(tComments,0) as totalComments, if(blockingThem.blockerID is null, "false","true") as amBlockingThem, if(blockingMe.blockedID is null,"false","true") as isBlockingMe,
      if(viewers.viewerID is null, "false","true") as isViewer, checkAdmin.classification as viewerClassification
      FROM posts LEFT JOIN users ON posts.userID = users.userID
      LEFT JOIN (select postID,count(*) as tLikes from likes GROUP BY postID) totalLikes ON totalLikes.postID = posts.postID -- totalLikes
      LEFT JOIN (select * FROM likes as Liked WHERE userID = ?) isLiked ON isLiked.postID = posts.postID -- isLiked
      LEFT JOIN (
        select postID, count(*) as tComments
        from comments LEFT JOIN users on users.userID = comments.userID
        LEFT JOIN (select * from viewers WHERE viewers.viewerID = ?) viewers on viewers.posterID = comments.userID
        LEFT JOIN (select * from blocked WHERE blockedID = ?) isBlockingMe on isBlockingMe.blockerID = comments.userID
        LEFT JOIN (select * from blocked WHERE blockerID = ?) amBlockingThem on amBlockingThem.blockedID = comments.userID,
        (select userID,classification from users WHERE userID = ?) classification
        WHERE (classification.classification = "admin")
        OR ((comments.visibility != "hidden" and  users.visibility != "hidden")
        AND (isBlockingMe.blockedID is null AND amBlockingThem.blockerID is null)
        AND ((comments.visibility != 'private' AND users.visibility != 'private')
        OR viewers.viewerID is not null)) GROUP BY postID
      ) comments ON comments.postID = posts.postID -- totalComments
      LEFT JOIN (select * from blocked WHERE blockerID = ?) blockingThem ON blockingThem.blockedID = posts.userID --  meblockingthem
      LEFT JOIN (select * from blocked where blockedID = ?) blockingMe on blockingMe.blockerID = posts.userID  -- themblockingme
      LEFT JOIN (select * from viewers WHERE viewerID = ?) viewers on viewers.posterID = posts.userID -- viewingThem
      , (select * from users WHERE userID = ?) checkAdmin) posts
      WHERE viewerClassification = "admin" OR (
        (amBlockingThem = "false" AND isBlockingMe = "false")
      AND userVisibility != "hidden" AND postVisibility != "hidden" AND (
        userID = ? OR (isViewer = "true") OR (userVisibility != "private" OR postVisibility != "private")))
    `;
    sQuery += toJoinQuery.join("") + "  Order BY postDate DESC";
    var stuff = [userID, userID,userID,userID,userID, userID, userID,userID,userID,userID].concat(variables);
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
              title: results[i].title,
              userID: results[i].userID,
              content: results[i].content,
              subDate: results[i].postDate,
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
        } else {
          return res.status(200).json({
            status: 1,
            message: "No values returned."
          })
        }
      }
    })
  })
  } else {
    var sQuery = //works
      `
    SELECT  posts.postID as postID, title, posts.userID as userID, content, subDate, uzers.username as username,
    ifnull(totalLikes,0) as totalLikes, totalComments
    from posts
    LEFT JOIN
    (select userid,username,visibility from users) uzers ON uzers.userID = posts.userID
    LEFT JOIN (select count(*) as totalLikes, postID from likes GROUP BY postID) likes ON likes.postID = posts.postID
    LEFT JOIN (
      select postID, count(*) as totalComments from comments
      LEFT JOIN users on users.userID = comments.userID
      WHERE users.visibility = "public"
      AND comments.visibility = "public" GROUP BY postID
    ) comments ON comments.postID = posts.postID
    WHERE posts.visibility = 'public'
    AND uzers.visibility = 'public'
    `;
    sQuery += toJoinQuery.join("") + " ORDER BY posts.subDate desc";
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
              username: results[i].username,
              totalLikes: results[i].totalLikes,
              totalComments: results[i].totalComments
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
  .get(function(req, res) { //FIX THIS CHECK ON public post with one private comment
    //Retrieve Amount of Likes and Comments
    if (!req.query.postID) {
      return res.status(200).json({
        status: -1,
        message: "Post ID Not Given."
      })
    } else if (req.query.userID && req.query.sessionID) {
    var sQuery =
      `
      SELECT * FROM (
      SELECT posts.postID as postID, posts.userID as userID, posts.title as title, posts.content as content, posts.visibility as postVisibility, posts.subDate as postDate,
      users.userName as username, users.email as email, users.visibility as userVisibility, ifnull(tLikes,0) as totalLikes, if(isLiked.postID is null,"false","true") as Liked,
      ifnull(tComments,0) as totalComments, if(blockingThem.blockerID is null, "false","true") as amBlockingThem, if(blockingMe.blockedID is null,"false","true") as isBlockingMe,
      if(viewers.viewerID is null, "false","true") as isViewer, checkAdmin.classification as viewerClassification
      FROM posts LEFT JOIN users ON posts.userID = users.userID
      LEFT JOIN (select postID,count(*) as tLikes from likes GROUP BY postID) totalLikes ON totalLikes.postID = posts.postID -- totalLikes
      LEFT JOIN (select * FROM likes as Liked WHERE userID = ?) isLiked ON isLiked.postID = posts.postID -- isLiked
      LEFT JOIN (
        select postID, count(*) as tComments
        from comments LEFT JOIN users on users.userID = comments.userID
        LEFT JOIN (select * from viewers WHERE viewers.viewerID = ?) viewers on viewers.posterID = comments.userID
        LEFT JOIN (select * from blocked WHERE blockedID = ?) isBlockingMe on isBlockingMe.blockerID = comments.userID
        LEFT JOIN (select * from blocked WHERE blockerID = ?) amBlockingThem on amBlockingThem.blockedID = comments.userID,
        (select userID,classification from users WHERE userID = ?) classification
        WHERE (classification.classification = "admin")
        OR ((comments.visibility != "hidden" and  users.visibility != "hidden")
        AND (isBlockingMe.blockedID is null AND amBlockingThem.blockerID is null)
        AND ((comments.visibility != 'private' AND users.visibility != 'private')
        OR viewers.viewerID is not null)) GROUP BY postID
      ) comments ON comments.postID = posts.postID -- totalComments
      LEFT JOIN (select * from blocked WHERE blockerID = ?) blockingThem ON blockingThem.blockedID = posts.userID --  meblockingthem
      LEFT JOIN (select * from blocked where blockedID = ?) blockingMe on blockingMe.blockerID = posts.userID  -- themblockingme
      LEFT JOIN (select * from viewers WHERE viewerID = ?) viewers on viewers.posterID = posts.userID -- viewingThem
      , (select * from users WHERE userID = ?) checkAdmin
      ) posts LEFT JOIN (SELECT * FROM
      (SELECT comments.commentID as commentID, postID as pyostID, comments.userID as commenterID, comments, comments.visibility as commentVisibility, submissionDate as commentDate,
      users.userName as commentername, users.visibility as commenterVisibility, ifnull(totalCommentLikes,0) as totalCommentLikes, if(commentLiked.commentID is null,"false","true") as commentLiked,
      if(meBlockingThem.blockerID is null,"false","true") as amBlockingCommenter, if(themBlockingMe.blockerID is null,"false","true") as CommenterBlockingMe,
      if(viewers.viewerID is null, "false","true") as isViewerCommenter, checkAdmin.classification as userClassification
      FROM comments LEFT JOIN users on comments.userID = users.userID
      LEFT JOIN (select commentID, count(*) as totalCommentLikes from commentLikes GROUP BY commentID) commentLikes on commentLikes.commentID = comments.commentID
      LEFT JOIN (select * from commentLikes WHERE userID = ?) commentLiked on commentLiked.commentID = comments.commentID
      LEFT JOIN (select * from blocked WHERE blockerID = ?) meBlockingThem on meBlockingThem.blockedID = comments.userID
      LEFT JOIN (select * from blocked WHERE blockedID = ?) themBlockingMe on themBlockingMe.blockerID = comments.userID
      LEFT JOIN (select * from viewers WHERE viewerID = ?) viewers on viewers.posterID = comments.userID -- viewingThem
      ,(select * from users WHERE userID = ?) checkAdmin
      ) comments WHERE userClassification = "admin"
      OR ((amBlockingCommenter = "false" AND commenterBlockingMe = "false")
      AND commenterVisibility != "hidden" AND commentVisibility != "hidden"
      AND ((isViewerCommenter = "true") OR (commenterVisibility != "private" OR commentVisibility != "private" OR commenterID = ?))
      )) comments on posts.postID = comments.pyostID
      WHERE postID = ? AND  (viewerClassification = "admin"
      OR ((amBlockingThem = "false" AND isBlockingMe = "false")
      AND userVisibility != "hidden" AND postVisibility != "hidden"
      AND ((isViewer = "true") OR (userVisibility != "private" OR postVisibility != "private" or userID = ?))
      )) ORDER BY commentDate DESC;
    `;
    return checkSessionQueries(req.query.userID,req.query.sessionID,function(){
      connection.query(sQuery, [req.query.userID,req.query.userID,req.query.userID,req.query.userID,req.query.userID,req.query.userID, req.query.userID, req.query.userID,req.query.userID,req.query.userID,req.query.userID,req.query.userID,req.query.userID, req.query.userID, req.query.userID, req.query.postID, req.query.userID], function(err, results, fields) {
        if (err) {
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
              if (results[i].commentID){
                toPrep.push({
                  commentID: results[i].commentID,
                  commenterID: results[i].commenterID,
                  commenterName: results[i].commentername,
                  comments: results[i].comments,
                  commentLikes: results[i].totalCommentLikes,
                  // commentVisibility: results[i].commentVisibility,
                  // commenterVisibility: results[i].commenterVisibility,
                  commentDate: results[i].commentDate,
                  commentLiked: results[i].commentLiked
                })
              }
            }
            return res.status(200).json({
              status: 0,
              message: "Here's your post!",
              postID: results[0].postID,
              authorID: results[0].userID,
              title: results[0].title,
              content: results[0].content,
              postVisibility: results[0].postVisibility,
              totalLikes: results[0].totalLikes,
              postDate: results[0].postDate,
              authorName: results[0].username,
              authorVisibility: results[0].userVisibility,
              likedPost: results[0].Liked,
              comments: toPrep
            })
          }
        }
      })
    })
    } else {
      var sQuery = //works
        `
        SELECT comments.commentID, posts.postID as postID, comments.userID as commenterID, comments, comments.visibility as commentVisibility,  users.userName as commenterName,
        users.visibility as commenterVisibility, ifnull(commentLikes,0) as commentLikes, comments.submissionDate as commentDate, ifnull(totalLikes,0) as totalLikes, uzers.userID as authorID, title,content,
        posts.visibility as postVisibility, posts.subDate as postDate, uzers.userName as authorName, uzers.visibility as authorVisibility FROM posts
        left join (
          select * from comments WHERE visibility = 'public'
        ) comments on posts.postID = comments.postID
        left join users on users.userID = comments.userID
        left join (select postID, count(*) as totalLikes from likes group by postID) totalLikes
        on totalLikes.postID = posts.postID
        left join (select * from users) uzers on uzers.userID = posts.userID
        left join (select count(*) as commentLikes, commentID from commentLikes group by commentID) commentLikes
        ON commentLikes.commentID = comments.commentID
        WHERE
        posts.postID = ? AND
        posts.visibility = 'public'
        ORDER BY comments.submissionDate DESC
      `;
      connection.query(sQuery, [req.query.postID], function(err, results, fields) {
        if (err) {
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
    if (!req.query.userID || !req.query.sessionID || !req.query.postID) {
      return res.status(200).json({
        status: -1,
        message: "Not Enough Information."
      })
    } else {
      return checkSessionQueries(req.query.userID,req.query.sessionID,function(){
        var checkAdminQuery =
        `
        SELECT * FROM users WHERE userID = ?;
        `
        var uQuery = `
        UPDATE posts
        SET visibility = "hidden"
        WHERE postID = ? AND (userID = ? OR ?);
        `;
        connection.query(checkAdminQuery,[req.query.userID],function(err4,results4,fields4){
          if (err4){
            return res.status(200).json({
              status: -1,
              message: err4
            })
          }
          else{
            var adminStatus = (results4.length === 1 && results4[0].classification === "admin" ? true : false);
            // console.log(req.query.postID,req.query.userID,adminStatus)
            connection.query(uQuery, [req.query.postID,req.query.userID, adminStatus], function(err, results, fields) {
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
                  })}}
            })}})})}})
  //Add Single POST
  .put(function(req, res) {
    var visibility = req.body.visibility;
    console.log(req.query);
    if (!req.body.userID || !req.body.sessionID) {
      console.log("Here we go: " + req.query.userID + " " + req.query.sessionID)
      return res.status(200).json({
        status: -1,
        message: "User Not Logged In."
      })
    } else {
      //query string has a max length of 2048 characters
      if (!req.body.title || !req.body.contents || !visibility) {
        return res.status(200).json({
          status: -1,
          message: "Not enough information provided."
        })
      } else {
        return checkSessionQueries(req.body.userID,req.body.sessionID,function(){
          var iQuery;
          var variables = [];
          iQuery =
            `
          INSERT INTO posts (userID,title,content,visibility,subDate) VALUES (?,?,?,?,NOW());
          SELECT LAST_INSERT_ID();
          `;
          variables = [req.body.userID, req.body.title, req.body.contents, visibility];
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
    return checkSessionQueries(req.query.userID,req.query.sessionID,function(){
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
          var variables = [];
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
    return checkSessionQueries(req.query.userID,req.query.sessionID,function(){
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
    return checkSessionQueries(req.query.userID,req.query.sessionID,function(){
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
    })
  })
app.route("/getPostsWithHashtag")
  .get(function(req, res) {
    if (!req.query.hashtag) {
      return res.status(200).json({
        message: "Not Enough Information.",
        status: -1
      })
    } else {
      if (req.query.userID && req.query.sessionID) {
        return checkSessionQueries(req.query.userID,req.query.sessionID,function(){
          var sQuery =
            `
          SELECT
          posts.postID as postID, posts.userID as userID,title,content, posts.visibility as postVisibility, subDate, users.userID as userID,
          userName as username, users.visibility as userVisibility, ifnull(likeAmount,0) as totalLikes, ifnull(commentAmount, 0) as totalComments,
          if(isLiked.userID is null,"false","true") as Liked, if(viewership.viewerID is null,'false','true') as isViewer
          FROM posts
          LEFT JOIN users ON users.userID = posts.userID
          LEFT JOIN (SELECT postID, count(*) as likeAmount FROM likes group by postID) as totalLikes ON posts.postID = totalLikes.postID
          LEFT JOIN (
            select postID, count(*) as commentAmount
            from comments LEFT JOIN users on users.userID = comments.userID
            LEFT JOIN (select * from viewers WHERE viewers.viewerID = ?) viewers on viewers.posterID = comments.userID
            LEFT JOIN (select * from blocked WHERE blockedID = ?) isBlockingMe on isBlockingMe.blockerID = comments.userID
            LEFT JOIN (select * from blocked WHERE blockerID = ?) amBlockingThem on amBlockingThem.blockedID = comments.userID,
            (select userID,classification from users WHERE userID = ?) classification
            WHERE (classification.classification = "admin")
            OR ((comments.visibility != "hidden" and  users.visibility != "hidden")
            AND (isBlockingMe.blockedID is null AND amBlockingThem.blockerID is null)
            AND ((comments.visibility != 'private' AND users.visibility != 'private')
            OR viewers.viewerID is not null)) GROUP BY postID
                    ) as totalComments ON totalComments.postID = posts.postID
          LEFT JOIN (SELECT postID, userID from likes WHERE userID = ?) isLiked ON isLiked.postID = posts.postID
          LEFT JOIN (SELECT * from viewers WHERE viewerID = ?) viewership on viewership.posterID = posts.userID
          LEFT JOIN (select * from blocked WHERE blockerID = ?) blockingThem ON blockingThem.blockedID = posts.userID --  meblockingthem
          LEFT JOIN (select * from blocked where blockedID = ?) blockingMe on blockingMe.blockerID = posts.userID  -- themblockingme
          , (SELECT * FROM users WHERE userID = ?) adminClassification
          WHERE
          (title LIKE ? OR content LIKE ?)
          AND
          adminClassification.classification = "admin"
          OR ( blockingMe.blockingID is null AND (posts.visibility != 'hidden' AND users.visibility != 'hidden'
          AND (posts.visibility != 'private' OR viewerID is not null)
          AND (users.visibility != 'private' OR viewerID is not null)))
          order by subDate DESC
          `;
          connection.query(sQuery, [req.query.userID,req.query.userID,req.query.userID,req.query.userID,req.query.userID,req.query.userID, req.query.userID,req.query.userID, req.query.userID, '%' + req.query.hashtag + "%", '%' + req.query.hashtag + "%"], function(err, results, fields) {
            if (err) {
              return res.status(200).json({
                status: -1,
                message: err
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
                  totalLikes: results[i].totalLikes,
                  totalComments: results[i].totalComments,
                  postID: results[i].postID,
                  Liked: results[i].Liked
                })
              }
              return res.status(200).json({
                status: 0,
                message: "Request Received.",
                contents: toPrep
              })
            }
          })
        })
      } else {
        var sQuery =
          `
        SELECT
        posts.postID as postID, posts.userID as userID,title,content, posts.visibility as postVisibility, subDate,
        users.userID as userID, userName as username, users.visibility as userVisibility,
        ifnull(likeAmount,0) as totalLikes, ifnull(commentAmount, 0) as totalComments
        FROM posts LEFT JOIN users ON users.userID = posts.userID
        LEFT JOIN (SELECT postID, count(*) as likeAmount FROM likes group by postID) as totalLikes ON posts.postID = totalLikes.postID
        LEFT JOIN (
          select postID, count(*) as tComments from comments
          LEFT JOIN users on users.userID = comments.userID
          WHERE users.visibility = "public"
          AND comments.visibility = "public" GROUP BY postID
                  ) as totalComments ON totalComments.postID = posts.postID
        WHERE title LIKE ? OR content LIKE ?
        AND posts.visibility != 'hidden'
        AND users.visibility != 'hidden'
        AND (posts.visibility != 'private')
        AND (users.visibility != 'private')
        order by subDate DESC
        `;
        connection.query(sQuery, ['%#' + req.query.hashtag + '%', '%#' + req.query.hashtag + '%'], function(err, results, fields) {
          if (err) {
            return res.status(200).json({
              status: -1,
              message: err
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
    var sQuery =
    `
    select users.userID as userID,userName,email,pswrd,visibility,
    classification, ifnull(preference,"light") as preference, if(bannedID is null, "false", "true") as banStatus
    from users left join darkModePrefs ON darkModePrefs.userID = users.userID
    left join bans ON bans.bannedID = users.userID
    WHERE email = ?
    `
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
              var sessionID = randomatic('Aa0', 20);
              if (results[0].visibility === "hidden") {
                return res.status(200).json({
                  status: -3,
                  message: "Hidden Account",
                  rememberMe: rememberMe,
                  userID: results[0].userID,
                  username: results[0].userName
                })
              } else if (results[0].banStatus === "banned"){
                return res.status(200).json({
                  status: -13,
                  message: "This user is banned."
                })
              }else {
                //Create a Session ID
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
                        sessionID: sessionID,
                        isAdmin: results[0].banStatus,
                        lightingMode: results[0].preference
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
                        sessionID: sessionID,
                        isAdmin: results[0].classification,
                        lightingMode: results[0].preference
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
  .post(function(req, res) {
    if (!req.body.userID) {
      return res.status(200).status(200).json({
        status: -1,
        message: "UserID Not Included."
      })
    } else {
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
      connection.query(iorUQuery, [req.body.userID, code, req.body.userID], function(err, results, fields) {
        if (err) {
          return res.status(200).json({
            status: -1,
            message: err
          })
        } else {
          var mailOptions = {
            from: process.env.EMAILUSER,
            to: results[1][0].email,
            subject: 'Reactivation Account Link',
            html: 'Your code is ' + code + '.'
          };
          transporter.sendMail(mailOptions, function(error, info) {
            if (error) {
              return res.status(200).json({
                status: 1,
                message: error
              })
            } else {
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
  .delete(function(req, res) {
    if (req.body.userID) {
      return res.status(200).status(200).json({
        status: -1,
        message: "UserID Not Included."
      })
    } else {
      // delete 6 digit code from database associated to userID
      var dQuery =
        `
      DELETE FROM reactivationCodes
      WHERE userID = ?;
      `;
      connection.query(dQuery, [req.body.userID], function(err, results, fields) {
        if (err) {
          return res.status(200).json({
            status: -1,
            message: err
          })
        } else {
          return res.status(200).json({
            status: 0,
            message: "Deletion Occurred."
          })
        }
      })
    }
  })
app.route("/checkReactivationCode")
  .post(function(req, res) {
    if (!req.body.userID || !req.body.reactivationCode || !req.body.rememberMe) {
      return res.status(200).json({
        status: -1,
        message: "Not Enough Information."
      })
    } else {
      var sQuery =
        `
      SELECT * FROM
      reactivationCodes
      WHERE userID = ? AND reactivationCode = ?;
      `;
      connection.query(sQuery, [req.body.userID, req.body.reactivationCOde], function(err, results, fields) {
        if (err) {
          return res.status(200).json({
            status: -1,
            message: err
          })
        } else if (results.length === 0) {
          return res.status(200).status({
            message: "Invalid Combination.",
            status: -2
          })
        } else {
          //create and insert session and update user visibility
          var sessionID = randomatic('Aa0', 20);
          var remembered = rememberMe === "hour" ? "HOUR" : "FOREVER";
          var megasQuery =
          `
          INSERT INTO sessions (sessionID,userID,sessionDate,timeDuration) VALUES (?,?,NOW(),?);
          UPDATE users SET visibility = 'private' WHERE userID = ?;
          SELECT users.userID as userID,userName,email,pswrd,visibility,
          classification, ifnull(preference,"light") as preference
          FROM users left join darkModePrefs ON darkModePrefs.userID = users.userID
          WHERE userID = ?;
          `
          connection.query(megasQuery,[sessionID,userID,remembered,userID,userID],function(err,results,fields){
            if (err){
              return res.status(200).json({
                status: -1,
                message: err
              })
            }else{
              return res.status(200).json({
                status: 0,
                message: "Worked...",
                sessionID: sessionID,
                isAdmin: results[0].classification,
                preference: results[-1].preference
              })
            }
          })
        }
      })
    }
  })
app.route("/forgotPassword")
  .post(function(req, res) {
    if (!req.body.email) {
      return res.status(200).json({
        status: -1,
        message: "Not Enough Information."
      })
    } else {
      //generate random code and insert
      var sQuery =
      `
      SELECT userID FROM users WHERE email = ?;
      `;
      connection.query(sQuery,[req.body.email],function(er1,re1,fie1){
        if (er1){
          return res.status(200).json({
            status: -1,
            message: er1
          })
        }
        else if (re1.length === 0){
          return res.status(200).json({
            message: "User Email Not Associated",
            status: -2
          })
        }else{
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
          connection.query(iorUQuery, [req.body.email, code, req.body.email], function(error, results, fields) {
            if (error) {
              return res.status(200).json({
                status: -1,
                message: error
              })
            } else {
              var mailOptions = {
                from: process.env.EMAILUSER,
                to: req.body.email,
                subject: 'Password Recovery Link',
                html: 'Your code is ' + code + '.'
              };
              transporter.sendMail(mailOptions, function(error, info) {
                if (error) {
                  console.log(error)
                  return res.status(200).json({
                    status: -1,
                    message: error
                  })
                } else {
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
    }
  })
app.route("/checkForgottenPassword")
  .post(function(req, res) {
    //will need to edit user
    if (!req.body.email || !req.body.fpCode) {
      return res.status(200).json({
        status: -1,
        message: "Not enough information."
      })
    } else {
      var sQuery =
        `
        SELECT * FROM
        forgottenPasswordCodes
        WHERE email = ? AND fpCode = ?;
        `
      connection.query(sQuery, [req.body.email, req.body.fpCode], function(err, results, fields) {
        if (err) {
          return res.status(200).json({
            status: -1,
            message: err
          })
        } else if (results.length === 0) {
          return res.status(200).status({
            message: "Invalid Combination.",
            status: -2
          })
        } else {
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
      AND users.visibility = 'public'
      AND comments.visibility = 'public'
      ;
      `;
      var sQuery2 =
        `
      select posts.postID as postID,posts.userID as userID, title, content, posts.visibility, posts.subDate, users.userName as username,
      users.visibility as userVisibility,ifnull(totalLikes,0) as totalLikes, ifnull(totalComments,0) as totalComments from posts
      LEFT JOIN users ON users.userID = posts.userID
      LEFT JOIN (
        select postID, count(*) as totalComments from comments
        LEFT JOIN users on users.userID = comments.userID
        WHERE users.visibility = "public"
        AND comments.visibility = "public" GROUP BY postID
                ) totalComments ON totalComments.postID = posts.postID
      LEFT JOIN (select postID,count(*) as totalLikes from likes group by postID) totalLikes ON totalLikes.postID = posts.postID
       WHERE users.userID = ?
      AND users.visibility = 'public'
      AND posts.visibility = 'public'
      ;
      `;
      var sQuery =
        `
      SELECT userID,username as username, visibility FROM users WHERE users.userID = ? AND users.visibility = 'public';
      `;
      connection.query(sQuery, [profileID], function(err, results, fields) {
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
      ifnull(totalLikes,0) as totalLikes, ifnull(totalComments,0) as totalComments, if(isLiked.userID is null,"false","true") as Liked from posts
      LEFT JOIN users ON users.userID = posts.userID
      LEFT JOIN (select * from viewers where viewers.viewerID = ?) viewers ON users.userID = viewers.posterID
      LEFT JOIN (
        select postID, count(*) as totalComments
        from comments LEFT JOIN users on users.userID = comments.userID
        LEFT JOIN (select * from viewers WHERE viewers.viewerID = ?) viewers on viewers.posterID = comments.userID
        LEFT JOIN (select * from blocked WHERE blockedID = ?) isBlockingMe on isBlockingMe.blockerID = comments.userID
        LEFT JOIN (select * from blocked WHERE blockerID = ?) amBlockingThem on amBlockingThem.blockedID = comments.userID,
        (select userID,classification from users WHERE userID = ?) classification
        WHERE (classification.classification = "admin")
        OR ((comments.visibility != "hidden" and  users.visibility != "hidden")
        AND (isBlockingMe.blockedID is null AND amBlockingThem.blockerID is null)
        AND ((comments.visibility != 'private' AND users.visibility != 'private')
        OR viewers.viewerID is not null)) GROUP BY postID
                ) totalComments ON totalComments.postID = posts.postID
      LEFT JOIN (select postID,count(*) as totalLikes from likes group by postID) totalLikes ON totalLikes.postID = posts.postID
      LEFT JOIN (select * from likes WHERE userID = ?) isLiked ON isLiked.postID = posts.postID
      LEFT JOIN (select * from blocked WHERE blockerID = ?) meBlockingUser ON meBlockingUser.blockedID = posts.userID
      LEFT JOIN (select * from blocked WHERE blockedID = ?) userBlockingMe ON userBlockingMe.blockerID = posts.userID
      ,(select * from users WHERE userID = ?) adminClass
      WHERE users.userID = ?
      AND ( adminClass.classification = "admin" OR
	  (meBlockingUser.blockerID is null AND userBlockingMe.blockedID is null AND
      users.visibility != 'hidden' AND posts.visibility != 'hidden'
      AND ((users.visibility != 'private' AND posts.visibility != 'private') OR users.userID = ? or viewers.viewerID is not null)));
      `; //getPosts
      var sQuery2 =
        `
      select comments.commentID as commentID,comments.postID as postID,comments.userID as userID,comments.comments as comments,comments.visibility as commentVisibility,
      comments.submissionDate as submissionDate, users.userName as userName, users.visibility as userVisibility, ifnull(totalLikes,0) as totalLikes,
      if(isLiked.userID is null,"false","true") as Liked
      from comments LEFT JOIN users ON users.userID = comments.userID
      LEFT JOIN (select * from viewers where viewers.viewerID = ?) viewers ON users.userID = viewers.posterID
      LEFT JOIN (select commentID,count(*) as totalLikes from commentLikes group by commentID) totalLikes ON totalLikes.commentID = comments.commentID
      LEFT JOIN (select * from commentLikes WHERE userID = ?) isLiked ON isLiked.commentID = comments.commentID
      LEFT JOIN (select * from blocked WHERE blockerID = ?) meBlockingUser ON meBlockingUser.blockedID = comments.userID
      LEFT JOIN (select * from blocked WHERE blockedID = ?) userBlockingMe ON userBlockingMe.blockerID = comments.userID
      , (select * from users WHERE userID = ?) checkAdmin
      WHERE users.userID = ? AND (checkAdmin.classification = 'admin'
      OR (meBlockingUser.blockerID is null AND userBlockingMe.blockedID is null AND
      users.visibility != 'hidden' AND comments.visibility != 'hidden'
      AND ((comments.visibility != 'private' AND users.visibility != 'private') OR users.userID = ? or viewers.viewerID = ?)))
      ;
      `; //getComments
      var sQuery =
        `
      SELECT users.userID as userID,users.userName as userName, users.visibility as visibility,
      if(meBlockingUser.blockerID is null, 'false','true') as blockingMe,
      if(userBlockingMe.blockedID is null, 'false', 'true') as blockingThem,
      adminClass.classification as classification
      FROM users
      LEFT JOIN (select * from viewers WHERE viewerID = ?) viewership ON viewership.posterID = users.userID
      LEFT JOIN (select * from blocked WHERE blockedID = ?) userBlockingMe ON userBlockingMe.blockerID = users.userID
      LEFT JOIN (select * from blocked WHERE blockerID = ?) meBlockingUser ON meBlockingUser.blockedID = users.userID
      , (select * from users WHERE userID = ?) adminClass
      WHERE users.userID = ?
      AND (adminClass.classification = "admin"
      OR (users.visibility != 'hidden' AND
      ` +
      // (userBlockingMe.blockedID is null AND meBlockingUser.blockerID is null) AND
      `
      (users.visibility != 'private' OR users.userID = ? OR viewership.posterID is not null)));
      `; //getUser
      return checkSessionQueries(req.query.userID,req.query.sessionID,function(){
        connection.query(sQuery, [userID,userID,userID,userID,profileID,userID], function(err1, results1, fields1) {
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
            connection.query(sQuery1, [userID,userID,userID,userID,userID, userID,userID,userID,userID, profileID, userID], function(err2, results2, fields2) {
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
                    Liked: res2.Liked
                  })
                }
                connection.query(sQuery2, [userID, userID,userID,userID, userID, profileID, userID, userID], function(err3, results3, fields3) {
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
                      posts: listOfPosts,
                      blockingUser: results1[0].blockingThem,
                      blockingMe: results1[0].blockingMe
                    })
                  }
                })
              }
            })
          }
        })
      })
    }
  })
  .patch(function(req, res) { //Edit User Info
    if ((!req.body.email && !req.body.userID) || (!req.body.visibility) && (!req.body.userName) || (!req.body.pswrd)) {
      return res.status(200).json({
        status: -1,
        message: "Not enough information."
      })
    } else {
      var uQueryFragment =
        `
      UPDATE users
      SET
      `
      var fragments = [];
      var variables = [];
      if (req.body.visibility) {
        fragments.push('visibility = ?');
        variables.push(req.body.visibility);
      }
      if (req.body.userName) {
        fragments.push('userName = ?');
        variables.push(req.body.userName);
      }
      if (req.body.pswrd) {
        fragments.push('pswrd = ?');
        variables.push(req.body.pswrd);
      }
      var finalFragment;
      if (req.body.email) {
        finalFragment = " WHERE email = ?;"
        variables.push(req.body.email);
      } else {
        finalFragment = " WHERE userID = ?;"
        variables.push(req.body.userID);
      }
      var finalQuery = uQueryFragment + fragments.join(",") + finalFragment;
      connection.query(finalQuery, variables, function(err, results, fields) {
        if (err) {
          return res.status(200).json({
            message: err,
            status: -1
          })
        } else {
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
        //can pull not friendly private comments //FIX QUERY - NEEDS LIKE AMOUNT
        var sQuery =
          `
        select commentID, comments.postID as postID, comments, comments.userID as commenterID, comments.visibility as commentVisibility, comments.submissionDate as commentDate, uzers.username as commenterUsername
        , uzers.visibility as commenterVisibility, ucers.userID as authorID, title, content, posts.visibility as postVisibility, subDate as postDate, ucers.username as posterUsername, ucers.visibility as posterVisibility
        ifnull(totalCommentLikes,0) as totalCommentLikes
        ifnull(tComments,0) as totalComments
        ifnull(totalPostLikes,0) as totalPostLikes
        from comments LEFT JOIN (select userID,username,visibility from users) uzers
        on uzers.userID = comments.userID LEFT JOIN posts ON comments.postID = posts.postID
        LEFT JOIN (select userID, username,visibility from users) ucers
        LEFT JOIN (select commentID, count(*) as totalCommentLikes from commentLikes GROUP BY commentID) totalCommentLikes on totalCommentLikes
        LEFT JOIN (select count(*),postID from likes group by postID) totalPostLikes on totalPostLikes.postID = posts.postID
        LEFT JOIN (
          select postID, count(*) as tComments from comments
          LEFT JOIN users on users.userID = comments.userID
          WHERE users.visibility = "public"
          AND comments.visibility = "public" GROUP BY postID
        ) totalPostComments on totalPostComments.postID = posts.postID
        ON posts.userID = ucers.userID
        WHERE comments.visibility = 'public'
        AND posts.visibility = 'public'
        AND ucers.visibility = 'public'
        AND uzers.visibility = 'public'
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
            results = result[0];
            return res.status(200).json({
              status: 0,
              message: "Here's your comment.",
              comment: results.comments,
              commentID: results.commentID,
              commenterID: results.commenterID,
              totalCommentLikes: results.totalCommentLikes,
              totalPostLikes: results.totalPostLikes,
              totalComments: results.totalComments,
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
        return checkSessionQueries(req.query.userID,req.query.sessionID,function(){
          var sQuery =
            `
            select comments.commentID as commentID, comments.postID as postID, comments.userID as commenterID, comments, comments.visibility as commentVisibility, comments.submissionDate as commentDate, uzers.username as commenterUsername
            , uzers.visibility as commenterVisibility, ucers.userID as authorID, title, content, posts.visibility as postVisibility, subDate as postDate, ucers.username as posterUsername, ucers.visibility as posterVisibility
            ,if (isLiked.userID is null, "false","true") as postLiked
            ,if (commentLiked.userID is null,"false","true") as commentLiked,
            ifnull(totalCommentLikes,0) as totalCommentLikes
            ifnull(tComments,0) as totalComments
            ifnull(totalPostLikes,0) as totalPostLikes
            from comments LEFT JOIN (select userID,username,visibility from users) uzers -- commentUsers
            on uzers.userID = comments.userID LEFT JOIN posts ON comments.postID = posts.postID
            LEFT JOIN (select count(*),postID from likes group by postID) totalPostLikes on totalPostLikes.postID = posts.postID
            LEFT JOIN (
              select postID, count(*) as tComments
              from comments LEFT JOIN users on users.userID = comments.userID
              LEFT JOIN (select * from viewers WHERE viewers.viewerID = ?) viewers on viewers.posterID = comments.userID
              LEFT JOIN (select * from blocked WHERE blockedID = ?) isBlockingMe on isBlockingMe.blockerID = comments.userID
              LEFT JOIN (select * from blocked WHERE blockerID = ?) amBlockingThem on amBlockingThem.blockedID = comments.userID,
              (select userID,classification from users WHERE userID = ?) classification
              WHERE (classification.classification = "admin")
              OR ((comments.visibility != "hidden" and  users.visibility != "hidden")
              AND (isBlockingMe.blockedID is null AND amBlockingThem.blockerID is null)
              AND ((comments.visibility != 'private' AND users.visibility != 'private')
              OR viewers.viewerID is not null)) GROUP BY postID
            ) totalPostComments on totalPostComments.postID = posts.postID
            LEFT JOIN (select userID, username,visibility from users) ucers -- postUsers
            ON posts.userID = ucers.userID
            LEFT JOIN (select * from viewers) commenterViewer
            ON commenterViewer.posterID = ucers.userID
            LEFT JOIN (select * from viewers) postViewer
            ON postViewer.posterID = uzers.userID
            LEFT JOIN (select * from likes WHERE userID = ?) isLiked -- variable
            ON isLiked.postID = posts.postID
            LEFT JOIN (SELECT * FROM commentLikes WHERE userID = ?) commentLiked
            on commentLiked.commentID = comments.commentID
            LEFT JOIN (select * from blocked WHERE blockedID = ?) commenterBlockingMe on comments.userID = commenterBlockingMe.blockerID
            LEFT JOIN (select * from blocked WHERE blockerID = ?) MeBlockingCommenter on comments.userID = commenterBlockingMe.blockedID
            LEFT JOIN (select * from blocked WHERE blockedID = ?) posterBlockingMe on posts.userID = posterBlockingMe.blockerID
            LEFT JOIN (select * from blocked WHERE blockerID = ?) MeBlockingPoster on posts.userID = meBlockingPoster.blockedID
            LEFT JOIN (select commentID, count(*) as totalCommentLikes from commentLikes GROUP BY commentID) totalCommentLikes on totalCommentLikes
            ,(select userID, classification from users WHERE userID = ?) checkAdmin
            WHERE
            checkAdmin.classification = "admin" OR
            (
            commenterBlockingMe.blockedID is null
            AND posterBlockingMe.blockedID is null
            AND meBlockingPoster.blockerID is null
            AND meBlockingCommenter.blockerID is null
            AND comments.visibility != 'hidden'
            AND posts.visibility != 'hidden'
            AND ucers.visibility != 'hidden'
            AND uzers.visibility != 'hidden'
            AND (comments.visibility != 'private' OR commenterViewer.viewerID = ? or comments.userID = ?)
            AND (posts.visibility != 'private' OR postViewer.viewerID = ? OR posts.userID  = ?)
            AND (ucers.visibility != 'private' or commenterViewer.viewerID = ? OR comments.userID = ?)
            AND (uzers.visibility != 'private' or postViewer.viewerID = ? OR posts.userID  = ?)
            )
            AND comments.commentID = ?
          `;
          connection.query(sQuery, [userID, userID, userID, userID, userID, userID, userID, userID, userID, userID,
                                    userID, userID, userID, userID, userID, userID, userID, userID, userID, commentID], function(err2, results2, fields) {
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
                totalCommentLikes: results.totalCommentLikes,
                totalPostLikes: results.totalPostLikes,
                totalComments: results.totalComments,
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
        })
      }
    }
  })
  .patch(function(req, res) {
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
    return checkSessionQueries(req.query.userID,req.query.sessionID,function(){
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
      connection.query("UPDATE COMMENTS SET " + updateStrings.join(",") + "WHERE commentID = ? AND userID = ?", variables, function(err, results, fields) {
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
    return checkSessionQueries(req.query.userID,req.query.sessionID,function(){
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
    WHERE commentID = ? AND (userID = ? OR ? );
    `;
    return checkSessionQueries(req.query.userID,req.query.sessionID,function(){
      var checkAdminQuery =
      `
      SELECT * FROM users WHERE userID = ?;
      `
      connection.query(checkAdminQuery,[req.query.userID],function(erre,resultsr,fieldsf){
        if (erre){
          return res.status(200).json({
            status: -1,
            message: erre
          })
        }
        else if (resultsr.length !== 1){
          return res.status(200).json({
            message: "Invalid UserID",
            status: -1
          })
        }else{
          connection.query(eQuery, [req.query.commentID,req.query.userID, (resultsr[0].classification === "admin" ? true : false)], function(err2, results2, fields) {
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
    return checkSessionQueries(req.query.userID,req.query.sessionID,function(){
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
    return checkSessionQueries(req.query.userID,req.query.sessionID,function(){
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
      return checkSessionQueries(req.query.userID,req.query.sessionID,function(){
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
      return checkSessionQueries(req.query.userID,req.query.sessionID,function(){
        connection.query(iQuery, [req.query.blockedID, req.query.userID, req.query.blockedID, req.query.userID, req.query.userID, req.query.blockedID], function(err2, results2, fields) {
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
      return checkSessionQueries(req.query.userID,req.query.sessionID,function(){
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
      return checkSessionQueries(req.query.userID,req.query.sessionID,function(){
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
      WHERE posterID = ? AND viewerID = ?;
      `
      return checkSessionQueries(req.query.userID,req.query.sessionID,function(){
        connection.query(dQuery, [req.query.posterID,req.query.viewerID], function(err2, results2, fields) {
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
      return checkSessionQueries(req.query.userID,req.query.sessionID,function(){
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
    if (myViewershipRequestToViewThem.posterID is null,'false','true') as iHaveRequestedToViewThem,
    if (bannedID is null, "false", "true") as isBanned,
    class.classification as classification
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
    ON base.userID = theirViewershipRequestToViewThem.viewerID LEFT JOIN
    bans ON bannedID = base.userID LEFT join
    (SELECT userID, classification FROM users) class ON class.userID = base.userID;
    `;
    var u = req.query.userID;
    var p = req.query.profileID;
    var variables = [u, u, p, p, u, u, p, u, p, u, p, p, u, p, u, p, u, u, p, u, p];
    return checkSessionQueries(req.query.userID,req.query.sessionID,function(){
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
            iHaveRequestedToViewThem: results2[0].iHaveRequestedToViewThem,
            isBanned: results2[0].isBanned,
            classification: results2[0].classification
          })
        }
      })
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
    return checkSessionQueries(req.query.userID,req.query.sessionID,function(){
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
    return checkSessionQueries(req.query.userID,req.query.sessionID,function(){
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
      return checkSessionQueries(req.body.userID,req.body.sessionID,function(){
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
      var sQuery = //totalLikes, totalCOmments, isBlocked
        `
      SELECT *
    	FROM (
    	  select posts.postID as postID, posts.userID as userID , users.userName as username,title, content, posts.visibility as postVisibility,
        users.visibility as userVisibility,viewerID, subDate,
        if(isBlockingMe.blockerID is null, "false", "true") isBlockingMe, if(amBlockingThem.blockedID is null, "false", "true") as amBlockingThem,
        totalLikes.tLikes as totalLikes, totalComments.tComments as totalComments, userClass.classification as classification
    		from posts left join likes ON likes.postID = posts.postID
    		left join users on users.userID = posts.userID
    		left join (select * from viewers WHERE viewerID = ?) viewers on users.userID = viewers.posterID
        left join (SELECT * FROM blocked WHERE blockedID = ?) isBlockingMe ON isBlockingMe.blockerID = posts.userID
        left JOIN (SELECT * FROM blocked WHERE blockedID = ?) amBlockingThem ON amBlockingThem.blockedID = posts.userID
        left JOIN (SELECT postID,count(*) as tLikes from likes GROUP BY postID) totalLikes ON totalLikes.postID = posts.postID
        left join (
          select postID, count(*) as tComments
          from comments LEFT JOIN users on users.userID = comments.userID
          LEFT JOIN (select * from viewers WHERE viewers.viewerID = ?) viewers on viewers.posterID = comments.userID
          LEFT JOIN (select * from blocked WHERE blockedID = ?) isBlockingMe on isBlockingMe.blockerID = comments.userID
          LEFT JOIN (select * from blocked WHERE blockerID = ?) amBlockingThem on amBlockingThem.blockedID = comments.userID,
          (select userID,classification from users WHERE userID = ?) classification
          WHERE (classification.classification = "admin")
          OR ((comments.visibility != "hidden" and  users.visibility != "hidden")
          AND (isBlockingMe.blockedID is null AND amBlockingThem.blockerID is null)
          AND ((comments.visibility != 'private' AND users.visibility != 'private')
          OR viewers.viewerID is not null)) GROUP BY postID
                  ) totalComments ON totalComments.postID = posts.postID,
        (select userID,classification from users WHERE userID = ?) userClass
    		WHERE likes.userID = ?
    		order by subDate desc
        ) posts
        WHERE postVisibility != 'hidden' AND userVisibility != 'hidden'
       AND ((postVisibility != 'private'AND userVisibility != 'private') OR userID = ? OR viewerID is not null)
      order by subDate desc
      `;
      return checkSessionQueries(req.query.userID,req.query.sessionID,function(){
        connection.query(sQuery, [req.query.userID, req.query.userID, req.query.userID,req.query.userID, req.query.userID, req.query.userID,req.query.userID, req.query.userID, req.query.userID,req.query.userID], function(err, results, fields) {
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
                userVisibility: results[i].userVisibility,
                totalLikes: results[i].totalLikes,
                totalComments: results[i].totalComments
              })
            }
            return res.status(200).json({
              status: 0,
              message: "Request Received.",
              contents: toPrep
            })
          }
        })
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
      pusers.visibility as posterVisibility, viewers.viewerID as commentViewerID, viewerz.viewerID as postViewerID,
      if(amBlockingThem.blockerID is null, 'false','true') as amBlockingThem,
      if(isBlockingMe.blockedID is null, 'false', 'true') as isBlockingMe,
      ifnull(totalLikes,0) as totalLikes,
      classification.classification as classification
      from comments
      left join posts on posts.postID = comments.postID
      left join users on users.userID = comments.userID
      left join users as pusers on pusers.userID = posts.userID
      left join (select * from viewers WHERE viewerID = ?) viewers on comments.userID = viewers.posterID
      left join (select * from viewers WHERE viewerID = ?) viewerz on posts.userID = viewers.posterID
      left join commentLikes on commentLikes.commentID = comments.commentID
      left join (select * from blocked WHERE blockerID = ?) amBlockingThem ON amBlockingThem.blockedID = comments.userID
      left join (select * from blocked WHERE blockedID = ?) isBlockingMe ON isBlockingMe.blockerID = comments.userID
      left join (select commentID, count(*) as totalLikes from commentLikes group by commentID) totalCommentLikes on totalCommentLikes.commentID = comments.commentID,
      (select * from users WHERE userID = ?) classification
      WHERE commentLikes.userID = ?
      order by submissionDate desc
      ) comments
      WHERE (classification = 'admin')
      OR (
      (amBlockingThem  = 'false' AND isBlockingMe = 'false') AND
      commentVisibility != 'hidden' AND postVisibility != 'hidden' AND commenterVisibility != 'hidden'
      AND ((commenterVisibility != 'private' AND commentVisibility != 'private') OR commentViewerID is not null OR commenterID = ?)
      AND ((posterVisibility != 'private' AND postVisibility != 'private') OR posterVisibility is not null OR posterID = ?)
      )
      `;
      return checkSessionQueries(req.query.userID,req.query.sessionID,function(){
        connection.query(sQuery, [req.query.userID, req.query.userID, req.query.userID, req.query.userID,req.query.userID,req.query.userID,req.query.userID,req.query.userID], function(err, results, fields) {
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
                commentLikes: results[i].totalLikes,
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
      })
    }
  })
app.route("/setLightingPreference")
  .post(function(req, res) {
    if (!req.body.userID || !req.body.sessionID || !req.body.lighting) {
      return res.status(200).json({
        message: "Not Enough Information",
        status: -1
      })
    } else {
      return checkSessionQueries(req.body.userID,req.body.sessionID,function(){
        var iorUQuery =
          `
        INSERT INTO darkModePrefs
          (userID,preference)
        values
          (?,?)
        ON DUPLICATE KEY UPDATE
          userID = VALUES(userID),
          preference = VALUES(preference),
        `;
        connection.query(iorUQuery, [req.body.userID, req.body.lighting], function(err, results, fields) {
          if (err) {
            return res.status(200).json({
              status: -1,
              message: err
            })
          } else {
            return res.status(200).json({
              status: 0,
              message: "Insert/Update Occurred"
            })
          }
        })
      })
    }
  })
app.route("/isthisuserbanned")
  .get(function(req,res){
    if (!req.query.userID){
      return res.status(200).json({
        status: -1,
        message: "Not Enough Information"
      })
    }
    else{
      var sQuery =
      `
      SELECT * FROM bans WHERE userID = ?;
      `;
      connection.query(sQuery,[req.query.userID],function(err,results,fields){
        if (err){
          return res.status(200).json({
            message: err,
            status: -1
          })
        }
        else{
          if (results.length === 0){
            return res.status(200).json({
              status: -2,
              message: "User Not Banned."
            })
          }else{
            return res.status(200).json({
              status: 0,
              message: "User is Banned."
            })
          }
        }
      })
    }
  })
//ADMIN: Ban User
app.route("/banUser")
  .post(function(req,res){
    if (!req.body.userID || !req.body.sessionID || !req.body.profileID){
      return res.status(200).json({
        status: -1,
        message: "Not Enough Information..."
      })
    }
    else{
      return checkSessionQueries(req.body.userID,req.body.sessionID,function(){
        if (results1[0].classification === "admin"){
          var iQuery =
          `INSERT INTO bans
          SELECT userID FROM users
          WHERE userID = ? AND classification != "admin"`;
          connection.query(iQuery,[req.query.profileID],function(err,results,fields){
            if (err){
              return res.status(200).json({
                status: 0,
                message: "User Banned."
              })
            }else{
              return res.status(200).json({
                status: 0,
                message: "User Banned."
              })
            }
          })
        }else{
          return res.status(200).json({
            status: -1,
            message: "Not Enough Permissions."
          })
        }
      })
    }
  })
  .delete(function(req,res){
    if (!req.body.userID || !req.body.sessionID || !req.body.profileID){
      return res.status(200).json({
        status: -1,
        message: "Not Enough Information..."
      })
    }
    else{
      return checkSessionQueries(req.body.userID,req.body.sessionID,function(){
        if (results1[0].classification === "admin"){
          var dQuery =
          `DELETE FROM bans WHERE bannedID = ?`;
          connection.query(dQuery,[req.query.profileID],function(err,results,fields){
            if (err){
              return res.status(200).json({
                status: 0,
                message: "User Unbanned."
              })
            }else{
              return res.status(200).json({
                status: 0,
                message: "User Unbanned."
              })
            }
          })
        }else{
          return res.status(200).json({
            status: -1,
            message: "Not Enough Permissions."
          })
        }
      })
    }
  })
app.listen(3001, function() {
  console.log("Server Started.")
});
