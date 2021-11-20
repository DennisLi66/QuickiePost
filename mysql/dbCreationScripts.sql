drop database if exists quickiePostsDB;
create database quickiePostsDB;
use quickiePostsDB;

create table users(
	userID int NOT NULL auto_increment primary key,
    userName varchar(255) NOT NULL,
    email varchar(255) NOT NULL UNIQUE,
    pswrd varchar(255) NOT NULL,
    visibility varchar(255) NOT NULL, -- public hidden private
    classification varchar(255) NOT NULL
);
create table posts(
	postID int NOT NULL auto_increment primary key,
    userID int,
    title varchar(255),
    content text,
    visibility varchar(255) NOT NULL, -- public , hidden, private
    subDate datetime
);
create table likes (
	postID int NOT NULL,
    userID int NOT NULL,
    UNIQUE KEY IDS (postID,userID)
);
create table comments(
	commentID int NOT NULL auto_increment primary key,
	postID int NOT NULL,
    userID int NOT NULL,
    comments varchar(255) NOT NULL,
    visibility varchar(255) NOT NULL,
    submissionDate datetime NOT NULL
);
create table sessions(
	sessionID varchar(255) NOT NULL,
    userID int NOT NULL,
	sessionDate datetime NOT NULL,
    timeduration varchar(255) -- 1 HOUR or PERMANENT
);
create table viewers( -- Tells us who can see whose content
	posterID int NOT NULL,
    viewerID int NOT NULL,
    UNIQUE KEY IDS (posterID,viewerID)
);
create table commentLikes(
	commentID int NOT NULL,
    userID int NOT NULL,
    UNIQUE KEY IDS (commentID,userID)
)
;
create table blocked(
	blockedID int NOT NULL,
    blockerID int NOT NULL,
    UNIQUE KEY IDS (blockedID,blockerID)
)
;
create table notifications(
	notificationID int NOT NULL auto_increment primary key,
    title varchar(255) not null,
    content varchar(255) not null,
--     meantFor varchar(255) not null, -- user or viewers or everyone
    userID int not null
);
create table viewershipRequests(
	viewerID int NOT NULL,
    posterID int NOT NULL,
    initiatedBy int NOT NULL,
    UNIQUE KEY IDS (viewerID,posterID)
);
create table reactivationCodes(
	userID int NOT NULL primary key,
    reactivationCode varchar(10),
    addDate datetime NOT NULL
);
create table darkModePrefs(
	userID int NOT NULL primary key,
	preference varchar(255)
);
create table forgottenPasswordCodes(
	email varchar(255) NOT NULL primary key,
    fpCode varchar(10),
    addDate datetime NOT NULL
);
create table bans(
	bannedID int NOT NULL primary key
);
create table editPostHistory(
	editID int NOT NULL primary key auto_increment,
    postID int NOT NULL,
    previousTitle varchar(255),
    previousText varchar(255),
    previousVisibility varchar(255),
    editDate datetime NOT NULL
);
create table editCommentHistory(
	editID int NOT NULL primary key auto_increment,
    commentID int NOT NULL,
    previousText varchar(255),
	previousVisibility varchar(255),
    editDate datetime NOT NULL
);
create table popularHashtags(
	hashtag varchar(255),
    postID int,
    commentID int
);