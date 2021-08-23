use quickiePostsDB;  
  
  -- Search Base
	SELECT * from posts
    LEFT JOIN
    (select userid,username,visibility from users) uzers
    on uzers.userID = posts.userID
    WHERE 
    posts.visibility != 'hidden' 
	AND uzers.visibility != 'hidden' 
    AND posts.visibility != 'private'
    AND uzers.visibility != 'private'
    ;
    --
	select userid,username,visibility,viewerID from users left join (select * from viewers WHERE viewerID = 2) viewers on viewers.posterID = users.userID ;
    -- Search Logged In
	SELECT * from posts
    LEFT JOIN
    (select userid,username,visibility,viewerID from users left join (select * from viewers WHERE viewerID = 2) viewers on viewers.posterID = users.userID) uzers
    on uzers.userID = posts.userID
    WHERE 
    posts.visibility != 'hidden' 
	AND uzers.visibility != 'hidden' 
    AND (posts.visibility != 'private' OR viewerID is not null)
    AND (uzers.visibility != 'private' OR viewerID is not null)
    ;
    
    
    -- FIX GET POST
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
LEFT JOIN (select * from likes WHERE userID = 1) isLiked ON isLiked.postID = posts.postID
LEFT JOIN (SELECT * FROM commentLikes WHERE userID = 1) commentLiked on commentLiked.commentID = comments.commentID
LEFT JOIN (select * from viewers WHERE viewerID = 1) commentViewers ON commentViewers.posterID = comments.userID
LEFT JOIN (select * from viewers where viewerID = 1) postViewers ON postViewers.posterID = posts.userID
) bigQuery
WHERE postID = 2
AND postVisibility != 'hidden'  AND (postVisibility != 'private' OR viewerID is not null)
AND (commentVisibility != 'private'  OR viewerID is not null OR commentVisibility is null) AND (NOT commentVisibility = 'hidden'  OR commentVisibility is null)
ORDER BY commentDate
;

-- -- AND NOT comments.visibility = 'hidden' 
-- -- AND (comments.visibility != 'private'  OR commentViewers.viewerID is not null)
;
select * from comments WHERE visibility = "public" OR visibility is null