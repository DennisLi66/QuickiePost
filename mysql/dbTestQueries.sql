use quickiePostsDB;

-- Get Posts that are not hidden
SELECT * FROM posts WHERE visibility != 'hidden' AND visibility != 'private';
-- Get Posts for single ID
SELECT * from posts WHERE postID = 1;
-- Set a post to deleted
UPDATE posts
SET visibility = "hidden"
WHERE postID = 3;
-- Get User
SELECT * FROM users WHERE userID = 1;
-- Get User and their posts
SELECT * FROM users LEFT JOIN posts ON users.userID = posts.userID WHERE users.userID = 1