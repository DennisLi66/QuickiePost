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
