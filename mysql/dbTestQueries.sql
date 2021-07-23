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

Select * from sessions WHERE userID = 3 AND 
(timeduration = 'FOREVER' OR (timeduration = "HOUR" AND NOW() < date_add(sessionDate,Interval 1 Hour)))
;

-- GET MOST RECENT VALID SESSION DATE
SELECT * FROM
(select userID,max(sessionDate) as high from sessions group by userID) a
RIGHT JOIN 
(
Select * from sessions WHERE userID = 3 AND sessionID = 'gKQ1oxZW0UXIbt5vvTHY' AND
(timeduration = 'FOREVER' OR (timeduration = "HOUR" AND NOW() < date_add(sessionDate,Interval 1 Hour)))
)
sessions 
ON sessions.userID = a.userID AND sessions.sessionDate = a.high
;

;
SELECT * from posts
  LEFT JOIN
  (select userid,username,visibility from users) uzers
  on uzers.userID = posts.userID
  WHERE posts.visibility != 'hidden' AND posts.visibility != 'private' AND uzers.visibility != 'hidden' AND uzers.visibility != 'private'
  ORDER BY subDate DESC;
  
  
  
  
  
  -- GET all my posts and the posts of the people im allied with
select * from posts
LEFT JOIN viewers ON
viewers.posterID = posts.userID
LEFT JOIN
(select userid,username,visibility from users) uzers
on uzers.userID = posts.userID
WHERE (viewers.viewerID = 2 OR posts.userID = 2) AND uzers.visibility != 'hidden' AND posts.visibility != 'hidden'
;