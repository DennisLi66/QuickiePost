use quickiePostsDB;

-- 1
INSERT INTO posts (userID,title,content,visibility,subDate) VALUES 
(1,'Sponsorship Deal','Hey, I just got a sponsorship with #McDonalds for the new #EggMcCluckin.','public',NOW() - interval 10 second);
INSERT INTO popularHashtags (hashtag,postID) VALUES 
('McDonalds',LAST_INSERT_ID()),
('EggMcCluckin',LAST_INSERT_ID());
-- 2 
INSERT INTO posts (userID,title,content,visibility,subDate) VALUES 
(2,'NUGGIESSSS','I WANT NUGGETS #McDonalds','public',NOW() - interval 15 second);
INSERT INTO popularHashtags (hashtag,postID) VALUES 
('McDonalds',LAST_INSERT_ID());
-- 3
INSERT INTO posts (userID,title,content,visibility,subDate) VALUES 
(1,'Feeling Homesick','I just heard the new #JeffreyBobbins album #WalkingHome and I got really homesick. #FairfurtCA','public',NOW() - interval 3300 second);
INSERT INTO popularHashtags (hashtag,postID) VALUES 
('WalkingHome',LAST_INSERT_ID()),
('JeffreyBobbins',LAST_INSERT_ID()),
('FairfurtCA',LAST_INSERT_ID());
-- 4 
INSERT INTO posts (userID,title,content,visibility,subDate) VALUES 
(4, 'Just made the discovery of lifetime in my travels. #EgyptianSecret #Aliens #Illuminati','public',NOW() - interval 33409 second);
INSERT INTO popularHashtags(hashtag,postID) VALUES 
('EgyptianSecret',last_insert_id()),
('Aliens',last_insert_id()),
('Illuminati',last_insert_id());
INSERT INTO comments (postID,userID,comments,visibility,submissionDate) VALUES 
(last_insert_id(),4,"Join my blog for $19.99 a week and gain access to the article! #EgyptianSecret #SweetDeal #HiddenTruth",'public',NOW() - interval 22400 second);
INSERT INTO popularHashtags(hashtag,commentID) VALUES
('EgyptianSecret',last_insert_id()),
('SweetDeal',last_insert_id()),
('HiddenTruth',last_insert_id())