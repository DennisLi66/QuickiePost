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
      
      
      
      
      
      
      
      
      
      
      
      
-- need to add isLiked and viewership
select comments.commentID as commentID,comments.postID as postID,comments.userID as userID,comments.comments as comments,comments.visibility as commentVisibility,
comments.submissionDate as submissionDate, userName, users.visibility as userVisibility, ifnull(totalLikes,0) as totalLikes,
if(isLiked.userID is null,"Unliked","Liked") as Liked
from comments LEFT JOIN users ON users.userID = comments.userID
LEFT JOIN (select * from viewers where viewers.viewerID = 1) viewers ON users.userID = viewers.posterID
LEFT JOIN (select commentID,count(*) as totalLikes from commentLikes group by commentID) totalLikes ON totalLikes.commentID = comments.commentID
LEFT JOIN (select * from commentLikes WHERE userID = 1) isLiked ON isLiked.commentID = comments.commentID
WHERE users.userID = 1
AND users.visibility != 'hidden'
AND comments.visibility != 'hidden'
AND (comments.visibility != 'private' or users.visibility != 'private' OR users.userID = 1 or viewers.viewerID = 1)

      ;
      
      
      ;
      
      
      
      
      
      
      
      
      select * from posts;
      
      
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
;


-- get all users a user is blocking
select blockedID,blockerID,userName from blocked 
LEFT JOIN users ON blocked.blockedID = users.userID
WHERE blockerID = 8;


-- isBlocked, amBlocked, isVieweer, is VIewee
SELECT base.userID as userID, if(blockingThem.blockerID is null,'false','true') as blockingThem, if(blockingMe.blockedID is null,'false','true') as blockingMe,
if(viewingThem.viewerID is null,'false','true') as viewingThem, if(viewingMe.viewerID is null,'false','true') as viewingMe,
if (theirViewershipRequestToViewMe.posterID is null,'false','true') as theyHaveRequestedToViewMe,
if (myViewershipRequestToViewMe.posterID is null,'false','true') as iHaveRequestedToViewMe,
if (theirViewershipRequestToViewThem.posterID is null,'false','true') as theyHaveRequestedToViewThem,
if (myViewershipRequestToViewThem.posterID is null,'false','true') as iHaveRequestedToViewThem
FROM (select 1 as userID) base LEFT JOIN
(select * from blocked WHERE blockerID = 1 and blockedID = 2) blockingThem 
ON base.userID = blockingThem.blockerID LEFT JOIN 
(select * from blocked WHERE blockerID = 2 and blockedID = 1) blockingMe
ON base.userID = blockingMe.blockedID LEFT JOIN
(select * from viewers WHERE viewerID = 1 AND posterID = 2) viewingThem
ON viewingThem.viewerID = base.userID LEFT JOIN
(select * from viewers WHERE posterID = 1 AND viewerID = 2) viewingMe
ON base.userID = viewingMe.posterID LEFT JOIN
(select * from viewershipRequests WHERE posterID = 1 AND viewerID = 2 AND initiatedBy = 2) theirViewershipRequestToViewMe
ON base.userID = theirViewershipRequestToViewMe.posterID LEFT JOIN
(select * from viewershipRequests WHERE posterID = 1 AND viewerID = 2 AND initiatedBy = 1) myViewershipRequestToViewMe
ON base.userID = myViewershipRequestToViewMe.posterID LEFT JOIN
(select * from viewershipRequests WHERE posterID = 2 AND viewerID = 1 AND initiatedBy = 1) myViewershipRequestToViewThem
ON base.userID = myViewershipRequestToViewThem.viewerID LEFT JOIN
(select * from viewershipRequests WHERE posterID = 2 AND viewerID = 1 AND initiatedBy = 2) theirViewershipRequestToViewThem
ON base.userID = theirViewershipRequestToViewThem.viewerID;


