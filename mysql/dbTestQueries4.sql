use quickiePostsDB;  
  
  -- Search Base
	SELECT * from posts
    LEFT JOIN
    (select userid,username,visibility from users) uzers
    on uzers.userID = posts.userID
    WHERE 
    posts.visibility != 'hidden' 
	AND uzers.visibility != 'hidden' 
    AND posts.visibility != 'private'
    AND uzers.visibility != 'private'
    ;
    --
	select userid,username,visibility,viewerID from users left join (select * from viewers WHERE viewerID = 1) viewers on viewers.posterID = users.userID ;
    -- Search Logged In
	SELECT * from posts
    LEFT JOIN
    (select userid,username,visibility,viewerID from users left join (select * from viewers WHERE viewerID = 2) viewers on viewers.posterID = users.userID) uzers
    on uzers.userID = posts.userID
    WHERE 
    posts.visibility != 'hidden' 
	AND uzers.visibility != 'hidden' 
    AND (posts.visibility != 'private' OR viewerID is not null)
    AND (uzers.visibility != 'private' OR viewerID is not null)
    ;
    