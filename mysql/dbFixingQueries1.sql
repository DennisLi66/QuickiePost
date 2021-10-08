use quickiePostsDB;

-- get comments I can see only
select postID, count(*) as tComments 
from comments LEFT JOIN users on users.userID = comments.userID
LEFT JOIN (select * from viewers WHERE viewers.viewerID = 3) viewers on viewers.posterID = comments.userID
LEFT JOIN (select * from blocked WHERE blockedID = 3) isBlockingMe on isBlockingMe.blockerID = comments.userID
LEFT JOIN (select * from blocked WHERE blockerID = 3) amBlockingThem on amBlockingThem.blockedID = comments.userID,
(select userID,classification from users WHERE userID = 3) classification
WHERE (classification.classification = "admin")
OR ((comments.visibility != "hidden" and  users.visibility != "hidden")
AND (isBlockingMe.blockedID is null AND amBlockingThem.blockerID is null)
AND ((comments.visibility != 'private' AND users.visibility != 'private')
OR viewers.viewerID is not null)) GROUP BY postID
;
-- get comments anyone can see
select postID, count(*) as tComments from comments 
LEFT JOIN users on users.userID = comments.userID
WHERE users.visiblity = "public"
AND comments.visibility = "public" GROUP BY postID
;