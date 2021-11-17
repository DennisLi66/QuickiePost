use quickiePostsDB;

select hashtag,count(*) as useCount from popularHashtags 
left join posts ON popularHashtags.postID = posts.postID
left join comments on popularHashtags.commentID = comments.commentID
WHERE (posts.postID is null OR posts.postID = 'public')
AND (comments.commentID is null OR comments.commentID = 'public')
group by hashtag;