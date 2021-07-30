use quickiePostsDB;
-- Get all posts
  SELECT * from posts
  LEFT JOIN
  (select userid,username,visibility from users) uzers
  on uzers.userID = posts.userID
  WHERE posts.visibility != 'hidden' AND posts.visibility != 'private'
  AND uzers.visibility != 'hidden' AND uzers.visibility != 'private'
  ORDER BY subDate DESC;
  -- Get amount of likes per post / amount of comments per post
  SELECT count(*) as total, postID FROM likes GROUP BY postID;
  SELECT count(*) as totalComments, postID from comments GROUP BY postID;
  -- Get all likes made by a certain user
  select * from likes WHERE userID = 1;
  -- Get Post, Amount of Likes, and if a particiular user has liked it --- Feature For Being Logged In
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
(  select * from likes WHERE userID = 1) desig
on desig.postID = posts.postID
LEFT JOIN
(  SELECT count(*) as totalComments, postID from comments GROUP BY postID) comments
ON comments.postID = posts.postID;
-- Get Post and Amount of Likes === Not Logged In
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
;

-- Get Specific Post, their likes, and comments --- NOT LOGGED IN
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
WHERE posts.postID = 2 
AND posts.visibility != 'hidden' AND posts.visibility != 'private'
ORDER BY commentID
;
-- MAY NEED TO BE MORE SPECIFIED
-- Get Specific Post, their likes, and comments ---  LOGGED IN will need to add viewers, if you liked a comment CHECK, if you liked post CHECK, and if youre able to view a private post or comment
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
LEFT JOIN (select * from likes WHERE userID = 1) isLiked -- variable
ON isLiked.postID = posts.postID
LEFT JOIN (SELECT * FROM commentLikes WHERE userID = 1) commentLiked 
on commentLiked.commentID = comments.commentID
LEFT JOIN (select * from viewers WHERE viewerID = 1) commentViewers
ON commentViewers.posterID = comments.userID
LEFT JOIN (select * from viewers where viewerID = 1) postViewers
ON postViewers.posterID = posts.userID
WHERE posts.postID = 1 -- variable
AND posts.visibility != 'hidden' AND (posts.visibility != 'private' OR  postViewers.viewerID is not null)
AND comments.visibility != 'hidden' AND (comments.visibility != 'private'  OR commentViewers.viewerID is not null)
ORDER BY commentID
;

-- Get comments by comment ID, and its parent 
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
LEFT JOIN (select * from likes WHERE userID = 1) isLiked -- variable
ON isLiked.postID = posts.postID
LEFT JOIN (SELECT * FROM commentLikes WHERE userID = 1) commentLiked 
on commentLiked.commentID = comments.commentID
WHERE 
(
comments.visibility != 'hidden' 
AND posts.visibility != 'hidden'
AND ucers.visibility != 'hidden'
AND uzers.visibility != 'hidden'
)
AND posts.userID  = 1 OR
(
(comments.visibility != 'private' OR commenterViewer.viewerID = 1)
AND (posts.visibility != 'private' OR postViewer.viewerID = 1)
AND (ucers.visibility != 'private' or commenterViewer.viewerID = 1)
AND (uzers.visibility != 'private' or postViewer.viewerID = 1)
)


