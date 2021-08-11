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
(1,2,"I love it too.",'public',NOW() - interval - 10 minute);


-- Bigger Sample Size -- Addition
INSERT INTO users (userName,email,pswrd,visibility,classification) VALUES
("Sherlock","herohomles@att.com","SAMPLE_TEXT",'public',"user"),
("Moriarty","kingpin@devils.com","SAMPLE TEXT",'public','user'),
("Watson","game@afoot.net","SAMPLE_TEXT","private","user")
;

Insert Into posts (userID,title,content,visibility,subDate) VALUES
(4,"Pie Recipe","Pecan Pie.",'',NOW() - interval 3 hour),
(4,"Pie Recipe","Apple Pie.",'',NOW() - interval 2 hour),
(4,"Pie Recipe","Cherry Pie.",'',NOW() - interval 1 minute),
(4,"Pie Recipe","Cream Pie.",'',NOW() - interval 2 minute),
(4,"Pie Recipe","Pear Pie.",'',NOW() - interval 3 minute),
(5,"POSTSSSSSS","This is a post",'',NOW() - interval 30 minute),
(4,"West","I buried treasure west.",'public',NOW() - interval 20 minute)
;

INSERT INTO comments (postID,userID,comments,visibility,submissionDate) VALUES
(1,4,"This is a comment",'public',NOW() - interval 20 minute),
(1,5,"How do I comment",'public',NOW() - interval - 10 minute),
(1,4,"Let me be a mod",'public',NOW() - interval - 5 minute),
(1,4,"Let me be a mod",'public',NOW() - interval - 5 minute),
(1,4,"Let me be a mod",'public',NOW() - interval - 5 minute),
(1,4,"Let me be a mod",'public',NOW() - interval - 5 minute),
(1,4,"Let me be a mod",'public',NOW() - interval - 5 minute),
(1,4,"Let me be a mod",'public',NOW() - interval - 5 minute),
(1,4,"Let me be a mod",'public',NOW() - interval - 5 minute),
(1,4,"Let me be a mod",'public',NOW() - interval - 5 minute),
(1,4,"Let me be a mod",'public',NOW() - interval - 5 minute),
(1,4,"Let me be a mod",'public',NOW() - interval - 5 minute),
(1,4,"Let me be a mod",'public',NOW() - interval - 5 minute);
;

-- Testing Block
INSERT INTO users (userName,email,pswrd,visibility,classification) VALUES
("GoodBoi","hiimgood@google.com","SAMPLE_TEXT",'public',"user"),
("EvilMan","hiimevil@google.com","SAMPLE TEXT",'public','user'),
("NeutralMan","hiimneutral@yahoo.com","SAMPLE_TEXT","public","user")
;
INSERT INTO blocked (blockedID,blockerID) VALUES 
(7,8),
(8,7),
(5,6),
(6,5),
(5,4);
INSERT INTO blocked (blockedID,blockerID) VALUES 
(1,8),
(2,8),
(3,8),
(4,8),
(5,8)