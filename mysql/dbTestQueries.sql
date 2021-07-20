use quickiePostsDB;

-- Get Posts that are not hidden
SELECT * FROM posts WHERE visibility != 'hidden' AND visibility != 'private';
-- Get Posts that are not hidden and their username
SELECT * from posts 
LEFT JOIN
(select userid,username from users) uzers
on uzers.userID = posts.userID
WHERE visibility != 'hidden' AND visibility != 'private';
-- Get Posts for single ID
SELECT * from posts WHERE postID = 1;
-- Set a post to deleted
UPDATE posts
SET visibility = "hidden"
WHERE postID = 3;
-- Get User
SELECT * FROM users WHERE userID = 1;
-- Get User and their posts
SELECT * FROM users LEFT JOIN posts ON users.userID = posts.userID WHERE users.userID = 1;
-- Set User and their posts to Hidden;
Update posts
SET visibility = 'hidden'
WHERE userID = 3;
Update users
SET visibility = 'hidden'
WHERE userID = 3;
-- Select Posts that were posted in a short daterange
-- SELECT * from posts 
-- LEFT JOIN
-- (select userid,username from users) uzers
-- on uzers.userID = posts.userID
-- WHERE visibility != 'hidden' AND visibility != 'private'
-- and subDate < Date(2021-07-30) -- and subDate > 2021-07-01

SELECT * FROM users LEFT JOIN posts ON users.userID = posts.userID WHERE users.userID = 3;
