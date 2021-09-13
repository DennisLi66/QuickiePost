  use quickiePostsDB;
  
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
        WHERE 
        postID = ? AND 
        postVisibility != 'hidden'  AND (postVisibility != 'private' OR viewerID is not null)
        AND (commentVisibility != 'private'  OR viewerID is not null OR commentVisibility is null) AND (NOT commentVisibility = 'hidden'  OR commentVisibility is null)
        ORDER BY commentDate;


    -- get posts which user has liked
	SELECT * 
	FROM (
	select 
		posts.postID as postID, posts.userID as userID , users.userName as username,title, content, posts.visibility as postVisibility, users.visibility as userVisibility,viewerID, subDate
		from posts 
		left join likes ON likes.postID = posts.postID
		left join users on users.userID = posts.userID
		left join (select * from viewers WHERE viewerID = 3) viewers on users.userID = viewers.posterID
		WHERE likes.userID = 3
		order by subDate desc
    ) posts
    WHERE postVisibility != 'hidden' AND userVisibility != 'hidden'
   AND ((postVisibility != 'private'AND userVisibility != 'private') OR userID = 3 OR viewerID is not null)
    ;
--    get comments which user has liked
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
left join (select * from viewers WHERE viewerID = 3) viewers on comments.userID = viewers.posterID
left join (select * from viewers WHERE viewerID = 3) viewerz on posts.userID = viewers.posterID
left join commentLikes on commentLikes.commentID = comments.commentID
WHERE commentLikes.userID = 3
order by submissionDate desc
) comments
WHERE commentVisibility != 'hidden' AND postVisibility != 'hidden' AND commenterVisibility != 'hidden'
AND ((commenterVisibility != 'private' AND commentVisibility != 'private') OR commentViewerID is not null OR commenterID = 3)
AND ((posterVisibility != 'private' AND postVisibility != 'private') OR posterVisibility is not null OR posterID = 3)
;

  SELECT posts.postID as postID, posts.userID as userID, title, content, username, visibility, uvisibility as userVisibility, ifnull(total,0) as totalLikes, ifnull(totalComments,0) as totalComments, subDate FROM
  ( 
	SELECT * from posts
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
  ;
  -- Add if liked to search posts
  
SELECT posts.postID as postID, posts.userID as userID, posts.title as title, posts.content as content,
posts.visibility as postVisibility, subDate, username, uzers.visibility as userVisibility,
if(viewerID is null,'false','true') as amViewing, if(likes.userID is null,'false','true') as isLiked
from posts
LEFT JOIN
(select userid,username,visibility,viewerID from users left join 
(select * from viewers WHERE viewerID = 1) viewers on viewers.posterID = users.userID) uzers
on uzers.userID = posts.userID
LEFT JOIN (select * from likes WHERE userID = 1) as likes ON likes.postID = posts.postID
WHERE
posts.visibility != 'hidden'
AND uzers.visibility != 'hidden'
AND (posts.visibility != 'private' OR viewerID is not null)
AND (uzers.visibility != 'private' OR viewerID is not null)
ORDER BY posts.subDate desc
;

select * from likes;