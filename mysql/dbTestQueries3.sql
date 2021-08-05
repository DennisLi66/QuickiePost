use quickiePostsDB;
-- get comments and posts -- Non logged In
select commentID,postID,comments.userID as userID,comments,comments.visibility as commentVisibility, submissionDate, userName, users.visibility as userVisibility from comments 
LEFT JOIN users ON users.userID = comments.userID
WHERE users.userID = 1
AND users.visibility != 'hidden' AND comments.visibility != 'private'
AND comments.visibility != 'hidden' AND users.visibility != 'private'
;
select postID,posts.userID as userID, title, content, posts.visibility, posts.subDate, users.userName as username, users.visibility as userVisibility from posts 
LEFT JOIN users ON users.userID = posts.userID
 WHERE users.userID = 1
AND users.visibility != 'hidden' AND posts.visibility != 'private'
AND posts.visibility != 'hidden' AND users.visibility != 'private'
;
-- get comments and posts -- Logged In
select commentID,postID,comments.userID as userID,comments,comments.visibility as commentVisibility, 
submissionDate, userName, users.visibility as userVisibility 
from comments 
LEFT JOIN users ON users.userID = comments.userID
LEFT JOIN (select * from viewers where viewers.viewerID = 1) viewers ON users.userID = viewers.posterID
WHERE users.userID = 1
AND users.visibility != 'hidden' 
AND comments.visibility != 'hidden'
AND (comments.visibility != 'private' or users.visibility != 'private' OR users.userID = 1 or viewers.viewerID = 1)
;
select postID,posts.userID as userID, title, content, posts.visibility, posts.subDate, users.userName as username, users.visibility as userVisibility, totalLikes from posts 
LEFT JOIN users ON users.userID = posts.userID
LEFT JOIN (select * from viewers where viewers.viewerID = 1) viewers ON users.userID = viewers.posterID
LEFT JOIN (select postID,count(*) as totalLikes from likes where postID = 1 group by postID) totalLikes ON totalLikes.postID = posts.postID
 WHERE users.userID = 1
AND users.visibility != 'hidden' 
AND posts.visibility != 'hidden' 
AND (users.visibility != 'private' AND posts.visibility != 'private' OR users.userID = 1 or viewers.viewerID = 1)
;


      select posts.postID,posts.userID as userID, title, content, posts.visibility, posts.subDate, users.userName as username, users.visibility as userVisibility,totalLikes,totalComments from posts
      LEFT JOIN users ON users.userID = posts.userID
      LEFT JOIN (select postID,count(*) as totalLikes from likes group by postID) totalLikes ON totalLikes.postID = posts.postID
           LEFT JOIN (select postID,count(*) as totalComments from comments group by postID) totalComments ON totalComments.postID = posts.postID
       WHERE users.userID = 1
      AND users.visibility != 'hidden' AND posts.visibility != 'private'
      AND posts.visibility != 'hidden' AND users.visibility != 'private'
      ;
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      -- need t0 add comments, likes, and isliked
select posts.postID,posts.userID as userID, title, content, posts.visibility, posts.subDate, users.userName as username, users.visibility as userVisibility, 
ifnull(totalLikes,0) as totalLikes, ifnull(totalComments,0) as totalComments, if(isLiked.userID is null,"Unliked","Liked") as Liked from posts
LEFT JOIN users ON users.userID = posts.userID
LEFT JOIN (select * from viewers where viewers.viewerID = 1) viewers ON users.userID = viewers.posterID
LEFT JOIN (select postID,count(*) as totalComments from comments group by postID) totalComments ON totalComments.postID = posts.postID
LEFT JOIN (select postID,count(*) as totalLikes from likes group by postID) totalLikes ON totalLikes.postID = posts.postID
LEFT JOIN (select * from likes WHERE userID = 1) isLiked ON isLiked.postID = posts.postID
WHERE users.userID = 1
AND users.visibility != 'hidden'
AND posts.visibility != 'hidden'
AND (users.visibility != 'private' AND posts.visibility != 'private' OR users.userID = 1 or viewers.viewerID = 1)
