drop database if exists quickiePostsDB;
create database quickiePostsDB;
use quickiePostsDB;

create table users(
	userID int NOT NULL auto_increment primary key,
    userName varchar(255) NOT NULL,
    email varchar(255) NOT NULL UNIQUE,
    pswrd varchar(255) NOT NULL,
    visibility varchar(255) NOT NULL,
    classification varchar(255) NOT NULL
);
create table posts(
	postID int NOT NULL auto_increment primary key,
    userID int,
    title varchar(255),
    content text,
    visibility varchar(255) NOT NULL,
    subDate datetime
);
create table editHistory(
	postID int,
    title varchar(255),
    content text,
    visibility varchar(255) NOT NULL,
    editDate datetime
);
create table likes (
	postID int NOT NULL,
    userID int NOT NULL,
    UNIQUE KEY IDS (postID,userID)
);
create table comments(
	postID int NOT NULL,
    userID int NOT NULL,
    comments varchar(255) NOT NULL,
    unique key comments(postID,userID)
);
create table sessions(
	sessionID varchar(255) NOT NULL,
    userID int NOT NULL,
	sessionDate datetime NOT NULL,
    timeduration varchar(255) -- 1 HOUR or PERMANENT
)
