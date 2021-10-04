use quickiePostsDB;



      select posts.postID,posts.userID as userID, title, content, posts.visibility, posts.subDate, users.userName as username, users.visibility as userVisibility,
      ifnull(totalLikes,0) as totalLikes, ifnull(totalComments,0) as totalComments, if(isLiked.userID is null,"Unliked","Liked") as Liked from posts
      LEFT JOIN users ON users.userID = posts.userID
      LEFT JOIN (select * from viewers where viewers.viewerID = 3) viewers ON users.userID = viewers.posterID
      LEFT JOIN (select postID,count(*) as totalComments from comments group by postID) totalComments ON totalComments.postID = posts.postID
      LEFT JOIN (select postID,count(*) as totalLikes from likes group by postID) totalLikes ON totalLikes.postID = posts.postID
      LEFT JOIN (select * from likes WHERE userID = 3) isLiked ON isLiked.postID = posts.postID
      LEFT JOIN (select * from blocked WHERE blockerID = 3) meBlockingUser ON meBlockingUser.blockedID = posts.userID
      LEFT JOIN (select * from blocked WHERE blockedID = 3) userBlockingMe ON userBlockingMe.blockerID = posts.userID
      ,(select * from users WHERE userID = 3) adminClass
      WHERE users.userID = 1
      AND ( adminClass.classification = "admin" OR
	  (meBlockingUser.blockerID is null AND userBlockingMe.blockedID is null AND
      users.visibility != 'hidden' AND posts.visibility != 'hidden'
      AND (users.visibility != 'private' AND posts.visibility != 'private' OR users.userID = 3 or viewers.viewerID is not null)));

-- getPosts -- need follower consideration, block consideration, and admin consideration
SELECT * FROM (
SELECT posts.postID as postID, posts.userID as userID, posts.title as title, posts.content as content, posts.visibility as postVisibility, posts.subDate as postDate,
users.userName as username, users.email as email, users.visibility as userVisibility, ifnull(tLikes,0) as totalLikes, if(isLiked.postID is null,"false","true") as Liked,
ifnull(tComments,0) as totalComments, if(blockingThem.blockerID is null, "false","true") as amBlockingThem, if(blockingMe.blockedID is null,"false","true") as isBlockingMe, 
if(viewers.viewerID is null, "false","true") as isViewer, checkAdmin.classification as viewerClassification
FROM posts LEFT JOIN users ON posts.userID = users.userID
LEFT JOIN (select postID,count(*) as tLikes from likes GROUP BY postID) totalLikes ON totalLikes.postID = posts.postID -- totalLikes
LEFT JOIN (select * FROM likes as Liked WHERE userID = 3) isLiked ON isLiked.postID = posts.postID -- isLiked
LEFT JOIN (select postID, count(*) as tComments from comments GROUP BY postID) comments ON comments.postID = posts.postID -- totalComments
LEFT JOIN (select * from blocked WHERE blockerID = 3) blockingThem ON blockingThem.blockedID = posts.userID --  meblockingthem
LEFT JOIN (select * from blocked where blockedID = 3) blockingMe on blockingMe.blockerID = posts.userID  -- themblockingme
LEFT JOIN (select * from viewers WHERE viewerID = 3) viewers on viewers.posterID = posts.userID -- viewingThem
, (select * from users WHERE userID = 3) checkAdmin
) posts
WHERE viewerClassification = "admin"
OR ((amBlockingThem = "false" AND isBlockingMe = "false")
AND userVisibility != "hidden" AND postVisibility != "hidden"
AND (isViewer = "true") OR (userVisibility != "private" OR postVisibility != "private")
)
Order BY postDate DESC
;

-- getFeed
  select * from posts
  LEFT JOIN viewers ON
  viewers.posterID = posts.userID
  LEFT JOIN
  (select userid,username,visibility from users) uzers
  on uzers.userID = posts.userID
  WHERE (viewers.viewerID = 3 OR posts.userID = 3) AND uzers.visibility != 'hidden' AND posts.visibility != 'hidden'
  ORDER by subDate DESC
  ;
  -- single post
  select * from comments;
  
SELECT * FROM (
SELECT posts.postID as postID, posts.userID as userID, posts.title as title, posts.content as content, posts.visibility as postVisibility, posts.subDate as postDate,
users.userName as username, users.email as email, users.visibility as userVisibility, ifnull(tLikes,0) as totalLikes, if(isLiked.postID is null,"false","true") as Liked,
ifnull(tComments,0) as totalComments, if(blockingThem.blockerID is null, "false","true") as amBlockingThem, if(blockingMe.blockedID is null,"false","true") as isBlockingMe, 
if(viewers.viewerID is null, "false","true") as isViewer, checkAdmin.classification as viewerClassification
FROM posts LEFT JOIN users ON posts.userID = users.userID
LEFT JOIN (select postID,count(*) as tLikes from likes GROUP BY postID) totalLikes ON totalLikes.postID = posts.postID -- totalLikes
LEFT JOIN (select * FROM likes as Liked WHERE userID = 3) isLiked ON isLiked.postID = posts.postID -- isLiked
LEFT JOIN (select postID, count(*) as tComments from comments GROUP BY postID) comments ON comments.postID = posts.postID -- totalComments
LEFT JOIN (select * from blocked WHERE blockerID = 3) blockingThem ON blockingThem.blockedID = posts.userID --  meblockingthem
LEFT JOIN (select * from blocked where blockedID = 3) blockingMe on blockingMe.blockerID = posts.userID  -- themblockingme
LEFT JOIN (select * from viewers WHERE viewerID = 3) viewers on viewers.posterID = posts.userID -- viewingThem
, (select * from users WHERE userID = 3) checkAdmin
) posts LEFT JOIN (SELECT * FROM
(SELECT comments.commentID as commentID, postID as pyostID, comments.userID as commenterID, comments, comments.visibility as commentVisibility, submissionDate as commentDate,
users.userName as commentername, users.visibility as commenterVisibility, ifnull(totalCommentLikes,0) as totalCommentLikes, if(commentLiked.commentID is null,"false","true") as commentLiked, 
if(meBlockingThem.blockerID is null,"false","true") as amBlockingCommenter, if(themBlockingMe.blockerID is null,"false","true") as CommenterBlockingMe, 
if(viewers.viewerID is null, "false","true") as isViewerCommenter, checkAdmin.classification as userClassification  
FROM comments LEFT JOIN users on comments.userID = users.userID
LEFT JOIN (select commentID, count(*) as totalCommentLikes from commentLikes GROUP BY commentID) commentLikes on commentLikes.commentID = comments.commentID
LEFT JOIN (select * from commentLikes WHERE userID = 3) commentLiked on commentLiked.commentID = comments.commentID 
LEFT JOIN (select * from blocked WHERE blockerID = 3) meBlockingThem on meBlockingThem.blockedID = comments.userID
LEFT JOIN (select * from blocked WHERE blockedID = 3) themBlockingMe on themBlockingMe.blockerID = comments.userID
LEFT JOIN (select * from viewers WHERE viewerID = 3) viewers on viewers.posterID = comments.userID -- viewingThem
,(select * from users WHERE userID = 3) checkAdmin
) comments WHERE userClassification = "admin"
OR ((amBlockingCommenter = "false" AND commenterBlockingMe = "false")
AND commenterVisibility != "hidden" AND commentVisibility != "hidden"
AND (isViewerCommenter = "true") OR (commenterVisibility != "private" OR commentVisibility != "private")
)) comments on posts.postID = comments.pyostID
WHERE postID = 6 AND  (viewerClassification = "admin"
OR ((amBlockingThem = "false" AND isBlockingMe = "false")
AND userVisibility != "hidden" AND postVisibility != "hidden"
AND (isViewer = "true") OR (userVisibility != "private" OR postVisibility != "private")
))         ORDER BY commentDate DESC;
;
-- get comment
        select comments.commentID, comments.postID as postID, comments.userID as commenterID, comments, comments.visibility as commentVisibility, comments.submissionDate as commentDate, uzers.username as commenterUsername
        , uzers.visibility as commenterVisibility, ucers.userID as authorID, title, content, posts.visibility as postVisibility, subDate as postDate, ucers.username as posterUsername, ucers.visibility as posterVisibility
        ,if (isLiked.userID is null, "Unliked","Liked") as postLiked
        ,if (commentLiked.userID is null,"Unliked","Liked") as commentLiked
        from comments LEFT JOIN (select userID,username,visibility from users) uzers -- commentUsers
        on uzers.userID = comments.userID LEFT JOIN posts ON comments.postID = posts.postID
        LEFT JOIN (select userID, username,visibility from users) ucers -- postUsers
        ON posts.userID = ucers.userID
        LEFT JOIN (select * from viewers) commenterViewer
        ON commenterViewer.posterID = ucers.userID
        LEFT JOIN (select * from viewers) postViewer
        ON postViewer.posterID = uzers.userID
        LEFT JOIN (select * from likes WHERE userID = 3) isLiked -- variable
        ON isLiked.postID = posts.postID
        LEFT JOIN (SELECT * FROM commentLikes WHERE userID = 3) commentLiked
        on commentLiked.commentID = comments.commentID
        LEFT JOIN (select * from blocked WHERE blockedID = 3) commenterBlockingMe on comments.userID = commenterBlockingMe.blockerID
        LEFT JOIN (select * from blocked WHERE blockerID = 3) MeBlockingCommenter on comments.userID = commenterBlockingMe.blockedID
        LEFT JOIN (select * from blocked WHERE blockedID = 3) posterBlockingMe on posts.userID = posterBlockingMe.blockerID
        LEFT JOIN (select * from blocked WHERE blockerID = 3) MeBlockingPoster on posts.userID = meBlockingPoster.blockedID
        ,(select userID, classification from users WHERE userID = 3) checkAdmin
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
		AND (comments.visibility != 'private' OR commenterViewer.viewerID = 3 or comments.userID = 3)
        AND (posts.visibility != 'private' OR postViewer.viewerID = 3 OR posts.userID  = 3)
        AND (ucers.visibility != 'private' or commenterViewer.viewerID = 3 OR comments.userID = 3)
        AND (uzers.visibility != 'private' or postViewer.viewerID = 3 OR posts.userID  = 3)
        )
        AND comments.commentID = 2
        ;
        

        -- get user queries
      SELECT users.userID as userID,users.userName as userName, users.visibility as visibility FROM users
      LEFT JOIN (select * from viewers WHERE viewerID = 3) viewership ON viewership.posterID = users.userID
      LEFT JOIN (select * from blocked WHERE blockedID = 3) userBlockingMe ON userBlockingMe.blockerID = users.userID
      LEFT JOIN (select * from blocked WHERE blockerID = 3) meBlockingUser ON meBlockingUser.blockedID = users.userID
      , (select * from users WHERE userID = 3) adminClass
      WHERE users.userID = 2
      AND (adminClass.classification = "admin"
      OR (users.visibility != 'hidden' AND
      (userBlockingMe.blockedID is null AND meBlockingUser.blockerID is null) AND 
      (users.visibility != 'private' OR users.userID = 3 OR viewership.posterID is not null)));
      
      -- get posts
      select posts.postID,posts.userID as userID, title, content, posts.visibility, posts.subDate, users.userName as username, users.visibility as userVisibility,
      ifnull(totalLikes,0) as totalLikes, ifnull(totalComments,0) as totalComments, if(isLiked.userID is null,"Unliked","Liked") as Liked from posts
      LEFT JOIN users ON users.userID = posts.userID
      LEFT JOIN (select * from viewers where viewers.viewerID = 3) viewers ON users.userID = viewers.posterID
      LEFT JOIN (select postID,count(*) as totalComments from comments group by postID) totalComments ON totalComments.postID = posts.postID
      LEFT JOIN (select postID,count(*) as totalLikes from likes group by postID) totalLikes ON totalLikes.postID = posts.postID
      LEFT JOIN (select * from likes WHERE userID = 3) isLiked ON isLiked.postID = posts.postID
      LEFT JOIN (select * from blocked WHERE blockerID = 3) meBlockingUser ON meBlockingUser.blockedID = posts.userID
      LEFT JOIN (select * from blocked WHERE blockedID = 3) userBlockingMe ON userBlockingMe.blockerID = posts.userID
      ,(select * from users WHERE userID = 3) adminClass
      WHERE users.userID = 1
      AND ( adminClass.classification = "admin" OR
	  (meBlockingUser.blockerID is null AND userBlockingMe.blockedID is null AND
      users.visibility != 'hidden' AND posts.visibility != 'hidden'
      AND (users.visibility != 'private' AND posts.visibility != 'private' OR users.userID = 3 or viewers.viewerID is not null)));
      
      -- get users comments
            select comments.commentID as commentID,comments.postID as postID,comments.userID as userID,comments.comments as comments,comments.visibility as commentVisibility,
      comments.submissionDate as submissionDate, users.userName as userName, users.visibility as userVisibility, ifnull(totalLikes,0) as totalLikes,
      if(isLiked.userID is null,"Unliked","Liked") as Liked
      from comments LEFT JOIN users ON users.userID = comments.userID
      LEFT JOIN (select * from viewers where viewers.viewerID = 3) viewers ON users.userID = viewers.posterID
      LEFT JOIN (select commentID,count(*) as totalLikes from commentLikes group by commentID) totalLikes ON totalLikes.commentID = comments.commentID
      LEFT JOIN (select * from commentLikes WHERE userID = 3) isLiked ON isLiked.commentID = comments.commentID
      LEFT JOIN (select * from blocked WHERE blockerID = 3) meBlockingUser ON meBlockingUser.blockedID = comments.userID
      LEFT JOIN (select * from blocked WHERE blockedID = 3) userBlockingMe ON userBlockingMe.blockerID = comments.userID
      , (select * from users WHERE userID = 3) checkAdmin
      WHERE users.userID = 1 AND (checkAdmin.classification = 'admin'
      OR (users.visibility != 'hidden' AND comments.visibility != 'hidden'
      AND (comments.visibility != 'private' or users.visibility != 'private' OR users.userID = 3 or viewers.viewerID = 3)));
      ;
      
SELECT a.userID as userID, high, sessions.sessionID as sessionID, sessions.sessionDate as sessionDate, timeDuration, classification, if(bannedID is null,"true","false") isBanned FROM
(select userID,max(sessionDate) as high from sessions group by userID) a
RIGHT JOIN
(
Select * from sessions 
WHERE 
-- userID = ? AND sessionID = ? AND
(timeduration = 'FOREVER' OR (timeduration = "HOUR" AND NOW() < date_add(sessionDate,Interval 1 Hour)))
)
sessions
ON sessions.userID = a.userID AND sessions.sessionDate = a.high
LEFT JOIN (SELECT userID, classification, bannedID FROM users LEFT JOIN bans on bannedID = userID) users ON users.userID = a.userID
;

select * from posts WHERE content = "#Hello";
select * from posts WHERE visibility = 'private'
