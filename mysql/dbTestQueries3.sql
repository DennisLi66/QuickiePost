use quickiePostsDB;
-- get comments and posts
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