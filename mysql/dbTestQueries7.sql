use quickiePostsDB;

select hashtag,count(*) as useCount from popularHashtags 
left join posts ON popularHashtags.postID = posts.postID
left join comments on popularHashtags.commentID = comments.commentID
WHERE (posts.postID is null OR posts.postID = 'public')
AND (comments.commentID is null OR comments.commentID = 'public')
group by hashtag;

SELECT * FROM comments 
LEFT JOIN users ON users.userID = comments.userID
LEFT JOIN (select count(*) as totalLikes, commentID from commentLikes group by commentID) totalLikes ON totalLikes.commentID = comments.commentID
WHERE comments LIKE '%#EgyptianSecret%'
AND comments.visibility = 'public'
AND users.visibility = 'public'
order by submissionDate DESC