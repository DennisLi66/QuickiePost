// import logo from './logo.svg';
import Navbar from 'react-bootstrap/Navbar'
import Nav from 'react-bootstrap/Nav'
import Card from "react-bootstrap/Card"
import ListGroup from 'react-bootstrap/ListGroup'
// import Form from 'react-bootstrap/Form'
// import ReactDOM from 'react-dom';
import Button from 'react-bootstrap/Button'
import './App.css';
import React from "react";
import Cookies from 'universal-cookie';
require('dotenv').config();
//things ill Need
////////////////////////UTMOST
//implement admin powers -- URGENT
  //Ban User page
  //Unban User page
  //Delete Posts and Comments
//Display a banner or information that says user is banned
//check that a user isnt banned on page refresh
//FIX THIS CHANGE HOW SITE LOOKS TO AN ADMIN
//////////////////////////////Client: Make use of client variables
///will need to set lighting based on cookie recieved from login
///css as it is doesnt currently refresh the page for new likes, incorporate new variables
//Cancel Button may not work properly
//if you have blocked or been blocked by user, display a message that says youve been blocked or onlythe  unblock buyyon
//TEST search more
//page should also include origin
//Queries need to be rechecked
//light and dark modes
//Have error message if post or comment is restricted to private when you redirect to it
/////
//!!!PRIORITY
//Need to integrate the impact of being blocked; upgrade existing mysql queries
//check all buttons are in () => {} format
//Notifcation List - what has changed since last sessionID update?
//Cancelling a conferred viewership request does not appear to work
//test showOptions features on other profiles
//SHould memoize pagination so its faster, and check that pagination is actually correct
////////////////
//test acccount reactivation and make sure the results interacts the way it should
//add a highlight effect to the pagination bar
//Add fine tuning to posts after submission
//change getPosts to SELECT posts where post != private and user != private
//FIX THIS: Add a display if there are no posts
//change color of posts and comments to better differentiate them
//FIX THIS: LOGIN should redirect to previous page instead of home if a button links there
//FIX THIS: ADD pagination and remembering paginatikn
//FIX UI
//Check if i really need to set name for cookies
//have loading symbol https://www.google.com/search?q=while+fetch+is+working+show+symbol&rlz=1C1CHBF_enUS824US824&oq=while+fetch+is+working+show+symbol&aqs=chrome..69i57j33i160l2.11112j0j1&sourceid=chrome&ie=UTF-8
//have a remaining characters tracker for writing post
//REDO QUERIES - SOME NEED TO BE FIXED
//rewrite post pages to include pagination
//VIEWERSHIP ENABLEMENT Check if it works
//FIX THIS: CHECK QUERIES THAT INVOLVE COMMENT VISIBILITY
//test forgotten password
//MAke sure to test everything
//fix home
function App() {
  //Variables
  const serverLocation = "http://localhost:3001";
  // const serverLocation = process.env.SERVERLOCATION;
  const cookies = React.useMemo(() => {return new Cookies()},[])
  //Important Variables
  const [mainCode,changeCode] = React.useState(
    <div>
    <h1> QuickiePost </h1>
    </div>
  );
  const [inDepthCode,changeInDepthCode] = React.useState();
  const [inDepthPostCSS,changeInDepthCSS] = React.useState();
  const [writeFormCode,changeWriteFormCode] = React.useState(

  )
  const [writeFormCSS,changeWriteFormCSS] = React.useState(
    {
      height: 0,
        display: 'none'
    }
  )
  const [mainBodyCSS,changeMainBodyCSS] = React.useState(
    {
    height: 'auto'
    }
  )
  const [navBar,changeNavBar] = React.useState();
  const [loginCode,changeLoginCode] = React.useState();
  const [loginCSS,changeLoginCSS] = React.useState(
    {
      height: 0,
        display: 'none'
    }
  );
  const [pageVariables,changePageVariables] = React.useState({
    origin: "", //if origin is not the same as the page set start and end to defaults
    startPos: 0,
    endPos: 10,
    title: "",
    content: "",
    visibility: "",
    comments: "",
    searchPosts: [],
    postID: 0,
    commentID: 0,
    userID: 0
  })
  const [lightDarkMode,changeLighting] = React.useState({
    lightingMode: "light"
  })
  //
  const getHome = React.useCallback(
    (beginPosition = 0,endPosition = 10) => {
      //Helper Functions
      function simplePost(key,dict,hasLiked = false, origin = "", startPos = 0, endPos = 10, searchPosts = []){
        var likePostButton;
        var commentButton;
        if (cookies.get('sessionID') && cookies.get('id')){
          likePostButton = (<Button onClick={() => {handlePostLike(dict.postID,origin,0,0,startPos,endPos,"",searchPosts)}}> Like </Button>);
          if (hasLiked || dict.Liked === "Liked"){
            likePostButton = (<Button onClick={() => {handlePostUnlike(dict.postID,origin,0,0,startPos,endPos,"",searchPosts)}}> Unlike </Button>);
          }
          commentButton = (<Button onClick={() => {displayCommentWriter(dict.postID,origin,startPos,endPos)}}> Comment </Button>);
        }else{
          likePostButton = (<Button onClick={() => {getLoginPage(origin)}}> Like </Button>);
          commentButton = (<Button onClick ={() => {getLoginPage(origin)}}> Comment </Button>);
        }
        return (
        <Card key={key}>
          <Card.Title> {parseMessage(dict.title)} </Card.Title>
          <Card.Subtitle> {"Username: " + dict.username} </Card.Subtitle>
          <Card.Subtitle> {"User ID: " + dict.userID} </Card.Subtitle>
          <Card.Body> {parseMessage(dict.content)} </Card.Body>
          <Card.Subtitle> {dict.subDate} </Card.Subtitle>
          <Card.Body>
          Likes: {dict.totalLikes}
          <br></br>
          {likePostButton}
          <br></br>
          Comments: {dict.totalComments}
          <br></br>
          {commentButton}
          <br></br>
          <Button onClick={()=>{showInDepthPost(dict.postID)}}> Expand Post </Button>
          </Card.Body>
        </Card>
        )
      }
      function parseMessage(message){ //use in both posts and comments
        var newMessage = "";
        for (let i = 0; i < message.length; i++){
          if (message[i] === '#'){
            var hashtag = '#';
            for (let i1 = 1; i + i1 < message.length; i++){
              if (message[i] === ' ' || message[i] === '#'){
                if (hashtag.length === 1){
                  newMessage += hashtag;
                  i = i1 + i;
                  break;
                }else{
                  newMessage += "<Button onClick=searchHashtag("+ hashtag +")>" + hashtag + "</Button>"
                  i = i1 + i;
                  break;
                }
              }else if (i + i1 + 1 === message.length){
                if (hashtag.length === 1){
                  newMessage += hashtag;
                  i = i1 + i;
                  break;
                }else{
                  newMessage += "<Button onClick=searchHashtag("+ hashtag +")>" + hashtag + "</Button>"
                  i = i1 + i;
                  break;
                }
              }else{
                hashtag += message[i];
              }
            }
          }else{
            newMessage += message[i];
          }
        }
        return (<div dangerouslySetInnerHTML={{__html:newMessage}}></div>);
      }
      function cancel(origin = "",postID=0,commentID=0,userID=0,startPos=0,endPos=0){
        if (origin === ""){
          getHome();
        }else if (origin === "userProfileOptions"){
          showUserProfile(userID,0,0,"options");
        }else if (origin === "indepthPost"){
          showInDepthPost(postID,startPos,endPos);
        }else if (origin === "userProfilePosts"){
          showUserProfile(userID,startPos,endPos,"posts");
        }else if (origin === "userProfileComments"){
          showUserProfile(userID,startPos,endPos,"comments");
        }else if (origin === "indepthComment"){
          showInDepthComment(commentID);
        }
        else if (origin === "userProfile"){
          showUserProfile(userID);
        }
        else if (origin === "myFeed"){
          getMyFeed(startPos,endPos);
        }
        else if (origin === "home"){
          getHome(startPos,endPos);
        }else if (origin === "search"){
          getSearchPage();
        }
        else if (origin === "login"){
          getLoginPage();
        }
        else{
          getHome();
        }
      }
      //Deleting Handlers --ADMINS EDIT
      function showDeletePostConfirmation(postID,origin,startPos,endPos){
        if (!cookies.get("id") || (!cookies.get("sessionID"))){ //should replace with check sessionID FIX THIS
          cancel(origin,postID,0,(cookies.get("id") ? cookies.get("id") : 0),startPos,endPos);
        }else{
          fetch(serverLocation + "/post?postID=" + postID + "&userID=" + cookies.get("id") + "&sessionID=" + cookies.get("sessionID"))
            .then(response => response.json())
            .then(data => {
              if (data.status === -11){
                showExpiredPage({origin: origin,startPos: startPos,endPos:endPos, postID: postID});
              }else if (data.status === -1){
                showErrorPage({message: data.message, origin: origin, startPos: startPos,endPos:endPos, postID: postID})
              }else if (data.authorID !== cookies.get("id")){
                showErrorPage({message:"You're not allowed to delete that post.",origin: origin, startPos: startPos,endPos:endPos, postID: postID})
              }else{
                changeCode(
                  <div>
                    <Button variant='dark' onClick={() => {cancel(origin,postID,0,cookies.get("id"),startPos,endPos)}} className='exitButton'>Cancel</Button>
                    Editing Post
                    <form>
                      <h4> Deleting A Post </h4>
                      <h5> Are You Sure You Want To Delete This Post?</h5>
                      <Card>
                      <Card.Title>{data.title}</Card.Title>
                      <Card.Body>{data.content}</Card.Body>
                      </Card>
                      <Button onClick={() => {handleDeletePost(postID,origin,startPos,endPos)}} type='submit'> Do Delete </Button>
                      <Button onClick={() => {cancel(origin,postID,0,cookies.get("id"),startPos,endPos)}}> Do Not Delete </Button>
                    </form>
                  </div>
                )
              }
            })
        }
      }
      function handleDeletePost(postID,origin,startPos,endPos){
        if (!cookies.get("id") || (!cookies.get("sessionID"))){ //should replace with check sessionID FIX THIS
          getLoginPage(origin)
        }else{
          const requestSetup = {
              method: 'DELETE',
          }
          fetch(serverLocation + "/post?postID=" + postID + "&userID=" + cookies.get("id") + "&sessionID=" + cookies.get("sessionID"),requestSetup)
            .then(response => response.json())
            .then(data => {
              if (data.status === -1){
                showExpiredPage({origin: origin,startPos: startPos,endPos:endPos, postID: postID});
              }
              else if (data.status === -1){
                showErrorPage({message: data.message, origin: origin, startPos: startPos,endPos:endPos, postID: postID})
              }else if (origin === "indepthPost"){
                showInDepthPost(postID,startPos,endPos,"Delete");
              }else if (origin === "userProfile"){
                showUserProfile(cookies.get("id"),startPos,endPos,"posts","postDelete")
              }
            })
        }
      }
      function showDeleteCommentConfirmation(commentID,origin,postID,startPos,endPos){
        if (!cookies.get("id") || (!cookies.get("sessionID"))){ //should replace with check sessionID FIX THIS
          cancel(origin,postID,0,(cookies.get("id") ? cookies.get("id") : 0),startPos,endPos);
        }
        else{
          fetch(serverLocation + "/comment?commentID=" + commentID + "&userID=" + cookies.get("id") + "&sessionID=" + cookies.get("sessionID"))
            .then(response => response.json())
            .then(data => {
              if (data.status === -11){
                showExpiredPage({origin: origin,startPos: startPos,endPos:endPos, postID: postID, commentID: commentID});
              }else if (data.status === -1){
                                showErrorPage({message: data.message, origin: origin, startPos: startPos,endPos:endPos, postID: postID, commentID: commentID})
              }else if (data.authorID !== cookies.get("id")){
                showErrorPage({message: "You're not allowed to delete that comment.", postID: postID, origin: origin, startPos: startPos,endPos:endPos, commentID: commentID})
              }else{
                changeCode(
                  <div>
                    <Button variant='dark' onClick={() => {cancel(origin,postID,commentID,cookies.get("id"),startPos,endPos)}} className='exitButton'>Cancel</Button>
                    Editing Post
                    <form>
                      <h4> Deleting A Comment </h4>
                      <h5> Are You Sure You Want To Delete This Comment?</h5>
                      <Card>
                      <Card.Body>{data.comments}</Card.Body>
                      </Card>
                      <Button onClick={() => {handleDeleteComment(commentID,origin,postID,startPos,endPos)}} type='submit'> Do Delete </Button>
                      <Button onClick={() => {cancel(origin,postID,commentID,cookies.get("id"),startPos,endPos)}}> Do Not Delete </Button>
                    </form>
                  </div>
                )
              }
            })
        }
      }
      function handleDeleteComment(commentID,origin,postID,startPos,endPos){
        if (!cookies.get("id") || (!cookies.get("sessionID"))){ //should replace with check sessionID FIX THIS
          getLoginPage(origin)
        }
        else{
          const requestSetup = {
              method: 'DELETE',
          };
          fetch(serverLocation + "/comment?commentID=" + commentID + "&userID=" + cookies.get("id") + "&sessionID=" + cookies.get("sessionID"),requestSetup)
            .then(response => response.json())
            .then(data => {
              if (data.status === -11){
                showExpiredPage({origin: origin, postID: postID,startPos: startPos,endPos:endPos, commentID: commentID});
              }else if (data.status === -1){
                showErrorPage({message: data.message, postID: postID, origin: origin, startPos: startPos,endPos:endPos, commentID: commentID})
              }else if (origin === "indepthPost" || origin === "indepthComment"){
                showInDepthPost(postID,startPos,endPos,"commentDeleted")
              }else if (origin === "userProfile"){
                showUserProfile(cookies.get("id"),startPos,endPos,"commentDeleted")
              }
            })
        }
      }
      //Edit Handlers
      function showEditPost(postID,origin,startPos,endPos,title = "",content = "", visibility = ""){
        function displayChangedCode(title,content,visibility){
          var visibilityToggle;
          if (!visibility || visibility === "public"){
            visibilityToggle = (
              <div>
                Anyone can see your post.
                <input type="checkbox" id='privacySwitch' value={'placeholder'}
                onChange={() => {handleCommentVisiToggle(0,origin,postID,startPos,endPos)}}
                ></input>
              </div>
            )
          }else{
            visibilityToggle = (
              <div>
                Only you and your viewers will be able to see this tweet.
                <input type="checkbox" id='privacySwitch' value={'placeholder'}
                onChange={() => {handleCommentVisiToggle(0,origin,postID,startPos,endPos)}} checked
                ></input>
              </div>
            )
          }
          changeCode(
            <div>
              <Button variant='dark' onClick={() => {cancel(origin,postID,0,cookies.get("id"),startPos,endPos)}} className='exitButton'>Cancel</Button>
              Editing Post
              <form onSubmit={(event) => {handleEditPost(event,postID,origin,startPos,endPos)}}>
                <h4> Post </h4>
                <input id='title' name='title' value={title}></input>
                <textarea className='noResize' rows='5' cols='50'
                 maxLength="200" id="comments" name="content" autoComplete="off" value={content} required>
                </textarea>
                <h4> Visibility </h4>
                {visibilityToggle}
                <Button onClick={(event) => {handleEditPost(event,postID,origin,startPos,endPos)}} type='submit'> Submit Changes </Button>
              </form>
            </div>
          )
        }
        if (!cookies.get("sessionID") || !cookies.get("id")){ //should replace with check sessionID FIX THIS
          cancel(origin,postID,0,(cookies.get("id") ? cookies.get("id") : 0),startPos,endPos);
        }else if (title !== "" || content !== "" || visibility !== ""){
          displayChangedCode(title,content,visibility)
        }else{
          fetch(serverLocation + "/post?postID=" + postID + "&userID=" + cookies.get("id") + "&sessionID=" + cookies.get("sessionID"))
            .then(response => response.json())
            .then(data => {
              console.log(data);
              if (data.status === -11){
                showExpiredPage({origin: origin, postID: postID,startPos: startPos,endPos:endPos});
              }else if (data.status === -1){
                showErrorPage({message: data.message, postID: postID, origin: origin, startPos: startPos,endPos:endPos})
              }else if (data.authorID !== cookies.get("id")){
                showErrorPage({message: "You're not allowed to edit that post.", postID: postID, origin: origin, startPos: startPos,endPos:endPos})
              }else{
                displayChangedCode(data.title,data.content,data.postVisibility);
              }
            })
        }
      }
      function handleEditPost(event,postID,origin,commentID,startPos,endPos){
        event.preventDefault();
        const requestSetup = {
            method: 'PATCH',
        }
        fetch(serverLocation + "/post?postID="+ postID + "&sessionID=" + cookies.get("sessionID") +
        "&userID=" + cookies.get("id") + "&visibility=" + document.getElementById("visibility").value
        + "&title=" + document.getElementById("title").value
        + "&content=" + document.getElementById("content").value,requestSetup)
          .then(response => response.json())
          .then(data => {
            if (data.status === -11){
                showExpiredPage({origin: origin, postID: postID,startPos: startPos,endPos:endPos});
            }else if (data.status === -1){
                showErrorPage({message: data.message, postID: postID, origin: origin, startPos: startPos,endPos:endPos})
            }else if (origin === "indepthPost"){
              showInDepthPost(postID,startPos,endPos,"Edit");
            }else if (origin === "userProfile"){
              showUserProfile(cookies.get("id"),startPos,endPos,"posts")
            }
          })
      }
      function showEditComment(commentID,origin,postID,startPos,endPos,comments = "",visibility = ""){
        function displayChangedCode(comments,visibility){
          var visibilityToggle;
          if (!visibility || visibility === "public"){
            visibilityToggle = (
              <div>
                Anyone can see your post.
                <input type="checkbox" id='privacySwitch' value={'placeholder'}
                onChange={() => {handleCommentVisiToggle(commentID,origin,postID,startPos,endPos)}}
                ></input>
              </div>
            )
          }else{
            visibilityToggle = (
              <div>
                Only you and your viewers will be able to see this tweet.
                <input type="checkbox" id='privacySwitch' value={'placeholder'}
                onChange={() => {handleCommentVisiToggle(commentID,origin,postID,startPos,endPos)}} checked
                ></input>
              </div>
            )
          }
          changeCode(
            <div>
              <Button variant='dark' onClick={() => {cancel(origin,postID,commentID,cookies.get("id"),startPos,endPos)}} className='exitButton'>Cancel</Button>
              Editing Comment
              <form onSubmit={(event) => {handleEditComment(event,commentID,origin,postID,startPos,endPos)}}>
                <h4> Comments </h4>
                <textarea className='noResize' rows='5' cols='50'
                 maxLength="200" id="comments" name="comments" autoComplete="off" value={comments} required>
                </textarea>
                <h4> Visibility </h4>
                {visibilityToggle}
                <Button onClick={(event) => {handleEditComment(event,commentID,origin,postID,startPos,endPos)}} type='submit'> Submit Changes </Button>
              </form>
            </div>
          )
        }
        if (!cookies.get("sessionID") || !cookies.get("id")){
          cancel(origin,postID,commentID,(cookies.get("id") ? cookies.get("id") : 0),startPos,endPos);
        } else if (comments !== "" || visibility !== ""){
          displayChangedCode(comments,visibility)
        }else{
          fetch(serverLocation + "/comment?commentID=" + commentID + "&userID=" + cookies.get("id") + "&sessionID=" + cookies.get("sessionID"))
            .then(response => response.json())
            .then(data => {
              console.log(data);
              if (data.status === -11){
                showExpiredPage({origin: origin, postID: postID,startPos: startPos,endPos:endPos, commentID: commentID});
              }else if (data.status === -1){
                showErrorPage({message: data.message, postID: postID, origin: origin, startPos: startPos,endPos:endPos, commentID: commentID})
              }else if (cookies.get("id") !== data.commenterID){
                showErrorPage({origin: origin, postID: postID, startPos: startPos, commentID: commentID, endPos: endPos,message: "You're not allowed to edit that comment."});
              }else{
                displayChangedCode(data.comments,data.commentVisibility);
              }
            })
        }
      }
      function handleEditComment(event,commentID,origin,postID,startPos,endPos){
        //send privacy comments sessionID and userID //FIX THIS: TEST LATER
        event.preventDefault();
        const requestSetup = {
            method: 'PATCH',
        }
        fetch(serverLocation + "/comment?commentID="+ commentID + "&sessionID=" + cookies.get("sessionID") +
        "&userID=" + cookies.get("id") + "&visibility=" + document.getElementById("visibility").value
        + "&comments=" + document.getElementById("comments").value,requestSetup)
          .then(response => response.json())
          .then(data => {
            if (data.status === -11){
                showExpiredPage({origin: origin, commentID: commentID, postID: postID,startPos: startPos,endPos:endPos});
            }else if (data.status === -1){
                showErrorPage({message: data.message, commentID: commentID, postID: postID, origin: origin, startPos: startPos,endPos:endPos})
            }else if (origin === "indepthComment"){
              showInDepthComment(commentID,"changed");
            }else if (origin === "indepthPost"){
              showInDepthPost(postID,startPos,endPos,"Edit")
            }else if (origin === "userProfile"){
              showUserProfile(cookies.get("id"),startPos,endPos,"comments")
            }
          })
      }
      function handleCommentVisiToggle(commentID,origin,postID,startPos,endPos){
        var visibility;
        if (document.getElementByID('privacySwitch').checked){
          visibility = "private"
        }else{
          visibility = "public";
        }
        showEditComment(commentID,origin,postID,startPos,endPos,document.getElementById('comments').value,visibility);
      }
      //like handlers
      function handlePostLike(postID,origin,commentID = 0,userID = 0, startPos = 0, endPos = 0, searchPosts = []){
        if (!cookies.get("sessionID") || !cookies.get("id")){
          getLoginPage(origin);
        }else{
          const requestSetup = {
              method: 'PUT',
          }
          fetch(serverLocation + "/like?postID=" + postID + "&sessionID=" + cookies.get('sessionID')
              + "&userID=" + cookies.get('id'),requestSetup)
            .then(response =>response.json())
            .then(data =>{
              if (data.status === -11){
                showExpiredPage({origin: origin, postID: postID, commentID: commentID,startPos: startPos,endPos:endPos});
              }
              else if (data.status === -1){
                showErrorPage({message: data.message, postID: postID, commentID: commentID, origin: origin, startPos: startPos,endPos:endPos})
              }else{
                if (origin === "userProfile"){
                  showUserProfile(userID,startPos,endPos,"posts");
                  // userID, start, end
                }else if (origin === "indepthPost"){
                  showInDepthPost(postID,"changed");
                }else if (origin === "indepthComment"){
                  showInDepthComment(commentID,"changed");
                    //commentID
                }else if (origin === "home"){
                  getHome(startPos,endPos)
                }else if (origin === "search"){
                  paginateSearchPage(searchPosts,startPos,endPos);
                }else{
                  showErrorPage({message: "No Origin Given", postID: postID, commentID: commentID, origin: origin, startPos: startPos,endPos:endPos})
                }
              }
            })
        }
      }
      function handlePostUnlike(postID,origin,commentID = 0, userID = 0, startPos = 0, endPos = 0, searchPosts = []){
        if (!cookies.get("sessionID") || !cookies.get("id")){
          getLoginPage(origin);
        }else{
          var sessionID = cookies.get('sessionID');
          var id = cookies.get('id');
          const requestSetup = {
              method: 'DELETE',
          }
          fetch(serverLocation + "/like?postID=" + postID + "&sessionID=" + sessionID + "&userID=" + id,requestSetup)
            .then(response => response.json())
            .then(data => {
              if (data.status === -11){
                showExpiredPage({origin: origin, postID: postID, commentID: commentID,startPos: startPos,endPos:endPos});
              }else if (data.status === -1){
                showErrorPage({message: data.message, postID: postID, commentID: commentID, origin: origin, startPos: startPos,endPos:endPos})
              }else{
                if (origin === "userProfile"){
                  showUserProfile(userID,startPos,endPos,"posts");
                }else if (origin === "indepthPost"){
                  showInDepthPost(postID,"changed");
                }else if (origin === "indepthComment"){
                  showInDepthComment(commentID,"changed");
                }else if (origin === "home"){
                  getHome(startPos,endPos)
                }else{
                  showErrorPage({message: "No Origin Given.", postID: postID, origin: origin, startPos: startPos,endPos:endPos})
                }
              }
            })
        }
      }
      function handleCommentLike(commentID,origin,postID = 0, userID = 0, startPos = 0, endPos = 0){
        if (!cookies.get("sessionID") || !cookies.get("id")){
          getLoginPage(origin);
        }else{
          var sessionID = cookies.get('sessionID');
          var id = cookies.get('id');
          const requestSetup = {
              method: 'PUT',
          }
          fetch(serverLocation + "/likeComment?commentID=" + commentID + "&sessionID=" + sessionID + "&userID=" + id,requestSetup)
            .then(response =>response.json())
            .then(data=>{
              console.log(data)
              if (data.status === -11){
                showExpiredPage({origin: origin, postID: postID, commentID: commentID,startPos: startPos,endPos:endPos});
              }else if (data.status === -1){
                showErrorPage({message: data.message, postID: postID, commentID: commentID, origin: origin, startPos: startPos,endPos:endPos})
              }else{
                if (origin === "userProfile"){
                  showUserProfile(userID,startPos,endPos,"comments");
                }else if (origin === "indepthPost"){
                  showInDepthPost(postID,startPos,endPos);
                }else if (origin === "indepthComment"){
                  showInDepthComment(commentID,"changed");
                }else{
                  showErrorPage({message: "No Origin Given.", postID: postID, commentID: commentID, origin: origin, startPos: startPos,endPos:endPos})
                }
              }
            })
        }
      }
      function handleCommentUnlike(commentID,origin,postID = 0, userID = 0, startPos = 0, endPos = 0){
        if (!cookies.get("sessionID") || !cookies.get("id")){
          getLoginPage(origin);
        }else{
          var sessionID = cookies.get('sessionID');
          var id = cookies.get('id');
          const requestSetup = {
              method: 'DELETE',
          }
          fetch(serverLocation + "/likeComment?commentID=" + commentID + "&sessionID=" + sessionID + "&userID=" + id,requestSetup)
            .then(response =>response.json())
            .then(data=>{
              console.log(data)
              if (data.status === -11){
                showExpiredPage({origin: origin, postID: postID, commentID: commentID,startPos: startPos,endPos:endPos});
              }else if (data.status === -1){
                showErrorPage({message: data.message, postID: postID, commentID: commentID, origin: origin, startPos: startPos,endPos:endPos})
              }else{
                if (origin === "userProfile"){
                  showUserProfile(userID,startPos,endPos,"comments");
                }else if (origin === "indepthPost"){
                  showInDepthPost(postID,startPos,endPos);
                }else if (origin === "indepthComment"){
                  showInDepthComment(commentID,"changed");
                }else{
                  showErrorPage({message: "No Origin Given", postID: postID, commentID: commentID, origin: origin, startPos: startPos,endPos:endPos})
                }
              }
            })
        }
      }
      //Navbar Changers
      function changeNavToLoggedIn(){
        changeNavBar(
          <Navbar bg="light" expand="lg" className='loggedInBar'>
        <Navbar.Brand
        onClick={() => getHome()}
        >QuickiePost</Navbar.Brand>
        <Navbar.Toggle aria-controls="navbarScroll" />
        <Navbar.Collapse id="navbarScroll">
          <Nav
            className="mr-auto my-2 my-lg-0 container-fluid"
            style={{ maxHeight: '100px' }}
            navbarScroll
          >
            <Nav.Link
            onClick={() => getHome()}
            >Home</Nav.Link>
            <Nav.Link
            onClick={getMyFeed}
            >My Feed</Nav.Link>
            <Nav.Link
            onClick={getSearchPage}
            >Search</Nav.Link>
            <Nav.Link
            onClick={getProfile}
            >My Profile</Nav.Link>
            <Nav.Link
            onClick={showWriteForm}
            >Write Post</Nav.Link>
            <Nav.Link
            onClick={logOut}
            >Log Out</Nav.Link>
            <Nav.Link>
            Toggle Light/Dark Mode</Nav.Link>
          </Nav>
        </Navbar.Collapse>
          </Navbar>
        )
      }
      function changeNavToLoggedOut(){
        changeNavBar(
          <Navbar bg="light" expand="lg" className='loggedOutBar'>
        <Navbar.Brand
        onClick={() => getHome()}
        >QuickiePost</Navbar.Brand>
        <Navbar.Toggle aria-controls="navbarScroll" />
        <Navbar.Collapse id="navbarScroll">
          <Nav
            className="mr-auto my-2 my-lg-0"
            style={{ maxHeight: '100px' }}
            navbarScroll
          >
            <Nav.Link
            onClick={() => getHome()}
            >Home</Nav.Link>
            <Nav.Link
            onClick={getRegistrationPage}
            >Register</Nav.Link>
            <Nav.Link
            onClick={getLoginPage}
            >Login</Nav.Link>
            <Nav.Link
            onClick={getSearchPage}
            >Search</Nav.Link>
            <Nav.Link>
            Toggle Light/Dark Mode</Nav.Link>
          </Nav>
        </Navbar.Collapse>
          </Navbar>
        )
      }
      //Registration Page
      function getRegistrationPage(origin){
        openLoginForm();
        var cancelButton;
        if (origin !== ""){
          if (origin === "indepthPost" || origin === "indepthComment"){
            cancelButton = (<Button variant='dark' onClick={() => {
              showInDepthPost();
            }} className='exitButton'>Cancel</Button>);
          }else{
            cancelButton = (<Button variant='dark' onClick={() => {
              showOnlyMain();
            }} className='exitButton'>Cancel</Button>);
          }
        }
        changeLoginCode(
          <div>
          {cancelButton}
          <form onSubmit={handleRegistration}>
            <h1> Registration Page</h1>
            <label htmlFor='userEmail'>Email</label>
            <br></br>
            <input type="email" name="userEmail" id="userEmail" required></input>
            <br></br>
            <label htmlFor="username">Username</label>
            <br></br>
            <input name="username" id="username" required></input>
            <br></br>
            <label htmlFor="pswrd">Password</label>
            <br></br>
            <input name="pswrd" type="password" id="pswrd" minLength="8" required></input>
            <br></br>
            <label htmlFor="confPswrd">Confirm Password</label>
            <br></br>
            <input name="confPswrd" type="password" id="confPswrd" minLength="8" required></input>
            <br></br>        <br></br>
            <Button variant='dark' type="submit"> Register </Button>
            <Button variant='dark' onClick={getLoginPage}> Already Have An Account? </Button>
          </form>
          </div>
        )
      }
      function handleRegistration(event){
        event.preventDefault();
        var email = document.getElementById("userEmail").value;
        var username = document.getElementById("username").value;
        var pswrd = document.getElementById("pswrd").value;
        var confPswrd = document.getElementById("confPswrd").value;
        if (!(pswrd === confPswrd)){
          changeCode(
            <div>
            <div className="errorMsg">Your passwords did not match.</div>
            <form onSubmit={handleRegistration}>
              <h1> Registration Page</h1>
              <label htmlFor='userEmail'>Email</label>
              <br></br>
              <input type="email" name="userEmail" id="userEmail" required></input>
              <br></br>
              <label htmlFor="username">Username</label>
              <br></br>
              <input name="username" id="username" required></input>
              <br></br>
              <label htmlFor="pswrd">Password</label>
              <br></br>
              <input name="pswrd" type="password" id="pswrd" minLength="8" required></input>
              <br></br>
              <label htmlFor="confPswrd">Confirm Password</label>
              <br></br>
              <input name="confPswrd" type="password" id="confPswrd" minLength="8" required></input>
              <br></br>        <br></br>
              <Button variant='dark' type="submit"> Register </Button>
            </form>
            </div>
          )
        }
        else{
          const requestSetup = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({email: email, username: username,pswrd:pswrd})
          };
          fetch(serverLocation+"/register",requestSetup)
            .then(response => response.json())
            .then(data => {
              if (data.status === 0){
                getLoginPage("");
              }
              else if (data.status === -1){//Various Error
                changeCode(
                  <div>
                  <div className="errMsg">There was an error. Please try again.</div>
                  <form onSubmit={handleRegistration}>
                    <h1> Registration Page</h1>
                    <label htmlFor='userEmail'>Email</label>
                    <br></br>
                    <input type="email" name="userEmail" id="userEmail" required></input>
                    <br></br>
                    <label htmlFor="username">Username</label>
                    <br></br>
                    <input name="username" id="username" required></input>
                    <br></br>
                    <label htmlFor="pswrd">Password</label>
                    <br></br>
                    <input name="pswrd" type="password" id="pswrd" minLength="8" required></input>
                    <br></br>
                    <label htmlFor="confPswrd">Confirm Password</label>
                    <br></br>
                    <input name="confPswrd" type="password" id="confPswrd" minLength="8" required></input>
                    <br></br>        <br></br>
                    <Button variant='dark' type="submit"> Register </Button>
                  </form>
                  </div>
                )
              }else if (data.status === -2){//Email Already Eists
                changeCode(
                  <div>
                  <div className="errMsg">An account with that email already exists.</div>
                  <form onSubmit={handleRegistration}>
                    <h1> Registration Page</h1>
                    <label htmlFor='userEmail'>Email</label>
                    <br></br>
                    <input type="email" name="userEmail" id="userEmail" required></input>
                    <br></br>
                    <label htmlFor="username">Username</label>
                    <br></br>
                    <input name="username" id="username" required></input>
                    <br></br>
                    <label htmlFor="pswrd">Password</label>
                    <br></br>
                    <input name="pswrd" type="password" id="pswrd" minLength="8" required></input>
                    <br></br>
                    <label htmlFor="confPswrd">Confirm Password</label>
                    <br></br>
                    <input name="confPswrd" type="password" id="confPswrd" minLength="8" required></input>
                    <br></br>        <br></br>
                    <Button variant='dark' type="submit"> Register </Button>
                  </form>
                  </div>
                )
              }
            })
        }
      }
      //Login Functions
      function handleLogin(event,origin){
          event.preventDefault();
          var email = document.getElementById("userEmail").value;
          var pswrd = document.getElementById("pswrd").value;
          var rememberMe = document.getElementById("rememberMe").checked ? "forever" : "hour";
          const requestSetup = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({email: email, pswrd:pswrd, rememberMe: rememberMe})
          };
          fetch(serverLocation+"/login",requestSetup)
            .then(response => response.json())
            .then(data => {
              console.log(data);
              if (data.status === -2){ //Invalid Combination
                getLoginPage(origin,"badCombo");
              }else if (data.status === -1){///Other Error
                showErrorPage({origin: "login", message:data.message})
              }else if (data.status === 0){//No Error
                cookies.set('name',data.username,{path:'/'});
                cookies.set('id',data.userID,{path:'/'});
                cookies.set('sessionID',data.sessionID,{path:'/'});
                cookies.set('expireTime',rememberMe === 'hour' ? Date.now() + 3600000 : "forever",{path:"/"});
                cookies.set('lightingMode',data.preference,{path:"/"});
                if (data.isAdmin && data.isAdmin === "admin"){
                  cookies.set("adminStatus",data.isAdmin,{path:"/"})
                }
                if (origin === ""){
                  window.location.reload();
                }else if (origin === "indepthPost" || origin === "indepthComment"){
                  openInDepthPost();
                }else{
                  showOnlyMain();
                }
              }
              else if (data.status === -3){//Account Was Hidden
                changeCode(
                  <div>
                    <h1> Account Not Active </h1>
                    <div>
                      Your account is currently deactivated, {data.username}. You can choose to reactivate your account,
                      but your public posts and comments will once again be publicly viewable, and users who are allowed to view
                      you will be able to see your private posts and comments.
                      <br></br>
                      If you would like to reactivate your account, you can receive an email to do so.
                      <Button onClick={() => {getHome()}}> Cancel Logging In </Button> <Button onClick={() => sendActivationAccountMessage(data.userID,data.username,data.rememberMe,origin)}> Reactivate Account </Button>
                    </div>
                  </div>
                )
              }
              else if (data.status === -13){
                changeCode(
                  <div>
                    <h1> Account Banned </h1>
                    <div> This account has been banned. </div>
                    <Button onClick={() => getHome()}> Return to Home </Button>
                  </div>
                )
              }
            });
      }
      function sendActivationAccountMessage(userID,username,rememberMe,origin,chances = 3){
        //Make a random code and send it in email
        const requestSetup = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({userID:userID})
        };
        fetch("reactivationCode",requestSetup)
          .then(response => response.json())
          .then(data => {
            changeLoginCode(
              <div>
                <h1> Reactivating Your Account </h1>
                <div>
                  You have now been sent a six-character code to the email associated with your account.
                  <br></br>
                  Please check your email and type the code in below to reactivate your account.
                  <br></br>
                  <Button onClick={() => {sendActivationAccountMessage(userID,username,rememberMe,origin,chances)}}> Resend Code </Button>
                  <br></br>
                  Remaining Chances: {chances}
                  <form onSubmit={(event) => handleReactivationCodeSubmission(event,userID,username,rememberMe,origin,3)}>
                    <input id="reactivationCode" name="reactivationCode" required>  </input>
                    <br></br>
                    <Button type='submit'> Reactivate Account </Button>
                  </form>
                </div>
              </div>
            )
          })
      }
      function handleReactivationCodeSubmission(event,userID,username,rememberMe,origin,chances){
        event.preventDefault();
        const requestSetup = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({rememberMe:rememberMe,userID:userID,reactivationCode:document.getElementById("reactivationCode")})
        }
        fetch(serverLocation + "/checkReactivationCode",requestSetup)
          .then(response => response.json())
          .then(data => {
            if (data.status === -1){
              //throw error
              showErrorPage({message: data.message,origin: "login"})
            }else if (data.status === -2){
              //deduct chances
              if (chances <= 1){
                changeLoginCode(
                  <div>
                    <h1> No More Remaining Chances </h1>
                    <div>
                      You have run out of chances to use your code.
                      <br></br>
                      <Button onClick={() => {sendActivationAccountMessage(userID,username,rememberMe,origin)}}> Resend Code </Button>
                    </div>
                  </div>
                )
              }else{
                sendActivationAccountMessage(userID,username,rememberMe,origin,chances - 1)
              }
            }else if (data.status === 0){
              // reactivate account
              cookies.set('name',username,{path:'/'});
              cookies.set('id',userID,{path:'/'});
              cookies.set('sessionID',data.sessionID,{path:'/'})
              cookies.set('expireTime',rememberMe === 'hour' ? Date.now() + 3600000 : "forever",{path:"/"})
              cookies.set('lightingMode',data.preference,{path:"/"});
              if (data.isAdmin && data.isAdmin === "admin"){
                cookies.set("adminStatus",data.isAdmin,{path:"/"})
              }
              if (origin === ""){
                window.location.reload();
              }else if (origin === "userProfileOptions"){
                showOnlyMain();
              }else if (origin === "indepthPost"){
                showInDepthPost();
              }else if (origin === "userProfilePosts"){
                showOnlyMain();
              }else if (origin === "userProfileComments"){
                showOnlyMain();
              }else if (origin === "indepthComment"){
                showInDepthPost();
              }else{
                showOnlyMain();
              }
            }
          })
      }
      function getLoginPage(origin = "",msg=""){
        var cancelButton;
        if (origin !== ""){
          if (origin === "indepthPost" || origin === "indepthComment"){
            cancelButton = (<Button variant='dark' onClick={() => {
              showInDepthPost();
            }} className='exitButton'>Cancel</Button>);
          }else{
            cancelButton = (<Button variant='dark' onClick={() => {
              showOnlyMain();
            }} className='exitButton'>Cancel</Button>);
          }
        }
        var overheadMsg;
        if (msg === "conf"){
          overheadMsg = (<div className="confMsg">You have successfully registered.</div>)
        }else if (msg === "err"){
          overheadMsg = (<div className="errMsg">There was an error. Please try again.</div>);
        }else if (msg === "badCombo"){
          overheadMsg = (<div className="errMsg">That was not a valid username/password combination.</div>);
        }
        openLoginForm();
        changeLoginCode(
          <div>
            {overheadMsg}
            {cancelButton}
            <form onSubmit={(event) => {handleLogin(event,origin = "")}}>
              <h1> Login Page </h1>
              <label htmlFor='userEmail'>Email</label>
              <br></br>
              <input type="email" name="userEmail" id="userEmail" required></input>
              <br></br>
              <label htmlFor="pswrd" >Password</label>
              <br></br>
              <input name="pswrd" type="password" id="pswrd" minLength="8" required></input>
              <br></br><br></br>
              <label htmlFor="rememberMe"> Remember Me?</label><br></br>
              <label className="switch">
              <input type="checkbox" id='rememberMe'
              ></input>
              <span className="slider round"></span>
              </label>
              <br></br><br></br>
              <Button variant='dark' type="submit"> Login </Button>
              <Button variant='dark' onClick={() => getRegistrationPage(origin)}> Don't Have An Account? </Button>
              <Button variant='dark' onClick={() => forgotPasswordPage(origin)}> </Button>
            </form>
          </div>
        )
      }
      function forgotPasswordPage(msg = ""){
        changeLoginCode(
          <div>
            <div className = "errorMsg"> {msg} </div>
            <h1> Forgot Your Password? </h1>
            <div> If you've forgotten your password, you can enter your email below to set a new password. </div>
            <form onSubmit={handleForgotPassword}>
              <input id='email' name='email' type='email' required> </input>
              <Button type='submit'> Submit </Button>
            </form>
            <Button onClick={getRegistrationPage}> I don't have an account. </Button>
            <Button onClick={getLoginPage}> I remember my password. </Button>
          </div>
        )
      }
      function handleForgotPassword(event){
        event.preventDefault();
        var email = document.getElementById('email').value;
        const requestSetup = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({email:email})
        };
        fetch(serverLocation + "/forgotPassword",requestSetup)
          .then(response => response.json())
          .then(data => {
            if (data.status === -1){
              showErrorPage({origin: "forgotPassword", message: data.message})
            }else if (data.status === -2){
              forgotPasswordPage("That email was not found.")
            }else{
              changeLoginCode(
                <div>
                  <h1> Password Recovery </h1>
                  <h3> You have been sent a code to the email {email}. Find it and enter it below.</h3>
                  Chances Left: 3
                  <br></br>
                  <form onSubmit={(event) => {handleForgotPasswordChances(email)}}>
                    Enter Code Here
                    <br></br>
                    <input type='hidden' value={email} id='email'> </input>
                    <input id='code' name='code' required> </input>
                    <Button type='submit'> Submit </Button>
                  </form>
                  <Button onClick = {() => handleForgotPassword()}> Resend Code </Button>
                </div>
              )
            }
          })
      }
      function handleForgotPasswordChances(event,email,chances = 3){
        var code = document.getElementById('code').value;
        var requestSetup = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({email:email,fpCode:code})
        }
        fetch(serverLocation + "/checkForgottenPassword" , requestSetup)
          .then(response=>response.json())
          .then(data=>{
            if (data.status === -1){
              showErrorPage({origin: "forgotPassword", message: data.message});
            }else if (data.status === -2){
              if (chances <= 1){
                changeLoginCode(
                  <div>
                  <h1> Password Recovery </h1>
                    <h3> You have run out of tries. </h3>
                    <input type='hidden' value={email} id='email'> </input>
                    <Button onClick = {() => handleForgotPassword()}> Resend Code </Button>
                  </div>
                )
              }else{
                changeLoginCode(
                  <div>
                  <h1> Password Recovery </h1>
                    <h3> You have been sent a code to the email {email}. Find it and enter it below.</h3>
                    Chances Left: {chances - 1}
                    <br></br>
                    <form onSubmit={(event) => {handleForgotPasswordChances(email,chances - 1)}}>
                      Enter Code Here
                      <br></br>
                      <input id='code' name='code' required> </input>
                      <input type='hidden' value={email} id='email'> </input>
                      <Button type='submit'> Submit </Button>
                    </form>
                    <Button onClick = {() => handleForgotPassword()}> Resend Code </Button>
                  </div>
                )
              }
            }else{
              changeLoginCode(
                <div>
                  <h1> Password Change </h1>
                  <form onSubmit={changePassword}>
                    <input type='hidden' value={email}> </input>
                    <label htmlFor='newPass'> Enter New Password: </label>
                    <br></br>
                    <input id='newPass' name='newPass' required></input>
                    <br></br>
                    <label htmlFor='confPass'>Confirm Password:</label>
                    <br></br>
                    <input id='confPass' name='confPass' required></input>
                    <Button type="submit"> Change Password </Button>
                  </form>
                </div>
              )
            }
          })
      }
      function changePassword(event){
        event.preventDefault();
        var password = document.getElementById('newPass').value;
        var confPass = document.getElementById('confPass').value;
        var email = document.getElementById('email').value;
        if (password !== confPass){
          changeLoginCode(
            <div>
              <div className='errorMsg'> Those passwords did not match. </div>
              <h1> Password Change </h1>
              <form onSubmit={changePassword}>
                <input type='hidden' value={email}> </input>
                <label htmlFor='newPass'> Enter New Password: </label>
                <br></br>
                <input id='newPass' name='newPass' required></input>
                <br></br>
                <label htmlFor='confPass'>Confirm Password:</label>
                <br></br>
                <input id='confPass' name='confPass' required></input>
                <Button type="submit"> Change Password </Button>
              </form>
            </div>
          )
        }else{
          var requestSetup = {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({email:email,pswrd: password})
          }
          fetch(serverLocation + "/user",requestSetup)
            .then(response => response.json())
            .then(data => {
              if (data.status === -1){
                showErrorPage({message: data.message, origin: "forgotPassword"})
              }else{
                changeLoginCode(
                  <div>
                    <h1> Password Successfully Changed</h1>
                    You may now use your new password to log in.
                    <br></br>
                    <Button onClick={getLoginPage}> Login </Button>
                  </div>
                )
              }
            })
        }
      }
      //Writing Comments
      function displayCommentWriter(postID, origin = "", startPos = 0, endPos = 10, postContent = ""){
        openInDepthPost();
        changeInDepthCode(
          <div>
          <Button variant='dark' className='exitButton' onClick={closeInDepthPost}>Close</Button>
          <form onSubmit={(event) => handleWritingComment(event,postID,origin,startPos,endPos)}>
          <h1>Add a Comment</h1>
          <label htmlFor='commentContent'>Content:</label>
          <br></br>
          <textarea className='noResize' rows='5' cols='50'
           maxLength="200" id="postContent" name="postContent" autoComplete="off" value={postContent} required>
          </textarea>
          <br></br>
          Private?
          <br></br>
          <label className="switch">
          <input type="checkbox" id='privacySwitch' value={'placeholder'}
          onChange={handlePrivacyToggled}
          ></input>
          <span className="slider round"></span>
          </label>
          <br></br>
          Anyone can view this comment.
          <br></br>
          <Button variant='dark' type="submit"> Submit Comment </Button>
          </form>
          </div>
        )
      }
      function handleWritingComment(event, postID, origin = "", startPos = 0, endPos = 10){
        event.preventDefault();
        var content = document.getElementById('postContent').value;
        var privacy = document.getElementById('privacySwitch').checked ? 'private' : 'public';
        const requestSetup = {
            method: 'PUT',
        }
        fetch(serverLocation+"/comment?userID=" + cookies.get('id') + "&sessionID="
          + cookies.get('sessionID') + "&postID=" + postID + "&content=" + content + "&privacy=" + privacy,requestSetup)
          .then(response => response.json())
          .then(data=>{
            if (data.status === -11){
              showExpiredPage({origin: "indepthPost", postID: postID, startPos: startPos, endPos: endPos});
            }else if (data.status === -1){
              showErrorPage({message: data.message,origin: "indepthPost", postID: postID, startPos: startPos, endPos: endPos});
            }else{
              showInDepthPost(postID,0,10,"Add");
            }
          })
      }
      function handlePrivacyToggled(postID, origin = "", startPos = 0, endPos = 10){
        var checked = document.getElementById('privacySwitch').checked;
        var content = document.getElementById('postContent');
        if (checked){
          hideWriteForm();
          changeCode(
            <div>
            <Button variant='dark' onClick={cancel} className='exitButton'>Cancel</Button>
            <form onSubmit={handleWritingComment}>
            <h1>Add a Comment</h1>

            <label htmlFor='commentContent'>Content:</label>
            <br></br>
            <textarea className='noResize' rows='5' cols='50'
             maxLength="200" id="postContent" name="postContent" autoComplete="off" required>
            </textarea>
            <br></br>
            Private?
            <br></br>
            <label className="switch">
            <input type="checkbox" id='privacySwitch' value={'placeholder'}
            onChange={handlePrivacyToggled} checked
            ></input>
            <span className="slider round"></span>
            </label>
            <br></br>
            Only those you've allowed can view this comment.
            <br></br>
            <Button variant='dark' type="submit"> Submit Comment </Button>
            </form>
            </div>
          )
        }else{
          displayCommentWriter(postID,origin,startPos,endPos,content);
        }
      }
      //Show Main Stuff Functions
      function showUserProfile(userID,startPos = 0, endPos = 10, variation = ""){
          //FIX THIS: Could memoize posts and comments for quick actions?
          //FIX THIS: check if changingcss is really needed?
          //Block List functions
          //FIX THIS: Expired Page should redirect to userprofule
          //Admin functions
          function confirmUserBan(toDo){

          }
          function handleUserBan(toDo){

          }
          //User Functions
          function showBlockedList(firstPoint = 0,secondPoint = 10){
            //show blocked users for a certain id
            showOnlyMain();
            var userID = cookies.get("id");
            var sessionID = cookies.get("sessionID");
            fetch(serverLocation + "/block?userID=" + userID + "&sessionID=" + sessionID)
              .then(response=>response.json())
              .then(data=>{
                if (data.status === -11){
                showExpiredPage({origin: 'userProfileOptions', startPos: firstPoint, endPos: secondPoint,userID:userID});
                }else if (data.status === -1){
                  showErrorPage({message: data.message, origin: 'userProfileBlockList', startPos: firstPoint, endPos: secondPoint,userID:userID});
                }else{
                  var listOfBlockedUsers;
                  var listOfBlockedUsers1 = [];
                  for (let i = firstPoint; i < Math.min(secondPoint,data.blockedUsers.length); i++){
                    listOfBlockedUsers1.push(
                      <tr key={i}>
                        <td>{data.blockedUsers[i].username}</td>
                        <td> <Button onClick={()=>{showUserProfile(data.blockedUsers[i].userID)}}> View Profile </Button></td>
                        <td> <Button onClick={()=>{unblockUser("blockMenu",firstPoint,secondPoint,data.blockedUsers[i].userID)}}> Unblock User </Button></td>
                      </tr>
                    )
                  }
                  if (data.blockedUsers.length === 0){
                    listOfBlockedUsers = (<div> You have not blocked any users.</div>)
                  }else{
                    listOfBlockedUsers = (
                      <table className='centeredTable'>
                        <thead>
                          <tr>
                            <th>Username</th>
                            <th>View Profile</th>
                            <th>Remove From Blocked List</th>
                          </tr>
                        </thead>
                        <tbody>
                      {listOfBlockedUsers1}
                        </tbody>
                      </table>
                    )
                  }
                  var paginationBar;
                  if (data.blockedUsers.length > 10){
                    var paginationSlots = [];
                    for (let i = 0; i < Math.ceil(data.blockedUsers.length / 10); i++){
                      paginationSlots.push(
                        <li><div className="dropdown-item" onClick={() => {showBlockedList(10 * i,Math.min(10*i+10,data.blockedUsers.length))}}>{10 * i + 1} through {Math.min(10*i+10,data.blockedUsers.length)}</div></li>
                      )
                    }
                    paginationBar = (
                      <ul className="nav nav-tabs">
                        <li className="nav-item dropdown">
                          <div className="nav-link dropdown-toggle" data-bs-toggle="dropdown" href="#" role="button" aria-expanded="false">Users Range</div>
                          <ul className="dropdown-menu">
                            {paginationSlots}
                          </ul>
                        </li>
                      </ul>
                    )
                  }
                  changeCode(
                    <div>
                    <Button variant='dark' onClick={() => {cancel(0,10,'options')}} className='exitButton'>Cancel</Button>
                    <h1> Users You've Blocked </h1>
                    {paginationBar}
                    {listOfBlockedUsers}
                    {paginationBar}
                    </div>
                  )
                }
              })
          }
          function blockUser(){
            var sessionID = cookies.get('sessionID');
            var id = cookies.get('id');
            const requestSetup = {
                method: 'PUT',
            }
            fetch(serverLocation + "/block?sessionID=" + sessionID + "&userID=" + id + "&blockedID=" + userID,requestSetup)
              .then(response => response.json())
              .then(data => {
                console.log(data);
                if (data.status === -11){
                  showExpiredPage({origin: 'userProfileOptions', userID: userID});
                }else if (data.status === -1){
                  showErrorPage({message: data.message, origin: 'userProfile', userID: userID});
                }else{
                  showUserProfile(userID,startPos,endPos,"options");
                }
              })
          }
          function unblockUser(variationBlock = 'none',startUser=0,endUser=10,profileID=userID){
            var sessionID = cookies.get('sessionID');
            var id = cookies.get('id');
            const requestSetup = {
                method: 'DELETE',
            }
            fetch(serverLocation + "/block?sessionID=" + sessionID + "&userID=" + id + "&blockedID=" + profileID,requestSetup)
              .then(response => response.json())
              .then(data => {
                console.log(data);
                if (data.status === -11){
                  showExpiredPage({origin: 'userProfileOptions', userID: userID});
                }
                else if (data.status === -1){
                  showErrorPage({message: data.message, origin: 'userProfileUnblock', userID: userID,startUser:0,endUser:10,profileID:userID})
                }else{
                  if (variationBlock === 'blockMenu'){
                    showBlockedList(startUser,endUser);
                  }else{
                    showUserProfile(profileID,startPos,endPos,"options");
                  }
                }
              })
          }
          //Viewership Functions
          function showPeopleImViewing(firstPoint = 0, secondPoint = 10){
            showOnlyMain();
            var userID = cookies.get("id");
            var sessionID = cookies.get("sessionID");
            fetch(serverLocation + "/whoimviewing?userID="+userID+"&sessionID="+sessionID)
                .then(response=>response.json())
                .then(data=>{
                  if (data.status === -11){
                    showExpiredPage({origin: 'userProfileOptions', userID:userID});
                  }else if (data.status === -1){
                    showErrorPage({message: data.message, origin: "userProfileImViewingList", userID: userID,firstPoint:firstPoint, secondPoint: secondPoint})
                  }else{
                    var tableOfUsers;
                    var listOfUsers = [];
                    for (let i = firstPoint; i < Math.min(secondPoint,data.listOfToView.length); i++){
                      listOfUsers.push(
                        <tr key={i}>
                          <td>{data.blockedUsers[i].username}</td>
                          <td> <Button onClick={()=>{showUserProfile(data.listOfToView[i].userID)}}> View Profile </Button></td>
                          <td> <Button onClick={()=>{removeViewership(data.listOfToView[i].userID,cookies.get('id'),firstPoint,secondPoint,"imviewing")}}> Stop Viewing User</Button></td>
                        </tr>
                      )
                    }
                    if (data.listOfToView.length === 0){
                      tableOfUsers = (<div> You are not viewing any users. </div>)
                    }else{
                      tableOfUsers = (
                        <table className='centeredTable'>
                          <thead>
                            <tr>
                              <th>Username</th>
                              <th>View Profile</th>
                              <th>Remove From Viewing List</th>
                            </tr>
                          </thead>
                          <tbody>
                          {listOfUsers}
                          </tbody>
                        </table>
                      )
                    }
                    var paginationBar;
                    if (data.listOfToView.length > 10){
                      var paginationSlots = [];
                      for (let i = 0; i < Math.ceil(data.listOfToView.length / 10); i++){
                        paginationSlots.push(

                          <li><div className="dropdown-item" onClick={() => {showPeopleImViewing(10 * i,Math.min(10*i+10,data.listOfToView.length))}}>{10 * i + 1} through {Math.min(10*i+10,data.listOfToView.length)}</div></li>
                        )
                      }
                      paginationBar = (
                        <ul className="nav nav-tabs">
                          <li className="nav-item dropdown">
                            <div className="nav-link dropdown-toggle" data-bs-toggle="dropdown" href="#" role="button" aria-expanded="false">Users Range</div>
                            <ul className="dropdown-menu">
                              {paginationSlots}
                            </ul>
                          </li>
                        </ul>
                      )
                    }
                    changeCode(
                      <div>
                      <Button variant='dark' onClick={() => {cancel(0,10,'options')}} className='exitButton'>Cancel</Button>
                      <h1> Users You're Viewing </h1>
                      {paginationBar}
                      {tableOfUsers}
                      {paginationBar}
                      </div>
                    )
                  }
                })
          }
          function showPeopleViewingMe(firstPoint = 0, secondPoint = 10){
            showOnlyMain();
            var userID = cookies.get("id");
            var sessionID = cookies.get("sessionID");
            fetch(serverLocation + "/whosviewingMe?userID="+userID+"&sessionID="+sessionID)
              .then(response=>response.json())
              .then(data=>{
                if (data.status === -11){
                    showExpiredPage({origin: 'userProfileOptions', userID:userID});
                }else if (data.status === -1){
                  showErrorPage({message: data.message, origin: "userProfileViewingMeList", userID: userID,firstPoint:firstPoint, secondPoint: secondPoint})
                }else{
                  var tableOfUsers;
                  var listOfUsers = [];
                  for (let i = firstPoint; i < Math.min(secondPoint,data.listOfToView.length); i++){
                    listOfUsers.push(
                      <tr key={i}>
                        <td>{data.blockedUsers[i].username}</td>
                        <td> <Button onClick={()=>{showUserProfile(data.listOfToView[i].userID)}}> View Profile </Button></td>
                        <td> <Button onClick={()=>{removeViewership()(cookies.get('id'),data.listOfToView[i].userID,firstPoint,secondPoint,"viewingme")}}> Stop Viewing User</Button></td>
                      </tr>
                    )
                  }
                  if (data.listOfToView.length === 0){
                    tableOfUsers = (<div> You are not viewing any users. </div>)
                  }else{
                    tableOfUsers = (
                      <table className='centeredTable'>
                        <thead>
                          <tr>
                            <th>Username</th>
                            <th>View Profile</th>
                            <th>Remove From Viewing List</th>
                          </tr>
                        </thead>
                        <tbody>
                        {listOfUsers}
                        </tbody>
                      </table>
                    )
                  }
                  var paginationBar;
                  if (data.listOfToView.length > 10){
                    var paginationSlots = [];
                    for (let i = 0; i < Math.ceil(data.listOfToView.length / 10); i++){
                      paginationSlots.push(

                        <li><div className="dropdown-item" onClick={() => {showPeopleViewingMe(10 * i,Math.min(10*i+10,data.listOfToView.length))}}>{10 * i + 1} through {Math.min(10*i+10,data.listOfToView.length)}</div></li>
                      )
                    }
                    paginationBar = (
                      <ul className="nav nav-tabs">
                        <li className="nav-item dropdown">
                          <div className="nav-link dropdown-toggle" data-bs-toggle="dropdown" href="#" role="button" aria-expanded="false">Users Range</div>
                          <ul className="dropdown-menu">
                            {paginationSlots}
                          </ul>
                        </li>
                      </ul>
                    )
                  }
                  changeCode(
                    <div>
                    <Button variant='dark' onClick={() => {cancel(0,10,'options')}} className='exitButton'>Cancel</Button>
                    <h1> Users Viewing You </h1>
                    {paginationBar}
                    {tableOfUsers}
                    {paginationBar}
                    </div>
                  )
                }
              })
          }
          function viewershipRequest(posterID,viewerID,variation){
            var sessionID = cookies.get('sessionID');
            var id = cookies.get("id");
            const requestSetup = {
                method: 'PUT'
            }
            fetch(serverLocation + "/viewership?userID=" + id + "&sessionID=" + sessionID
              + "&posterID="+ posterID + "&viewerID=" + viewerID,requestSetup)
            .then(response => response.json())
            .then(data =>{
              if (data.status === -11){
                    showExpiredPage({origin: 'userProfileOptions', userID:userID});
              }
              else if (data.status === -1){
                showErrorPage({message: data.message, origin: "userProfileOptions", userID: userID})
              }else{
                if (variation === "poster"){
                  showUserProfile(posterID,0,10,"options")
                }else if (variation === "viewer"){
                  showUserProfile(viewerID,0,10,"options")
                }else{
                  changeCode(<div><h1> Oops! </h1>An Error Has Occured.</div>)
                }
              }
            })
          }
          function cancelViewershipRequest(posterID,viewerID,variation){
            //for declining incoming and cancel outgoing requests
            var sessionID = cookies.get('sessionID');
            var id = cookies.get('id');
            const requestSetup = {
                method: 'PATCH',
            }
            fetch(serverLocation + "/viewership?userID=" + id + "&sessionID=" + sessionID +
              "&viewerID=" + viewerID + "&posterID=" + posterID,requestSetup)
              .then(response => response.json())
              .then(data=>{
                if (data.status === -11){
                    showExpiredPage({origin: 'userProfileOptions', userID:userID});
                }
                if (data.status === -1){
                showErrorPage({message: data.message, origin: "userProfileOptions", userID: userID})
                }else{
                  if (variation === "profile"){
                    showUserProfile(userID,0,10,"options");
                  }else{
                  changeCode(<div><h1> Oops! </h1>An Error Has Occured.</div>)
                  }
                }
              })
          }
          function removeViewership(posterID,viewerID,first,second,variation){
            var sessionID = cookies.get('sessionID');
            var id = cookies.get('id');
            const requestSetup = {
                method: 'DELETE',
            }
            fetch(serverLocation + "/viewership?posterID=" + posterID + "&viewerID=" + viewerID + "&sessionID=" + sessionID + "&userID=" + id,requestSetup)
              .then(response => response.json())
              .then(data => {
                if (data.status === -11){
                  showExpiredPage({origin: 'userProfileOptions', userID:userID});
                }else if (data.status === -1){
                  showErrorPage({message: data.message, origin: "userProfileOptions", userID: userID})
                }else{
                  if (variation === "imviewing"){
                    showPeopleImViewing(first,second);
                  }else if (variation === "viewingme"){
                    showPeopleViewingMe(first,second);
                  }else if (variation === "stopViewership"){
                    showUserProfile(posterID,0,10,"options");
                  }else if (variation === "stopViewingMe"){
                    showUserProfile(viewerID,0,10,"options")
                  }
                }
              })
          }
          //Main Showers
          function showLikedPosts(username,posts,comments,firstPoint = 0, secondPoint = 10){
            showOnlyMain();
            var userID = cookies.get("id");
            var sessionID = cookies.get("sessionID");
            fetch(serverLocation + "/mylikedposts?sessionID=" + sessionID + "&userID=" + userID)
              .then(response => response.json())
              .then(data => {
                if (data.status === -11){
                    showExpiredPage({origin: 'userProfileOptions', userID:userID});
                }else if (data.status === -1){
                    showErrorPage({message: data.message,origin: 'userProfileLikedPosts', userID:userID, firstPoint: firstPoint,secondPoint: secondPoint});
                }else{
                  var listOfPosts = [];
                  if (data.contents.length === 0){
                    listOfPosts = (<div> You have not liked any posts that are still visible. </div>)
                  }
                  else{
                    for (let i = firstPoint; i < Math.min(secondPoint,data.contents.length); i++){
                      //push a simple post?
                      var dict = data.contents[i];
                      listOfPosts.push(
                        <Card key={i}>
                          <Card.Title> {dict.title} </Card.Title>
                          <Card.Subtitle> {"Username: " + dict.username} </Card.Subtitle>
                          <Card.Subtitle> {"User ID: " + dict.userID} </Card.Subtitle>
                          <Card.Body> {dict.content} </Card.Body>
                          <Card.Subtitle> {dict.subDate} </Card.Subtitle>
                          <Card.Body>
                          Likes: {dict.totalLikes} Comments: {dict.totalComments}
                          <br></br>
                          <Button onClick={()=>{showInDepthPost(data.contents[i].postID)}}> Expand Post </Button>
                          </Card.Body>
                        </Card>
                      )
                    }
                  }
                  var paginationBar;
                  if (data.contents.length > 10){
                    var paginationSlots = [];
                    for (let i = 0; i < Math.ceil(data.contents.length / 10); i++){
                      paginationSlots.push(
                        <li><div className="dropdown-item" onClick={() => {showLikedPosts(10 * i,Math.min(10*i+10,data.contents.length))}}>{10 * i + 1} through {Math.min(10*i+10,data.contents.length)}</div></li>
                      )
                    }
                    paginationBar = (
                      <ul className="nav nav-tabs">
                        <li className="nav-item dropdown">
                          <div className="nav-link dropdown-toggle" data-bs-toggle="dropdown" href="#" role="button" aria-expanded="false">Posts Range</div>
                          <ul className="dropdown-menu">
                            {paginationSlots}
                          </ul>
                        </li>
                      </ul>
                    )
                  }
                  changeCode(
                    <div>
                    <h1> {username}'s Profile </h1>
                    <ul className="nav nav-tabs justify-content-center">
                      <li className="nav-item">
                        <div className="nav-link"  onClick={() => {showPosts(username,posts,0,10,comments)}}>{username}'s Posts</div>
                      </li>
                      <li className="nav-item">
                        <div className="nav-link" onClick={()=>{showComments(username,comments,0,10,posts)}}>{username}'s Comments</div>
                      </li>
                      <li className="nav-item">
                        <div className="nav-link active" aria-current="page" onClick={() => {showLikedPosts(username,posts,comments)}}> Liked Posts </div>
                      </li>
                      <li className="nav-item">
                        <div className="nav-link" aria-current="page" onClick={() => {showLikedComments(username,posts,comments)}}> Liked Comments </div>
                      </li>
                      <li className="nav-item">
                        <div className="nav-link" aria-current="page" onClick={() => {showOptions(username,posts,comments)}}> Options </div>
                      </li>
                    </ul>
                    <div>
                      {paginationBar}
                      {listOfPosts}
                      {paginationBar}
                    </div>
                    </div>
                  )
                }
              })
          }
          function showLikedComments(username,posts,comments,firstPoint = 0,secondPoint = 10){
            showOnlyMain();
            var userID = cookies.get("id");
            var sessionID = cookies.get("sessionID");
            fetch(serverLocation + "/mylikedcomments?sessionID=" + sessionID + "&userID=" + userID)
              .then(response => response.json())
              .then(data => {
                if (data.status === -11){
                  showExpiredPage({origin: 'userProfile', userID:userID});
                }else if (data.status === -1){
                  showErrorPage({message: data.message,origin: 'userProfileLikedPosts', userID:userID, firstPoint: firstPoint,secondPoint: secondPoint});
                }else{
                  var listOfComments = [];
                  var listOfCommentsCode;
                  if (data.contents.length === 0){
                    listOfCommentsCode = (<div> You have not liked any comments that are still visible. </div>);
                  }else{
                    for (let i = firstPoint;  i < Math.min(secondPoint,data.contents.length); i++){
                      var dict = data.contents[i];
                      listOfComments.push(
                        <Card key={i}>
                          <Card.Subtitle> {"Username: " + dict.username} </Card.Subtitle>
                          <Card.Subtitle> {"User ID: " + dict.userID} </Card.Subtitle>
                          <Card.Body> {dict.comments} </Card.Body>
                          <Card.Subtitle> {dict.commentDate} </Card.Subtitle>
                          <Card.Body>
                          <br></br>
                          <Button onClick={()=>{showInDepthComment(data.contents[i].commentID)}}> Expand Post </Button>
                          </Card.Body>
                        </Card>
                      )
                    }
                    listOfCommentsCode = (
                      <ul>
                        {listOfComments}
                      </ul>
                    )
                  }
                  var paginationBar;
                  if (data.contents.length > 10){
                    var paginationSlots = [];
                    for (let i = 0; i < Math.ceil(data.contents.length / 10); i++){
                      paginationSlots.push(
                        <li><div className="dropdown-item" onClick={() => {showLikedComments(10 * i,Math.min(10*i+10,data.contents.length))}}>{10 * i + 1} through {Math.min(10*i+10,data.contents.length)}</div></li>
                      )
                    }
                    paginationBar = (
                      <ul className="nav nav-tabs">
                        <li className="nav-item dropdown">
                          <div className="nav-link dropdown-toggle" data-bs-toggle="dropdown" href="#" role="button" aria-expanded="false">Posts Range</div>
                          <ul className="dropdown-menu">
                            {paginationSlots}
                          </ul>
                        </li>
                      </ul>
                    )
                  }
                  changeCode(
                    <div>
                    <h1> {username}'s Profile </h1>
                    <ul className="nav nav-tabs justify-content-center">
                      <li className="nav-item">
                        <div className="nav-link"  onClick={() => {showPosts(username,posts,0,10,comments)}}>{username}'s Posts</div>
                      </li>
                      <li className="nav-item">
                        <div className="nav-link" onClick={()=>{showComments(username,comments,0,10,posts)}}>{username}'s Comments</div>
                      </li>
                      <li className="nav-item">
                        <div className="nav-link" aria-current="page" onClick={() => {showLikedPosts(username,posts,comments)}}> Liked Posts</div>
                      </li>
                      <li className="nav-item">
                        <div className="nav-link active" aria-current="page" onClick={() => {showLikedComments(username,posts,comments)}}> Liked Comments </div>
                      </li>
                      <li className="nav-item">
                        <div className="nav-link" aria-current="page" onClick={() => {showOptions(username,posts,comments)}}> Options </div>
                      </li>
                    </ul>
                    <div>
                      {paginationBar}
                      {listOfCommentsCode}
                      {paginationBar}
                    </div>
                    </div>
                  )
                }
              })
          }
          function showOptions(username,posts,comments,variation=null){
            showOnlyMain();
            var optionsMenu;
            if (cookies.get("sessionID") && cookies.get("id")){
              if (cookies.get('id') === userID){//isowner
                var banner;
                if (variation === "privacyChanged"){
                  banner = (<div className='confMsg'>Your visibility settings have successfully been changed.</div>)
                }
                optionsMenu = (
                  <div>
                    {banner}
                    <Button onClick={() => {showBlockedList()}}> View Blocked List </Button>
                    <br></br>
                    <Button onClick={() => {showPeopleImViewing()}}>View List Of People You're Viewing</Button>
                    <br></br>
                    <Button onClick={()=>{showPeopleViewingMe()}}>View List Of People Who Are Viewing You</Button>
                    <br></br>
                    <Button onClick={()=>{showPrivacyTogglePage()}}> Change Your Visibility </Button>
                    <br></br>
                    <Button onClick={() => {showDeactivationPage()}}>Deactivate Account</Button>
                  </div>
                );
                changeCode(
                  <div>
                  <h1> {username}'s Profile </h1>
                  <ul className="nav nav-tabs justify-content-center">
                    <li className="nav-item">
                      <div className="nav-link"  onClick={() => {showPosts(username,posts,0,10,comments)}}>{username}'s Posts</div>
                    </li>
                    <li className="nav-item">
                      <div className="nav-link" onClick={()=>{showComments(username,comments,0,10,posts)}}>{username}'s Comments</div>
                    </li>
                      <li className="nav-item">
                        <div className="nav-link active" aria-current="page" onClick={() => {showLikedPosts(username,posts,comments)}}> Liked Posts </div>
                      </li>
                      <li className="nav-item">
                        <div className="nav-link" aria-current="page" onClick={() => {showLikedComments(username,posts,comments)}}> Liked Comments </div>
                      </li>
                    <li className="nav-item">
                      <div className="nav-link active" aria-current="page" onClick={() => {showOptions(username,posts,comments)}}> Options </div>
                    </li>
                  </ul>
                  {optionsMenu}
                  </div>
                )
              }else if (cookies.get("adminStatus") === "admin"){
                fetch(serverLocation + "/relationship?sessionID=" + cookies.get("sessionID") + "&userID=" + cookies.get("id") + "&profileID=" + userID)
                  .then(response=>response.json())
                  .then(data =>{
                    console.log(data);
                    if (data.status === -11){
                      showExpiredPage({origin: 'userProfileOptions', userID:userID});
                    }
                    else if (data.status === -1){
                      showErrorPage({origin: 'userProfileOptions', message: data.message, userID:userID})
                    }else{
                      var blockButton = (<Button variant='danger' onClick={() => blockUser()}> Block User </Button>);
                      if (data.blockingThem && data.blockingThem === 'true'){
                        blockButton = (<Button variant='danger' onClick={() => unblockUser()}> Unblock User </Button>)
                      }
                      var conferViewershipButton = (<Button variant='info' onClick={()=>{viewershipRequest(cookies.get('id'),userID,"poster")}}> Confer Viewership </Button>);
                      if (data.viewingMe && data.viewingMe === "true"){
                        conferViewershipButton = (<Button variant='info' onClick={()=>{removeViewership(cookies.get("id"),userID,0,10,"stopViewingMe")}}>Remove User's Viewership Of You</Button>);
                      }
                      else if (data.blockingThem && data.blockingThem === 'true'){
                        conferViewershipButton = (<div> Since you are blocking them, you may not interact with viewership between you and this user.</div>);
                      }
                      else if (data.blockingMe && data.blockingMe === "true"){
                        conferViewershipButton = (<div> Since this user is blocking you, you may not interact with viewership between you and this user.</div>);
                      }
                      else if (data.theyHaveRequestedToViewMe && data.theyHaveRequestedToViewMe === 'true'){
                        conferViewershipButton =
                          (
                            <div>
                              This user has sent you a viewership request for them to view you.
                              <br></br>
                              <Button onClick={() => {viewershipRequest(cookies.get('id'),userID,'viewer')}}>Accept Request</Button>
                              <br></br>
                              <Button onClick={() => {cancelViewershipRequest(cookies.get("id"),userID,"profile")}}>Deny Request</Button>
                              <br></br>
                            </div>
                          )
                      } else if (data.iHaveRequestedToViewMe && data.iHaveRequestedToViewMe === 'true'){
                        conferViewershipButton = (<div>This user has not yet responded to your request for them to view you.<br></br><Button onClick={() => {cancelViewershipRequest(cookies.get("id"),userID,"profile")}}>Cancel Request</Button></div>)
                      }
                      var banButton = (<div></div>);
                      if (data.classification !== 'admin' && data.isBanned === "false"){
                        banButton = (<Button onClick={confirmUserBan("ban")}> Ban User </Button>);
                      }else if (data.classification !== 'admin' && data.isBanned === "true"){
                        banButton = (<Button onClick={confirmUserBan("unban")}> Unban User </Button>);
                      }
                      optionsMenu = (
                        <div>
                          <br></br>
                          {conferViewershipButton}
                          <br></br>
                          {blockButton}
                          <br></br>
                          {banButton}
                        </div>
                      );
                      changeCode(
                        <div>
                        <h1> {username}'s Profile </h1>
                        <ul className="nav nav-tabs justify-content-center">
                          <li className="nav-item">
                            <div className="nav-link"  onClick={() => {showPosts(username,posts,0,10,comments)}}>{username}'s Posts</div>
                          </li>
                          <li className="nav-item">
                            <div className="nav-link" onClick={()=>{showComments(username,comments,0,10,posts)}}>{username}'s Comments</div>
                          </li>
                          <li className="nav-item">
                            <div className="nav-link active" aria-current="page" onClick={() => {showLikedPosts(username,posts,comments)}}> Options </div>
                          </li>
                          <li className="nav-item">
                            <div className="nav-link active" aria-current="page" onClick={() => {showOptions(username,posts,comments)}}> Options </div>
                          </li>
                        </ul>
                        {optionsMenu}
                        </div>
                      )
                    }
                  })
              }
              else{//issomeoneelse
                fetch(serverLocation + "/relationship?sessionID=" + cookies.get("sessionID") + "&userID=" + cookies.get("id") + "&profileID=" + userID)
                  .then(response=>response.json())
                  .then(data =>{
                    console.log(data);
                    if (data.status === -11){
                      showExpiredPage({origin: 'userProfileOptions', userID:userID});
                    }
                    else if (data.status === -1){
                      showErrorPage({origin: 'userProfileOptions', message: data.message, userID:userID})
                    }else{
                      var blockButton = (<Button variant='danger' onClick={() => blockUser()}> Block User </Button>);
                      if (data.classification === "admin"){
                        blockButton = (<div></div>)
                      }
                      else if (data.blockingThem && data.blockingThem === 'true'){
                        blockButton = (<Button variant='danger' onClick={() => unblockUser()}> Unblock User </Button>)
                      }
                      var requestViewershipButton = (<Button variant='info' onClick={() => viewershipRequest(userID,cookies.get('id'),"poster")}> Request Viewership </Button>);
                      if (data.viewingThem && data.viewingThem === 'true'){
                        requestViewershipButton = (<Button variant='info' onClick={()=>{removeViewership(userID,cookies.get("id"),0,10,"stopViewership")}}> Stop Viewing This User</Button>)
                      }
                      else if (data.blockingThem && data.blockingThem === 'true'){
                        requestViewershipButton = (<div> Since you are blocking them, you may not interact with viewership between you and this user.</div>)
                      }
                      else if (data.blockingMe && data.blockingMe === "true"){
                        requestViewershipButton = (<div> Since this user is blocking you, you may not interact with viewership between you and this user.</div>)
                      }
                      else if (data.theyHaveRequestedToViewThem && data.theyHaveRequestedToViewThem === "true"){
                        requestViewershipButton =
                        (
                          <div>
                            This user has sent you a viewership request to become their viewer.
                            <br></br>
                            <Button onClick={() => {viewershipRequest(userID,cookies.get('id'),'poster')}}>Accept Request</Button>
                            <br></br>
                            <Button onClick={() => {cancelViewershipRequest(userID,cookies.get('id'),"profile")}}>Deny Request</Button>
                            <br></br>
                          </div>
                        )
                      }else if (data.iHaveRequestedToViewThem && data.iHaveRequestedToViewThem === 'true'){
                        requestViewershipButton = (<div>This user has not yet responded to your request for you to view them.<br></br><Button onClick={() => {cancelViewershipRequest(userID,cookies.get('id'),"profile")}}>Cancel Request</Button></div>)
                      }
                      var conferViewershipButton = (<Button variant='info' onClick={()=>{viewershipRequest(cookies.get('id'),userID,"poster")}}> Confer Viewership </Button>);
                      if (data.classification === "admin"){
                        conferViewershipButton = (<div></div>)
                      }
                      else if (data.viewingMe && data.viewingMe === "true"){
                        conferViewershipButton = (<Button variant='info' onClick={()=>{removeViewership(cookies.get("id"),userID,0,10,"stopViewingMe")}}>Remove User's Viewership Of You</Button>);
                      }
                      else if (data.blockingThem && data.blockingThem === 'true'){
                        conferViewershipButton = (<div> Since you are blocking them, you may not interact with viewership between you and this user.</div>);
                      }
                      else if (data.blockingMe && data.blockingMe === "true"){
                        conferViewershipButton = (<div> Since this user is blocking you, you may not interact with viewership between you and this user.</div>);
                      }
                      else if (data.theyHaveRequestedToViewMe && data.theyHaveRequestedToViewMe === 'true'){
                        conferViewershipButton =
                          (
                            <div>
                              This user has sent you a viewership request for them to view you.
                              <br></br>
                              <Button onClick={() => {viewershipRequest(cookies.get('id'),userID,'viewer')}}>Accept Request</Button>
                              <br></br>
                              <Button onClick={() => {cancelViewershipRequest(cookies.get("id"),userID,"profile")}}>Deny Request</Button>
                              <br></br>
                            </div>
                          )
                      } else if (data.iHaveRequestedToViewMe && data.iHaveRequestedToViewMe === 'true'){
                        conferViewershipButton = (<div>This user has not yet responded to your request for them to view you.<br></br><Button onClick={() => {cancelViewershipRequest(cookies.get("id"),userID,"profile")}}>Cancel Request</Button></div>)
                      }
                      optionsMenu = (
                        <div>
                          <br></br>
                          {conferViewershipButton}
                          <br></br>
                          {requestViewershipButton}
                          <br></br>
                          {blockButton}
                          <br></br>
                        </div>
                      );
                      changeCode(
                        <div>
                        <h1> {username}'s Profile </h1>
                        <ul className="nav nav-tabs justify-content-center">
                          <li className="nav-item">
                            <div className="nav-link"  onClick={() => {showPosts(username,posts,0,10,comments)}}>{username}'s Posts</div>
                          </li>
                          <li className="nav-item">
                            <div className="nav-link" onClick={()=>{showComments(username,comments,0,10,posts)}}>{username}'s Comments</div>
                          </li>
                          <li className="nav-item">
                            <div className="nav-link active" aria-current="page" onClick={() => {showLikedPosts(username,posts,comments)}}> Options </div>
                          </li>
                          <li className="nav-item">
                            <div className="nav-link active" aria-current="page" onClick={() => {showOptions(username,posts,comments)}}> Options </div>
                          </li>
                        </ul>
                        {optionsMenu}
                        </div>
                      )
                    }
                  })
              }
            }else{
              optionsMenu = (
                <div>
                You will need to be logged in to view these options.
                <br></br>
                <Button onClick={() => {getLoginPage("userProfileOptions")}}> Login </Button>
                </div>
              );
              changeCode(
                <div>
                <h1> {username}'s Profile </h1>
                <ul className="nav nav-tabs justify-content-center">
                  <li className="nav-item">
                    <div className="nav-link"  onClick={() => {showPosts(username,posts,0,10,comments)}}>{username}'s Posts</div>
                  </li>
                  <li className="nav-item">
                    <div className="nav-link" onClick={()=>{showComments(username,comments,0,10,posts)}}>{username}'s Comments</div>
                  </li>
                  <li className="nav-item">
                    <div className="nav-link active" aria-current="page" onClick={() => {showOptions(username,posts,comments)}}> Options </div>
                  </li>
                </ul>
                {optionsMenu}
                </div>
              )
            }
          }
          function showComments(username,comments,start,end,posts){
            showOnlyMain();
            var listOfShownComments = [];
            var likeText = (<Button className='likeText' onClick={() => {getLoginPage("userProfileComments")}}>Like</Button>);
            for (let i = start; i < (Math.min(end,comments.length)); i++){
              var dict = comments[i];
              if (cookies.get('sessionID') && cookies.get('id')){
                likeText = (<Button className='likeText' onClick={() => {handleCommentLike(comments[i].commentID,"userProfile",0,userID,start,end)}}>Like</Button>);
                if (dict.Liked === "Liked"){
                  likeText = (<Button className='likeText'onClick={() => {handleCommentUnlike(comments[i].commentID,"userProfile",0,userID,start,end)}}>Unlike </Button>);
                }
              }
              var ownerAbilities;
              if (cookies.get("id") === userID){
                ownerAbilities = (
                  <Card.Body>
                  <Button onClick={()=>{showEditComment(comments[i].commentID,"indepthComment",comments[i].postID,start,end)}}>Edit Comment</Button>
                  <br></br>
                  <Button onClick={()=>{showDeleteCommentConfirmation(comments[i].commentID,"indepthComment",comments[i].postID,start,end)}}> Delete Comment </Button>
                  </Card.Body>
                )
              }
              listOfShownComments.push(
                <Card key={i}>
                  <Card.Subtitle> <div className='linkText' onClick={() => {showInDepthComment(comments[i].commentID,0,10)}}>View Comment</div> </Card.Subtitle>
                  <Card.Subtitle> {"Username: " + dict.username} </Card.Subtitle>
                  <Card.Body> {dict.comments} </Card.Body>
                  <Card.Subtitle> {dict.subDate} </Card.Subtitle>
                  <Card.Body>
                  Likes: {dict.totalLikes}
                  <br></br>
                  {likeText}
                  </Card.Body>
                  {ownerAbilities}
                </Card>
              )
            }
            var paginationBar;
            if (comments.length > 10){
              var paginationSlots = [];
              for (let i = 0; i < Math.ceil(comments.length / 10); i++){
                paginationSlots.push(

                  <li><div className="dropdown-item" onClick={() => {showComments(username,comments,10 * i,Math.min(10*i+10,comments.length),posts)}}>{10 * i + 1} through {Math.min(10*i+10,comments.length)}</div></li>
                )
              }
              paginationBar = (
                <ul className="nav nav-tabs">
                  <li className="nav-item dropdown">
                    <div className="nav-link dropdown-toggle" data-bs-toggle="dropdown" href="#" role="button" aria-expanded="false">Comments Range</div>
                    <ul className="dropdown-menu">
                      {paginationSlots}
                    </ul>
                  </li>
                </ul>
              )
            }
            if (listOfShownComments.length === 0){
              listOfShownComments = (<div>There are no comments to view.</div>)
            }
            var topBar;
            if (cookies.get("id") && cookies.get("id") === userID){
              topBar = (
                <ul className="nav nav-tabs justify-content-center">
                  <li className="nav-item">
                    <div className="nav-link"  onClick={() => {showPosts(username,posts,0,10,comments)}}>{username}'s Posts</div>
                  </li>
                  <li className="nav-item">
                    <div className="nav-link active" aria-current="page" onClick={()=>{showComments(username,comments,0,10,posts)}}>{username}'s Comments</div>
                  </li>
                  <li className="nav-item">
                    <div className="nav-link" aria-current="page" onClick={() => {showLikedPosts(username,posts,comments)}}> Liked Posts </div>
                  </li>
                  <li className="nav-item">
                    <div className="nav-link" aria-current="page" onClick={() => {showLikedComments(username,posts,comments)}}> Liked Comments </div>
                  </li>
                  <li className="nav-item">
                    <div className="nav-link"  onClick={() => {showOptions(username,posts,comments)}}> Options </div>
                  </li>
                </ul>
              )
            }else{
              topBar = (
                <ul className="nav nav-tabs justify-content-center">
                  <li className="nav-item">
                    <div className="nav-link"  onClick={() => {showPosts(username,posts,0,10,comments)}}>{username}'s Posts</div>
                  </li>
                  <li className="nav-item">
                    <div className="nav-link active" aria-current="page" onClick={()=>{showComments(username,comments,0,10,posts)}}>{username}'s Comments</div>
                  </li>
                  <li className="nav-item">
                    <div className="nav-link"  onClick={() => {showOptions(username,posts,comments)}}> Options </div>
                  </li>
                </ul>
              )
            }
            var msg;
            if (variation === "commentDeleted"){
              msg = (<div className='confMsg'> Your comment was deleted. </div>)
            }
            changeCode(
              <div>
              {msg}
              <h1> {username}'s Profile </h1>
              {topBar}
              <div className='centerAlignPaginationBar'> {paginationBar}  </div>
              <div className='listOfStuffs'>
                {listOfShownComments}
              </div>
              <div className='centerAlignPaginationBar'> {paginationBar}  </div>
              </div>
            )
          } ///Doesnt test session
          function showPosts(username,posts,start,end,comments, variation = ""){
            showOnlyMain();
            var listOfShownPosts = [];
            var detect = cookies.get('id') && cookies.get('sessionID');
            for (let i = start; i < (Math.min(end,posts.length)); i++){
              var dict = posts[i];
              var likeText = (<Button className='likeText' onClick={() => {getLoginPage("userProfilePosts")}}>Like</Button>);
              if (detect){
                likeText = (<Button className='likeText' onClick={() => {handlePostLike(posts[i].postID,"userProfile",0,userID,startPos,endPos)}}>Like</Button>);
                if (dict.isLiked === "Liked"){
                  likeText = (<Button className='likeText'onClick={() => {handlePostUnlike(posts[i].postID,"userProfile",0,userID,startPos,endPos)}}>Unlike </Button>);
                }
              }
              var ownerAbilities;
              if (userID === cookies.get("id")){
                ownerAbilities = (
                  <Card.Body>
                    <Button onClick={() => {showEditPost(posts[i].postID,"userProfile",startPos,endPos)}}> Edit Post </Button>
                    <br></br>
                    <Button onClick={() => {showDeletePostConfirmation(posts[i].postID,"indepthPost",startPos,endPos)}}> Delete Post </Button>
                  </Card.Body>
                )
              }
              listOfShownPosts.push(
                <Card key={i}>
                  <Card.Title> {dict.title} </Card.Title>
                  <Card.Subtitle> <div className='linkText' onClick={() => {showInDepthPost(posts[i].postID,0,10)}}>View Post</div> </Card.Subtitle>
                  <Card.Subtitle> {"Username: " + dict.username} </Card.Subtitle>
                  <Card.Body> {dict.content} </Card.Body>
                  <Card.Subtitle> {dict.subDate} </Card.Subtitle>
                  <Card.Body>
                  Likes: {dict.totalLikes} Comments: {dict.totalComments}
                  <br></br>
                  {likeText}
                  </Card.Body>
                  {ownerAbilities}
                </Card>
              )
            }
            var paginationBar;
            if (posts.length > 10){
              var paginationSlots = [];
              for (let i = 0; i < Math.ceil(posts.length/10); i++){
                paginationSlots.push(
                  <li key={10*i+1}><div className="dropdown-item" onClick={() => {showPosts(username,posts,10 * i,Math.min(10*i+10,posts.length),comments)}}>{10 * i + 1} through {Math.min(10*i+10,posts.length)}</div></li>
                )
              }
              paginationBar = (
                <ul className="nav nav-tabs">
                  <li className="nav-item dropdown">
                    <div className="nav-link dropdown-toggle" data-bs-toggle="dropdown" href="#" role="button" aria-expanded="false">Posts Range</div>
                    <ul className="dropdown-menu">
                      {paginationSlots}
                    </ul>
                  </li>
                </ul>
              )
            }
            if (listOfShownPosts.length === 0){
              listOfShownPosts = (<div>This user has no posts to show.</div>)
            }
            var msg;
            if (variation === "Delete"){
              msg = (<div className='confMsg'> Your post was deleted. </div>)
            }
            var topBar;
            if (cookies.get("id") && cookies.get("id") === userID){
              topBar = (
                <ul className="nav nav-tabs justify-content-center">
                  <li className="nav-item">
                    <div className="nav-link active"  onClick={() => {showPosts(username,posts,0,10,comments)}}>{username}'s Posts</div>
                  </li>
                  <li className="nav-item">
                    <div className="nav-link" aria-current="page" onClick={()=>{showComments(username,comments,0,10,posts)}}>{username}'s Comments</div>
                  </li>
                  <li className="nav-item">
                    <div className="nav-link" aria-current="page" onClick={() => {showLikedPosts(username,posts,comments)}}> Liked Posts </div>
                  </li>
                  <li className="nav-item">
                    <div className="nav-link" aria-current="page" onClick={() => {showLikedComments(username,posts,comments)}}> Liked Comments </div>
                  </li>
                  <li className="nav-item">
                    <div className="nav-link"  onClick={() => {showOptions(username,posts,comments)}}> Options </div>
                  </li>
                </ul>
              )
            }else{
              topBar = (
                <ul className="nav nav-tabs justify-content-center">
                  <li className="nav-item">
                    <div className="nav-link active"  onClick={() => {showPosts(username,posts,0,10,comments)}}>{username}'s Posts</div>
                  </li>
                  <li className="nav-item">
                    <div className="nav-link" aria-current="page" onClick={()=>{showComments(username,comments,0,10,posts)}}>{username}'s Comments</div>
                  </li>
                  <li className="nav-item">
                    <div className="nav-link"  onClick={() => {showOptions(username,posts,comments)}}> Options </div>
                  </li>
                </ul>
              )
            }
            changeCode(
              <div>
              {msg}
              <h1> {username}'s Profile </h1>
              {topBar}
              <div className='centerAlignPaginationBar'> {paginationBar}  </div>
              <div className='listOfStuffs'>
                {listOfShownPosts}
              </div>
              <div className='centerAlignPaginationBar'> {paginationBar}  </div>
              </div>
            );
          } //Doesnt Test Session
          //Privacy Handlers
          function showDeactivationPage(){
            showOnlyMain();
            changeCode(
              <div>
                <Button variant='dark' onClick={cancel} className='exitButton'>Cancel</Button>
                <h4>WARNING: Hiding your account will prevent you from accessing it until it has been reactivated.</h4>
                <h5> This command will require you to retype your username and password.</h5>
                <form onSubmit={handleAccountPrivacyChange}>
                  <input type="hidden" name="privacy" value="hidden"></input>
                  <label htmlFor='userEmail'>Email</label>
                  <br></br>
                  <input type="email" name="userEmail" id="userEmail" required></input>
                  <br></br>
                  <label htmlFor="pswrd" >Password</label>
                  <br></br>
                  <input name="pswrd" type="password" id="pswrd" minLength="8" required></input>
                  <br></br><br></br>
                  <Button type="submit">Deactivate Account</Button>
                </form>
              </div>
            )
          }
          function handleAccountPrivacyChange(event){
            event.preventDefault();
            var sessionID = cookies.get("sessionID");
            var id = cookies.get("id");
            var visibility = document.getElementById("privacy").value;
            var email = document.getElementById("email").value;
            var pswrd = document.getElementById("pswrd").value;
            const requestSetup = {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({email: email, password:pswrd, sessionID: sessionID, userID: id, visbility:visibility})
            };
            fetch(serverLocation + "/changeVisibility",requestSetup)
              .then(response=>response.json())
              .then(data=>{
                if (data.status === -11){
                  showExpiredPage({origin: "userProfileOptions", userID: userID})
                }
                else if (data.status === -1){
                  showErrorPage({origin: "userProfileOptions", userID: userID, message:data.message})
                }else{
                  if (visibility === "hidden"){
                    //remove all cookies and set them at home
                    cookies.remove("sessionID",{path: '/'});
                    cookies.remove("expireTime",{path:"/"})
                    cookies.remove("name",{path:'/'});
                    cookies.remove("id",{path:'/'});
                    cookies.remove("lightingMode",{path:'/'});
                    cookies.remove("adminStatus",{path:'/'});
                    changeNavToLoggedOut();
                    changeCode(
                      <div>You have successfully deactivated your account. You will be redirected in a few seconds.</div>
                    )
                    setTimeout(window.location.reload(),10000);
                  }else{
                    //redirect to options
                    showUserProfile(userID,0,10,"privacyChanged");
                  }
                }
              })
          }
          function showPrivacyTogglePage(){
            //fetch visibility
            fetch(serverLocation + "/user!?userID=" + cookies.get('id') + "&sessionID=" + cookies.get("sessionID"))
              .then(response => response.json())
              .then(data=>{
                if (data.status === -11){
                  showExpiredPage({origin: "userProfileOptions", userID: userID})
                }else if (data.status === -1){
                  showErrorPage({origin: "userProfileOptions", userID: userID, message:data.message})
                }else{
                  var privacyText;
                  var hiddenInput;
                  if (!data.userVisibility || data.userVisibility === "public"){
                    privacyText = (<div> Your visibility is currently set to PUBLIC, and you will be changing it to PRIVATE. </div>);
                    hiddenInput = "private";
                  }else if (data.userVisibility === "hidden"){
                    ///oops error
                    changeCode(<div><h1> Oops! </h1>An Error Has Occured.</div>)
                    return;
                  }else if (data.userVisibility === "private"){
                    privacyText = (<div> Your visibility is currently set to PRIVATE, and you will be changing it to PUBLIC. </div>);
                    hiddenInput = "public";
                  }
                  changeCode(
                    <div>
                    <Button variant='dark' onClick={() => {cancel(0,10,'options')}} className='exitButton'>Cancel</Button>
                    {privacyText}
                    <form onSubmit={handleAccountPrivacyChange}>
                      In order to change your visibility settings, you will need to enter your login details.
                      <input type='hidden' id="privacy" name='privacy' value={hiddenInput}></input>
                      <br></br>
                      <label htmlFor='userEmail'>Email</label>
                      <br></br>
                      <input type="email" name="userEmail" id="userEmail" required></input>
                      <br></br>
                      <label htmlFor="pswrd" >Password</label>
                      <br></br>
                      <input name="pswrd" type="password" id="pswrd" minLength="8" required></input>
                      <br></br><br></br>
                      <Button type="submit">Change Privacy</Button>
                    </form>
                    </div>
                  )
                }
                }
              )
          }
          //Main
          showOnlyMain();
          var sessionID = cookies.get("sessionID");
          var id = cookies.get("id");
          if (sessionID && id){
            fetch(serverLocation + "/user?profileID=" + userID + "&userID=" + id + "&sessionID=" + sessionID)
              .then(response => response.json())
              .then(data=>{
                // console.log(data)
                if (data.status === -11){
                  if (variation === "posts"){
                    showExpiredPage({origin: "showUserProfilePosts", startPos: startPos, endPos:endPos})
                  }else if (variation === "comments"){
                    showExpiredPage({origin: "showUserProfileComments", startPos: startPos, endPos:endPos})
                  }else if (variation === "options"){
                    showExpiredPage({origin: "showUserProfileOptions"})
                  }else{
                    showExpiredPage({origin: "showUserProfile", startPos: startPos, endPos: endPos})
                  }
                }else if (data.status === -1){
                  if (variation === "posts"){
                    showErrorPage({message: data.message,origin: "showUserProfilePosts", startPos: startPos, endPos:endPos})
                  }else if (variation === "comments"){
                    showErrorPage({message: data.message,origin: "showUserProfileComments", startPos: startPos, endPos:endPos})
                  }else if (variation === "options"){
                    showErrorPage({message: data.message,origin: "showUserProfileOptions"})
                  }else{
                    showErrorPage({message: data.message,origin: "showUserProfile", startPos: startPos, endPos: endPos})
                  }
                }else{
                  if (variation === "posts"){
                    showPosts(data.username,data.posts,startPos,endPos,data.comments);
                  }else if (variation === "comments"){
                    showComments(data.username,data.comments,startPos,endPos,data.posts)
                  }else if (variation === "options"){
                    showOptions(data.username,data.posts,data.comments);
                  }else if (variation === "privacyChanged"){
                    showOptions(data.username,data.posts,data.comments,"privacyChanged");
                  }else if (variation === "postDelete"){
                    showPosts(data.username,data.posts,startPos,endPos,data.comments,"Delete");
                  }else if (variation === "commentDeleted"){
                    showPosts(data.username,data.posts,startPos,endPos,data.comments,"commentDeleted");
                  }else{
                    showPosts(data.username,data.posts,startPos,endPos,data.comments);
                  }
                }
              })
          }else{
            //ask for unlogged in posts
            fetch(serverLocation + "/user?profileID=" + userID)
              .then(response => response.json())
              .then(data => {
                if (variation === "posts"){
                  showPosts(data.username,data.posts,startPos,endPos,data.comments);
                }else if (variation === "comments"){
                  showComments(data.username,data.comments,startPos,endPos,data.posts)
                }else if (variation === "options"){
                  showOptions(data.username,data.posts,data.comments);
                }
                else{
                  showPosts(data.username,data.posts,startPos,endPos,data.comments);
                }
              })
          }}
      function showInDepthComment(commentID,designation = ""){
        var serverString = serverLocation + "/comment?commentID=" + commentID +
          (cookies.get("sessionID") ? "&sessionID=" + cookies.get("sessionID") : "") +
          (cookies.get("id") ? "&userID=" + cookies.get("id") : "");
        fetch(serverString)
          .then(response => response.json())
          .then(data => {
            if (data.status === -11){
              showExpiredPage({origin: "indepthComment", commentID: commentID});
            }else if (data.status === -1){
              showErrorPage({message: data.message, origin: "indepthComment", commentID: commentID});
            }else{
              console.log(data);
              openInDepthPost();
              var editButton;
              var likePostButton = (
                <Button onClick={() => {getLoginPage("indepthComment")}}> Like </Button>
              );
              if (data.postLiked && data.postLiked === "Liked"){
                likePostButton = (
                  <Button onClick={() => {handlePostUnlike(data.postID,"indepthComment",commentID)}}> Unlike </Button>
                )
              }else if (data.postLiked && data.postLiked === "Unliked"){
                likePostButton = (
                  <Button onClick={() => {handlePostLike(data.postID,"indepthComment",commentID)}}> Like </Button>
                )
              }
              var likeCommentButton = (
                <Button onClick={() => {handleCommentLike(data.commentID,"indepthComment")}}> Like </Button>
              );
              if (data.commentLiked && data.commentLiked === "Liked"){
                likeCommentButton = (
                  <Button onClick={() => {handleCommentUnlike(data.commentID,"indepthComment")}}> Unlike </Button>
                )
              }else if (data.commentLiked && data.commentLiked === "Unliked"){
                likeCommentButton = (
                  <Button onClick={() => {handleCommentLike(data.commentID,"indepthComment")}}> Like </Button>
                )
              }
              var ownerAbilities;
              if (designation === "changed"){
                <div className='confMsg'> Your comment has changed successfully. </div>
              }
              if (data.commenterID === cookies.get("id")){
                ownerAbilities = (
                  <Card.Body>
                    <Button onClick={()=>{showEditComment(data.commentID,"indepthComment",data.postID,0,0)}}>Edit Comment</Button>
                    <br></br>
                    <Button onClick={()=>{showDeleteCommentConfirmation(data.commentID,"indepthComment",data.postID,0,0)}}> Delete Comment </Button>
                  </Card.Body>
                )
              }
              changeInDepthCode(
                <div>
                  <Card>
                  <Card.Title>Comment Information</Card.Title>
                  <Card.Subtitle> <div className="linkText" onClick={() => {showUserProfile(data.commenterID)}}>{"Username: " + data.commenterUsername}</div> </Card.Subtitle>
                  <Card.Subtitle> {"User ID: " + data.commenterID} </Card.Subtitle>
                  <Card.Body> {data.comment} </Card.Body>
                  {editButton}
                  <Card.Body> {likeCommentButton} </Card.Body>
                  <Card.Subtitle> {data.commentDate} </Card.Subtitle>
                  </Card>
                  <Card>
                  <Card.Title>Post Information</Card.Title>
                  <Card.Title>{data.title}</Card.Title>
                  <Card.Subtitle> {"Username: " + data.posterUsername} </Card.Subtitle>
                  <Card.Subtitle> {"User ID: " + data.posterID} </Card.Subtitle>
                  <Card.Body> {data.content} </Card.Body>
                  <Card.Body> {likePostButton} </Card.Body>
                  <Card.Subtitle> {data.postDate} </Card.Subtitle>
                  </Card>
                  {ownerAbilities}
                </div>
              )
            }
            ///FIX THIS: May need more details or beautification
            //FIX THIS: Maybe Include the like button above?
          })}
      function showInDepthPost(postID,commentStart = 0, commentEnd = 10, pact = ""){
          var detect = cookies.get("sessionID") && cookies.get("id");
          var serverString = serverLocation + "/post?postID=" + postID;
          if (detect){
            serverString = serverLocation + "/post?postID=" + postID + "&sessionID=" + cookies.get('sessionID') + "&userID=" + cookies.get('id')
          }
          fetch(serverString)
            .then(response=>response.json())
            .then(data => {
              console.log(data);
              if (data.status === -11){
                showExpiredPage({origin: "indepthPost", postID: postID, startPos: commentStart, endPos: commentEnd})
              }else if (data.status === -2){
                showErrorPage({message: "That post doesn't exist."})
              }
              else if (data.status === -1){
                showErrorPage({message: data.message})
              }
              else{
                openInDepthPost();
                var listOfComments = [];
                for (let key = commentStart; key < Math.min(data.comments.length,commentEnd); key++){
                  var comment = data.comments[key];
                  var likeButton = (<Button onClick={() => {getLoginPage("indepthPost")}}>Like</Button>);
                  if (detect){
                    likeButton = (<Button onClick={() => handleCommentLike(data.comments[key].commentID,"indepthPost",postID,0,commentStart,commentEnd)}>Like</Button>);
                    if (comment.commentLiked && comment.commentLiked === "Liked"){
                      likeButton = (<Button onClick={() => handleCommentUnlike(data.comments[key].commentID,"indepthPost",postID,0,commentStart,commentEnd)}>Unlike</Button>)
                    }
                  }
                  var commentownerAbilities;
                  if (cookies.userID === comment.commenterID){
                    commentownerAbilities = (
                      <Card.Body>
                        <Button onClick={()=>{showEditComment(key,"indepthPost",postID,commentStart,commentEnd)}}>Edit Comment</Button>
                        <br></br>
                        <Button onClick={()=>{showDeleteCommentConfirmation(key,"indepthComment",postID,commentStart,commentEnd)}}> Delete Comment </Button>
                      </Card.Body>
                    )
                  }
                  listOfComments.push(
                    <ListGroup.Item key={key}>
                      <Card>
                      <Card.Header><div className='linkText' onClick={() => {showUserProfile(data.comments[key].commenterID)}}>{comment.commenterName}</div></Card.Header>
                      <Card.Header> {comment.commentDate} </Card.Header>
                      <Card.Body> <div className="linkText" onClick={()=>{showInDepthComment(data.comments[key].commentID)}}>{comment.comments}</div> </Card.Body>
                      <Card.Footer> Likes: {comment.commentLikes}
                      <br></br>
                      {likeButton}
                      </Card.Footer>
                      {commentownerAbilities}
                      </Card>
                    </ListGroup.Item>
                  )
                }
                if (listOfComments.length === 0){
                  listOfComments = (<div> This post has no visible comments. </div>)
                }
                var paginationBar;
                if (data.comments.length > 10){
                  var paginationSlots = [];
                  for (let i = 0; i < Math.ceil(data.comments.length / 10); i++){
                    paginationSlots.push(

                      <li key={i}><div className="dropdown-item" onClick={() => {showInDepthPost(postID,10 * i,Math.min(10*i+10,data.comments.length))}}>{10 * i + 1} through {Math.min(10*i+10,data.comments.length)}</div></li>
                    )
                  }
                  paginationBar = (
                   <ul className="nav nav-tabs">
                    <li className="nav-item dropdown">
                      <div className="nav-link dropdown-toggle" data-bs-toggle="dropdown" href="#" role="button" aria-expanded="false">Comments Range</div>
                      <ul className="dropdown-menu">
                        {paginationSlots}
                      </ul>
                    </li>
                  </ul>)
                }
                var postLikedText = (<Button onClick={() => {getLoginPage("indepthPost")}}>Like</Button>);;
                if (detect){
                  postLikedText = (<Button onClick={() => {handlePostLike(data.postID,"indepthPost")}}>Like</Button>);
                  if (data.likedPost && data.likedPost === "Liked"){
                    postLikedText = (<Button onClick={() => {handlePostUnlike(data.postID,"indepthPost")}}>Unlike</Button>)
                  }
                }
                var writeCommentButton = (<Button onClick={() => {getLoginPage("indepthPost")}}>Like</Button>);
                if (detect){
                  writeCommentButton = (<Button onClick={() => {displayCommentWriter(postID,'indepthPost',commentStart,commentEnd)}}>Add Comment</Button>)
                }
                var confrimation = (<div></div>);
                if (pact && pact==='Add'){
                  confrimation = (<div className='confMsg'> Your post was added. </div>)
                } else if (pact && pact==='Edit'){
                  confrimation = (<div className='confMsg'> Your post was edited. </div>)
                }
                else if (pact && pact === "Delete"){
                      confrimation = (<div className='confMsg'> Your post was deleted. </div>)
                } else if (pact && pact === "Delete"){
                    confrimation = (<div className='confMsg'> Your comment was deleted. </div>)
              }
                var ownerAbilities;
                if (data.authorID === cookies.get("id")){
                  ownerAbilities = (
                    <Card.Body>
                      <Button onClick={() => {showEditPost(data.postID,"indepthPost",commentStart,commentEnd)}}> Edit Post </Button>
                      <br></br>
                      <Button onClick={() => {showDeletePostConfirmation(postID,"indepthPost",commentStart,commentEnd)}}> Delete Post </Button>
                    </Card.Body>
                  )
                }
                changeInDepthCode(
                  <Card>
                    <Card.Header className='rightAlignHeader'> <Button onClick={closeInDepthPost}>Close</Button> </Card.Header>
                    <Card.Header><h1>{data.title}</h1></Card.Header>
                    {confrimation}
                    <Card.Header> <div className='linkText' onClick={() => {showUserProfile(data.authorID)}}>Author: {data.authorName}</div> Date Written: {data.postDate}
                    <br></br>
                    Likes: {data.totalLikes}
                    <br></br>
                    {postLikedText}
                    </Card.Header>
                    <Card.Body> {data.content} </Card.Body>
                    <ListGroup>
                    <h2> Comments </h2>
                    {writeCommentButton}
                    <div className='centerAlignPaginationBar'> {paginationBar}  </div>
                    {listOfComments}
                    <div className='centerAlignPaginationBar'> {paginationBar}  </div>
                    </ListGroup>
                    {ownerAbilities}
                  </Card>
                );
              }
            })}
      //Search Page
      function getSearchPage(){
        showOnlyMain();
        changeCode(
          <div>
          <h1> Search for a Post </h1>
          <form onSubmit={handleSearch}>
          <label htmlFor='title'>Search for Title:</label>
          <br></br>
          <input name='title' id='title'></input>
          <br></br>
          <label htmlFor='content'>Search by Contents:</label>
          <br></br>
          <input name='content'  id='content'></input>
          <br></br>
          <label htmlFor='username'>Search by Username:</label>
          <br></br>
          <input name='username' id='username'></input>
          <br></br>
          <label htmlFor='date'>Search By Date:</label>
          <br></br>
          <input name='date' type='date' id='sDate'></input>
          <br></br><br></br>
          <Button variant='dark' type="submit"> Submit </Button>
          </form>
          </div>
        )
      }
      function handleSearch(event){
        event.preventDefault();
        var title = document.getElementById("title").value;
        var content = document.getElementById("content").value;
        var username = document.getElementById("username").value;
        var sDate = document.getElementById("sDate").value;
        var url = serverLocation + "/search?";
        var toJoin = [];
        if (title){
          console.log("Title: " + title);
          toJoin.push("title=" + title);
        }
        if (content){
          console.log("Content: " + content);
          toJoin.push("content=" + content);
        }
        if (username){
          console.log("Username: " + username);
          toJoin.push("username=" + username);
        }
        if (sDate){
          console.log("sdate: " + sDate);
          toJoin.push("sDate=" + sDate);
        }
        if (cookies.get("sessionID")){
          toJoin.push("sessionID=" + cookies.get("sessionID"));
        }
        if (cookies.get("id")){
          toJoin.push("userID=" + cookies.get("id"));
        }
        url += toJoin.join('&')
        url = encodeURI(url);
        //fetch and changecode to a new screen that displays all the posts
        fetch(url)
        .then(response=>response.json())
        .then(data => {
          console.log(data);
          if (data.status === -11){
            showExpiredPage({origin: "searchPage"})
          }else if (data.status === -1){
            showErrorPage({message: data.message, origin: "searchPage"})
          }else{
            paginateSearchPage(data.contents,0,10,title,content,username,sDate)
          }
        })
      }
      function paginateSearchPage(contents,start = 0,end = 10,title,content,username,sDate){
        var listOfPosts = [];
        var paginationBar;
        if (!contents|| contents.length === 0){
          listOfPosts = (<div> No posts were found. </div>)
        }else{
          for (let key = start; key < Math.min(end,contents.length); key++){
            listOfPosts.push(simplePost(key,contents[key],contents[key].isLiked,"search",contents))
          }
          if (listOfPosts.length === 0){
            listOfPosts = (<div>There were no posts matching your criteria.</div>)
          }
          if (contents.length > 10){
            var paginationSlots = [];
            for (let i = 0; i < Math.ceil(contents.length / 10); i++){
              paginationSlots.push(
                <li key={i}><div className="dropdown-item" onClick={() => {paginateSearchPage(contents,10 * i,Math.min(10*i+10,contents.length),title,content,username,sDate)}}>{10 * i + 1} through {Math.min(10*i+10,contents.length)}</div></li>
              )
            }
            paginationBar = (
             <ul className="nav nav-tabs">
              <li className="nav-item dropdown">
                <div className="nav-link dropdown-toggle" data-bs-toggle="dropdown" href="#" role="button" aria-expanded="false">Posts Range</div>
                <ul className="dropdown-menu">
                  {paginationSlots}
                </ul>
              </li>
            </ul>)
          }
        }
        changeCode(
          <div>
          <h1> Search for a Post </h1>
          <form onSubmit={handleSearch}>
          <label htmlFor='title'>Search for Title:</label>
          <br></br>
          <input name='title' id='title' placeholder={title}></input>
          <br></br>
          <label htmlFor='content'>Search by Contents:</label>
          <br></br>
          <input name='content'  id='content' placeholder={content}></input>
          <br></br>
          <label htmlFor='username'>Search by Username:</label>
          <br></br>
          <input name='username' placeholder={username} id='username'></input>
          <br></br>
          <label htmlFor='date'>Search By Date:</label>
          <br></br>
          <input name='date' placeholder={sDate} type='date' id='sDate'></input>
          <br></br><br></br>
          <Button variant='dark' type="submit"> Submit </Button>
          </form>
          {paginationBar}
          {listOfPosts}
          {paginationBar}
          </div>
        )
      }
      function searchHashtag(hashtag){
        console.log(hashtag);
        var fetchString = serverLocation + "/getPostsWithHashtag?hashtag=" + hashtag;
        if (cookies.get("id") && cookies.get("sessionID")){
          fetchString += "&userID=" + cookies.get("id") + "&sessionID=" + cookies.get("sessionID");
        }
        fetch(fetchString)
          .then(response => response.json())
          .then(data => {
            if (data.status === -1){
              showErrorPage({message:data.message})
            }else{
              paginateHashtagSearch(hashtag,data.contents)
            }
          })
      }
      function paginateHashtagSearch(hashtag, contents, start = 0, end = 10){
        var listOfPosts = [];
        var paginationBar;
        if (!contents|| contents.length === 0){
          listOfPosts = (<div> No posts were found. </div>)
        }else{
          for (let key = start; key < Math.min(end,contents.length); key++){
            listOfPosts.push(simplePost(key,contents[key],contents[key].isLiked,"search",contents))
          }
          if (listOfPosts.length === 0){
            listOfPosts = (<div>There were no posts matching your criteria.</div>)
          }
          if (contents.length > 10){
            var paginationSlots = [];
            for (let i = 0; i < Math.ceil(contents.length / 10); i++){
              paginationSlots.push(
                <li key={i}><div className="dropdown-item" onClick={() => {paginateHashtagSearch(hashtag,contents,10 * i,Math.min(10*i+10,contents.length))}}>{10 * i + 1} through {Math.min(10*i+10,contents.length)}</div></li>
              )
            }
            paginationBar = (
             <ul className="nav nav-tabs">
              <li className="nav-item dropdown">
                <div className="nav-link dropdown-toggle" data-bs-toggle="dropdown" href="#" role="button" aria-expanded="false">Posts Range</div>
                <ul className="dropdown-menu">
                  {paginationSlots}
                </ul>
              </li>
            </ul>)
          }
        }
        changeCode(
          <div>
          <h1> Posts Associated With {hashtag} </h1>
          {paginationBar}
          {listOfPosts}
          {paginationBar}
          </div>
        )
      }
      //SHOWERS AND HIDERS
      function showWriteForm(){
        //have something navigate down from the top
        changeWriteFormCSS(
          {
            height: 'auto',
            transition: 'height 2s ease-in'
          }
        );
        changeMainBodyCSS(
          {
            display: 'none',
            transition: 'height 2s ease-in'
          }
        );
        changeWriteFormCode(
          <div>
          <br></br>
          <Button variant='dark' onClick={hideWriteForm} className='exitButton'>Cancel</Button>
          <h1> Write a Post </h1>
          <form onSubmit={handleWritePost}>
            <label htmlFor='postTitle'>Title:</label>
            <br></br>
            <input name='postTitle' id="postTitle" autoComplete="off" required></input>
            <br></br>
            <label htmlFor='postContent'>Content:</label>
            <br></br>
            <textarea className='noResize' rows='5' cols='50'
             maxLength="200" id="postContent" name="postContent" autoComplete="off" required>
            </textarea>
            <br></br>
            Private?
            <br></br>
            <label className="switch">
            <input type="checkbox" id='privacySwitch'
            onChange={handlePrivacyChecked}
            ></input>
            <span className="slider round"></span>
            </label>
            <br></br>
            <div> This post can be seen by anyone. </div>
            <Button variant='dark' type="submit"> Submit Post </Button>
          </form>
          </div>
        )
      }
      function hideWriteForm(){
        changeWriteFormCSS(
          {
            height: '0%',
            display: 'none',
            transition: 'height 2s ease-in'
          }
        );
        changeInDepthCSS(
          {
            display: 'none',
            transition: 'height 2s ease-in'
          }
        );
        changeMainBodyCSS({
          height: 'auto',
          transition: 'height 2s ease-in'
        })
      }
      function closeInDepthPost(){
        changeMainBodyCSS({
          height: 'auto',
          transition: 'height 2s ease-in'
        });
        changeInDepthCSS(
          {
            display: 'none',
            transition: 'height 2s ease-in'
          }
        );
      }
      function openInDepthPost(){
        changeInDepthCSS({
          height: 'auto',
          transition: 'height 2s ease-in'
        });
        changeMainBodyCSS(
          {
            display: 'none',
            transition: 'height 2s ease-in'
          }
        );
        changeLoginCSS({
          height: 'none',
                      display: 'none',
          transition: 'height 2s ease-in'
        })
      }
      function showOnlyMain(){
        changeMainBodyCSS(
          {
            height: 'auto',
            transition: 'height 2s ease-in'
          }
        );
        changeInDepthCSS(
          {
            height: '0%',
            display: 'none',
            transition: 'height 2s ease-in'
          }
        );
        changeWriteFormCSS(
          {
            height: '0%',
            display: 'none',
            transition: 'height 2s ease-in'
          }
        );
        changeLoginCSS({
          height: '0%',
          display: 'none',
          transition: 'height 2s ease-in'
        })
      }
      function openLoginForm(){
        changeLoginCSS({
          height: 'auto',
          transition: 'height 2s ease-in'
        })
        changeMainBodyCSS({
          height: 'none',
                      display: 'none',
          transition: 'height 2s ease-in'
        });
        changeInDepthCSS(
          {
            display: 'none',
            transition: 'height 2s ease-in'
          }
        );
      }
      //LOGGED IN GETEMS
      function getMyFeed(start = 0, end = 10){
        showOnlyMain();
        var listOfPosts = [];
        fetch(serverLocation + "/myfeed?userID=" + cookies.get("id") + "&sessionID=" + cookies.get("sessionID"))
          .then(response=>response.json())
          .then(data =>{
            console.log(data);
            if (data.status === -11){
              showExpiredPage([{}]);
            }else if (data.status === -1){
              showErrorPage({message: data.message})
            }else{
              for (let key = start; key < Math.min(data.contents.length,end); key++){
                listOfPosts.push(simplePost(key,data.contents[key],"myFeed",start,end))
              }
              if (listOfPosts.length === 0){
                listOfPosts = (<div>You do not have any posts in your feed.</div>)
              }
              var paginationBar;
              if (data.contents.length > 10){
                var paginationSlots = [];
                for (let i = 0; i < Math.ceil(data.contents.length / 10); i++){
                  paginationSlots.push(
                    <li key={i}><div className="dropdown-item" onClick={() => {getMyFeed(10 * i,Math.min(10*i+10,data.contents.length))}}>{10 * i + 1} through {Math.min(10*i+10,data.contents.length)}</div></li>
                  )
                }
                paginationBar = (
                 <ul className="nav nav-tabs">
                  <li className="nav-item dropdown">
                    <div className="nav-link dropdown-toggle" data-bs-toggle="dropdown" href="#" role="button" aria-expanded="false">Posts Range</div>
                    <ul className="dropdown-menu">
                      {paginationSlots}
                    </ul>
                  </li>
                </ul>)
              }
              changeCode(
                <div>
               <h1> QuickiePost - Your Feed</h1>
               {paginationBar}
                {listOfPosts}
                {paginationBar}
                </div>
              )
            }
          })
      } //FIX THIS: DOUBT IT WORKS
      function getProfile(){ //be able to delete account, change visiblity, identify if admin, post count
        showOnlyMain();
        showUserProfile(cookies.get("id"));
      }
      //Event Handlers
      function handleWritePost(event){
        //FIX THIS: TEST AGAIN AND BEGIN CHANGING THE SESSION ID STUFF
        event.preventDefault();
        var title = document.getElementById('postTitle').value;
        var content = document.getElementById('postContent').value;
        var privacy = document.getElementById('privacySwitch').checked ? 'private' : 'public';
        console.log(title,content,privacy);
        var sessionID = cookies.get('sessionID');
        const requestSetup = {
            method: 'PUT'
        }
        fetch(serverLocation + "/post?title=" + title + "&contents="
        + content + "&visibility=" + privacy + '&userID=' + cookies.get('id') + "&sessionID=" + cookies.get(sessionID),requestSetup)
          .then(response => response.json())
          .then(data => {
            console.log(data);
            if (data.status === -11){
              showExpiredPage({})
            }else if (data.status === -1){
              showErrorPage({message: data.message, origin: "writePost"})
            }else{
              // showUserProfile(cookies.get("id"),0,10,"posts");
              showInDepthPost(data.postID);
            }
          });
      }
      function handlePrivacyChecked(){
        var i = document.getElementById('privacySwitch').checked;
        // console.log(i);
        if (i){
          changeWriteFormCode(
            <div>
            <br></br>
            <Button variant='dark' onClick={hideWriteForm} className='exitButton'>Cancel</Button>
            <h1> Write a Post </h1>
            <form onSubmit={handleWritePost}>
              <label htmlFor='postTitle'>Title:</label>
              <br></br>
              <input name='postTitle' id="postTitle" autoComplete="off" required></input>
              <br></br>
              <label htmlFor='postContent'>Content:</label>
              <br></br>
              <textarea className='noResize' rows='5' cols='50'
               maxLength="200" id="postContent" name="postContent" autoComplete="off" required>
              </textarea>
              <br></br>
              Private?
              <br></br>
              <label className="switch">
              <input type="checkbox" id='privacySwitch'
              onChange={handlePrivacyChecked}
              ></input>
              <span className="slider round"></span>
              </label>
              <br></br>
              <div> This post can only be seen by you or those you've linked with. </div>
              <Button variant='dark' type="submit"> Submit Post </Button>
            </form>
            </div>
          )
        }else{
          changeWriteFormCode(
            <div>
            <br></br>
            <Button variant='dark' onClick={hideWriteForm} className='exitButton'>Cancel</Button>
            <h1> Write a Post </h1>
            <form onSubmit={handleWritePost}>
              <label htmlFor='postTitle'>Title:</label>
              <br></br>
              <input name='postTitle' id="postTitle" autoComplete="off" required></input>
              <br></br>
              <label htmlFor='postContent'>Content:</label>
              <br></br>
              <textarea className='noResize' rows='5' cols='50'
               maxLength="200" id="postContent" name="postContent" autoComplete="off" required>
              </textarea>
              <br></br>
              Private?
              <br></br>
              <label className="switch">
              <input type="checkbox" id='privacySwitch'
              onChange={handlePrivacyChecked}
              ></input>
              <span className="slider round"></span>
              </label>
              <br></br>
              <div> This post can be seen by anyone. </div>
              <Button variant='dark' type="submit"> Submit Post </Button>
            </form>
            </div>
          )
        }
      }
      //Error Messages
      function showExpiredPage(data){
        cookies.remove("sessionID",{path: '/'});
        cookies.remove("expireTime",{path:"/"})
        cookies.remove("name",{path:'/'});
        cookies.remove("id",{path:'/'});
        cookies.remove("lightingMode",{path:'/'});
                            cookies.remove("adminStatus",{path:'/'});
        changeNavToLoggedOut();
        showOnlyMain();
        //produce a page and redirect link, or redirect automatically
        var returnButton;
        if (data.origin){
          //the specific unique ones
          var startPos = data.startPos ? data.startPos : 0;
          var endPos = data.endPos ? data.endPos : 10;
          var postID = data.postID;
          var userID = data.userID;
          var commentID = data.commentID;
          if (origin === "login"){
            returnButton = (<Button onClick={()=>{getLoginPage(data.origin)}}> Return </Button>)
          }else if (origin === "userprofileOptions"){
            returnButton = (<Button onClick={()=>{showUserProfile(userID,startPos,endPos,"options")}}> Return </Button>)
          }else if (origin === "userProfileBlockList"){
            returnButton = (<Button onClick={()=>{showUserProfile(userID,startPos,endPos,"options")}}> Return </Button>)
          }else if (origin === "userProfileUnblock"){
            returnButton = (<Button onClick={()=>{showUserProfile(userID,startPos,endPos,"options")}}> Return </Button>)
          }else if (origin === "userProfileImViewingList"){
            returnButton = (<Button onClick={()=>{showUserProfile(userID,startPos,endPos,"options")}}> Return </Button>)
          }else if (origin === "userProfileViewingMeList"){
            returnButton = (<Button onClick={()=>{showUserProfile(userID,startPos,endPos,"options")}}> Return </Button>)
          }else if (origin === "userProfileLikedPosts"){
            returnButton = (<Button onClick={()=>{showUserProfile(userID,startPos,endPos,"options")}}> Return </Button>)
          }else if (origin === "userProfileComments"){
            returnButton = (<Button onClick={()=>{showUserProfile(userID,startPos,endPos,"comments")}}> Return </Button>)
          }else if (origin === "userProfilePosts"){
            returnButton = (<Button onClick={()=>{showUserProfile(userID,startPos,endPos,"posts")}}> Return </Button>)
          }else{//origin is a common thing, use cancel
            returnButton = (<Button onClick={()=>{cancel(data.origin,postID,commentID,userID,startPos,endPos)}}> Return </Button>)
          }
        }else{ // data.origin did not exist, redirect to home
          returnButton = (<Button onClick={()=>{getHome()}}> Return </Button>)
        }
        changeCode(
          <div>
            <h1> Session Timed Out </h1>
            <div> You have been logged out due to inactivity. <br></br>
            You can click the button below to attempty to return to where you were or use the navigation bar on the top of the page.<br></br>
            </div>
            <div> {returnButton} </div>
          </div>
        )
      }
      function showErrorPage(data){
        //show error information and redirect link
        showOnlyMain();
        var returnButton;
        if (data.origin){
          //the specific unique ones
          var startPos = data.startPos ? data.startPos : 0;
          var endPos = data.endPos ? data.endPos : 10;
          var postID = data.postID;
          var userID = data.userID;
          var commentID = data.commentID;
          if (origin === "login"){
            returnButton = (<Button onClick={()=>{getLoginPage(data.origin)}}> Return </Button>)
          }else if (origin === "userprofileOptions"){
            returnButton = (<Button onClick={()=>{showUserProfile(userID,startPos,endPos,"options")}}> Return </Button>)
          }else if (origin === "userProfileBlockList"){
            returnButton = (<Button onClick={()=>{showUserProfile(userID,startPos,endPos,"options")}}> Return </Button>)
          }else if (origin === "userProfileUnblock"){
            returnButton = (<Button onClick={()=>{showUserProfile(userID,startPos,endPos,"options")}}> Return </Button>)
          }else if (origin === "userProfileImViewingList"){
            returnButton = (<Button onClick={()=>{showUserProfile(userID,startPos,endPos,"options")}}> Return </Button>)
          }else if (origin === "userProfileViewingMeList"){
            returnButton = (<Button onClick={()=>{showUserProfile(userID,startPos,endPos,"options")}}> Return </Button>)
          }else if (origin === "userProfileLikedPosts"){
            returnButton = (<Button onClick={()=>{showUserProfile(userID,startPos,endPos,"options")}}> Return </Button>)
          }else if (origin === "userProfileComments"){
            returnButton = (<Button onClick={()=>{showUserProfile(userID,startPos,endPos,"comments")}}> Return </Button>)
          }else if (origin === "userProfilePosts"){
            returnButton = (<Button onClick={()=>{showUserProfile(userID,startPos,endPos,"posts")}}> Return </Button>)
          }else if (origin === "forgotPassword"){
            returnButton = (<Button onClick={()=>{forgotPasswordPage()}}> Return </Button>);
          }
          else{//origin is a common thing, use cancel
            returnButton = (<Button onClick={()=>{cancel(data.origin,postID,commentID,userID,startPos,endPos)}}> Return </Button>)
          }
        }else{ // data.origin did not exist, redirect to home
          returnButton = (<Button onClick={()=>{getHome()}}> Return </Button>)
        }
        changeCode(
          <div>
            <h1> Oops! We've encountered an error! </h1><br></br>
            <div> Here's the error message we got:  </div><br></br>
            <div> {String(data.message)} </div><br></br>
            You can click the button below to attempty to return to where you were or use the navigation bar on the top of the page.<br></br>
            <div> {returnButton} </div>
          </div>
        )
      }
      //Visibility modes
      function toggleLightAndDarkMode(){
        if (cookies.get("id") && cookies.get("sessionID")){
          if (lightDarkMode.lightingMode === "light"){
            changeLighting({lightingMode: "dark"})
            cookies.set('lightingMode',"dark",{path:'/'})
          }else{
            changeLighting({lightingMode: "light"})
            cookies.set('lightingMode',"light",{path:'/'})
          }
        }else{
          if (lightDarkMode.lightingMode === "light"){
            changeLighting({lightingMode: "dark"})
          }else{
            changeLighting({lightingMode: "light"})
          }
        }
      }
      //log out
      function logOut(){
        cookies.remove("sessionID",{path: '/'});
        cookies.remove("expireTime",{path:"/"})
        cookies.remove("name",{path:'/'});
        cookies.remove("id",{path:'/'});
        cookies.remove("lightingMode",{path:'/'});
                            cookies.remove("adminStatus",{path:'/'});
        changeNavToLoggedOut();
        fetch(serverLocation + "/posts")
          .then(response=>response.json())
          .then(data => {
              getHome();
          })
      }
      //MAIN
      showOnlyMain();
      if (cookies.get('id') && (cookies.get('expireTime') === "forever" || Date.now() < cookies.get('expireTime'))){
        console.log("Logged In");
        changeNavToLoggedIn();
      }
      else{
        console.log("Not Logged In.");
        cookies.remove("sessionID",{path: '/'});
        cookies.remove("expireTime",{path:"/"})
        cookies.remove("name",{path:'/'});
        cookies.remove("id",{path:'/'});
        cookies.remove("lightingMode",{path:'/'});
                            cookies.remove("adminStatus",{path:'/'});
        changeNavToLoggedOut();
      }
      var listOfPosts = [];
      var extensionString = "";
      if (cookies.get("id") && cookies.get("sessionID")){
        extensionString = "?sessionID=" + cookies.get("sessionID") + "&userID=" + cookies.get("id");
      }
        fetch(serverLocation + "/posts" + extensionString)
          .then(response=>response.json())
          .then(data => {
            for (let key = beginPosition; key < Math.min(data.contents.length,endPosition); key++){
              listOfPosts.push(simplePost(key,data.contents[key],data.isLiked,"home",beginPosition,endPosition))
            }
            if (listOfPosts.length === 0){
              listOfPosts = (<div> There are no posts to show.</div>)
            }
            var paginationBar;
            if (data.contents.length > 10){
              var paginationSlots = [];
              for (let i = 0; i < Math.ceil(data.contents.length / 10); i++){
                paginationSlots.push(

                  <li key={i}><div className="dropdown-item" onClick={() => {getHome(10 * i,Math.min(10*i+10,data.contents.length))}}>{10 * i + 1} through {Math.min(10*i+10,data.contents.length)}</div></li>
                )
              }
              paginationBar = (
               <ul className="nav nav-tabs">
                <li className="nav-item dropdown">
                  <div className="nav-link dropdown-toggle" data-bs-toggle="dropdown" href="#" role="button" aria-expanded="false">Posts Range</div>
                  <ul className="dropdown-menu">
                    {paginationSlots}
                  </ul>
                </li>
              </ul>)
            }
            changeCode(
              <div>
             <h1> QuickiePost </h1>
             {paginationBar}
              {listOfPosts}
              {paginationBar}
              </div>
            )
          })
    },[serverLocation,cookies,changeCode, lightDarkMode])

  React.useEffect(() => {
    getHome()
  },[getHome])

  return (
    <div className="App">
    {navBar}
    <div className='writeForm' style={writeFormCSS}>
    {writeFormCode}
    </div>
    <div className='inDepthPost' style={inDepthPostCSS}>
      {inDepthCode}
    </div>
    <div className='mainBody' style={mainBodyCSS}>
    {mainCode}
    </div>
    <div className='loginForm' style={loginCSS}>
    {loginCode}
    </div>
    </div>
  );
}

export default App;
