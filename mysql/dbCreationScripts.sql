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
