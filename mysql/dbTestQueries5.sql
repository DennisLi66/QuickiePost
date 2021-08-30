  use quickiePostsDB;
  
      SELECT comments.commentID, posts.postID as postID, comments.userID as commenterID, comments, comments.visibility as commentVisibility,  users.userName as commenterName,
      users.visibility as commenterVisibility, ifnull(commentLikes,0) as commentLikes, comments.submissionDate as commentDate, ifnull(totalLikes,0) as totalLikes, uzers.userID as authorID, title,content,
      posts.visibility as postVisibility, posts.subDate as postDate, uzers.userName as authorName, uzers.visibility as authorVisibility FROM posts
      left join (select * from comments WHERE visibility != 'private' AND visibility != "hidden" )comments on posts.postID = comments.postID
      left join users on users.userID = comments.userID
      left join (select postID, count(*) as totalLikes from likes group by postID) totalLikes
      on totalLikes.postID = posts.postID
      left join (select * from users) uzers on uzers.userID = posts.userID
      left join (select count(*) as commentLikes, commentID from commentLikes group by commentID) commentLikes
      ON commentLikes.commentID = comments.commentID
      WHERE 
      -- posts.postID = ? AND 
      posts.visibility != 'hidden' AND posts.visibility != 'private'
      ORDER BY comments.submissionDate
        
        ;
        select * from posts