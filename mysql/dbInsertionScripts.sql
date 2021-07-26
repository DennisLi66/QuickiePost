use quickiePostsDB;
truncate table users;
truncate table posts;

INSERT INTO users (userName,email,pswrd,visibility,classification) VALUES
("Kyle","kyle@hugs.com","SAMPLE_TEXT",'public',"admin"),
("Bott","bott@eeee.com","SAMPLE TEXT",'public','user')
;

Insert Into posts (userID,title,content,visibility,subDate) VALUES
(1,"Wow, First Post","Just wanted to say hi.",'',NOW() - interval 1 hour),
(1,"Second Post","I hope you guys are having a nice day.",'',NOW() - interval 30 minute),
(2,"Hey Losers","MachoMan",'private',NOW() - interval 20 minute)
;

INSERT INTO viewers (posterID,viewerID) VALUES
(1,2),
(2,1)
;

Insert INTO likes (postID,userID) VALUES
(1,1),
(1,2) 
;

INSERT INTO comments (postID,userID,comments,visibility,submissionDate) VALUES
(1,1,"I love this post.",'public',NOW() - interval 20 minute),
(1,2,"I love it too.",'public',NOW() - interval - 10 minute)
