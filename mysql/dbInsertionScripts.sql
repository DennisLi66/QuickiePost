use quickiePostsDB;
truncate table users;
truncate table posts;

Insert Into posts (userID,title,content,visibility,subDate) VALUES
(1,"Wow, First Post","Just wanted to say hi.",'',NOW() - interval 1 hour),
(1,"Second Post","I hope you guys are having a nice day.",'',NOW() - interval 30 minute)
