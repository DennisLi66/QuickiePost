use quickiePostsDB;

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