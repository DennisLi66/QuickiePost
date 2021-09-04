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
//things ill Need
//!!!PRIORITY
//Return posts and comments
//Redo write post page
//Need to integrate the impact of being blocked; upgrade existing mysql queries
//check all buttons are in () => {} format
//Notifcation List
//Cancelling a conferred viewership request does not appear to work
//test showOptions features on other profiles
//Make home page paginatied
//INCLUDE Private posts for self users
//LOGIN page should check if user is currently hidden
//SHould memoize pagination so its faster
//check that pagination is actually correct
//Maybe use nodemailer to reactivate account.
////////////////
//add a highlight effect to the pagination bar
//Make sure all appropirate functions check session
//Add fine tuning to posts after submission
//change getPosts to SELECT posts where post != private and user != private
//FIX THIS: upgrade simple posts when logged in to post comments
//FIX THIS: Add a display if there are no posts
//change color of posts and comments to better differentiate them
//FIX THIS: LOGIN should redirect to previous page instead of home if a button links there
//FIX THIS: ADD pagination and remembering paginatikn
//FIX UI
//have loading symbol https://www.google.com/search?q=while+fetch+is+working+show+symbol&rlz=1C1CHBF_enUS824US824&oq=while+fetch+is+working+show+symbol&aqs=chrome..69i57j33i160l2.11112j0j1&sourceid=chrome&ie=UTF-8
//have a remaining characters tracker for writing post
//REDO QUERIES - SOME NEED TO BE FIXED
//may need to add privacy to cookies
//rewrite post pages to include pagination
//VIEWERSHIP ENABLEMENT Check if it works
//add better session check
//FIX THIS: CHECK QUERIES THAT INVOLVE COMMENT VISIBILITY
//MAke sure to test everything

function App() {
  //Variables
  //FIX THIS DOT ENV
  const serverLocation = "http://localhost:3001";
  const cookies = React.useMemo(() => {return new Cookies()},[])
  //Important Variables
  const [code,changeCode] = React.useState(
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
  const [privacySwitchDescriptor,changePrivacySwitchDescriptor] = React.useState(
    <div> This post can be seen by anyone. </div>
  )
  const [navBar,changeNavBar] = React.useState();
  //
  const getHome = React.useCallback(
    (beginPosition = 0,endPosition = 10) => {
      //Move things around
      //Deleting Posts
      function showDeletePostConfirmation(postID,origin,startPos,endPos){
        if (!cookies.get("id") || (!cookies.get("sessionID"))){ //should replace with check sessionID FIX THIS
          cancel(origin,postID,0,(cookies.get("id") ? cookies.get("id") : 0),startPos,endPos);
        }else{
          fetch(serverLocation + "/post?postID=" + postID + "&userID=" + cookies.get("id") + "&sessionID=" + cookies.get("sessionID"))
            .then(response => response.json())
            .then(data => {
              if (data.authorID !== cookies.get("id")){
                changeCode(<div><h1> Oops! </h1>An Error Has Occured.</div>)
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
          getLoginPage(origin,postID,0,cookies.get("id"),startPos,endPos)
        }else{
          const requestSetup = {
              method: 'DELETE',
          }
          fetch(serverLocation + "/post?postID=" + postID + "&userID=" + cookies.get("id") + "&sessionID=" + cookies.get("sessionID"),requestSetup)
            .then(response => response.json())
            .then(data => {
              if (data.status === -1){
                changeCode(<div><h1> Oops! </h1>An Error Has Occured.</div>)
              }else if (origin === "indepthPost"){
                showInDepthPost(postID,startPos,endPos,"Delete");
              }else if (origin === "userProfile"){
                showUserProfile(cookies.get("id"),startPos,endPos,"posts","postDelete")
              }
            })
        }
      }
      //Deleting Comments
      function showDeleteCommentConfirmation(commentID,origin,postID,startPos,endPos){
        if (!cookies.get("id") || (!cookies.get("sessionID"))){ //should replace with check sessionID FIX THIS
          cancel(origin,postID,0,(cookies.get("id") ? cookies.get("id") : 0),startPos,endPos);
        }
        else{
          fetch(serverLocation + "/comment?commentID=" + commentID + "&userID=" + cookies.get("id") + "&sessionID=" + cookies.get("sessionID"))
            .then(response => response.json())
            .then(data => {
              if (data.authorID !== cookies.get("id")){
                changeCode(<div><h1> Oops! </h1>An Error Has Occured.</div>)
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
          getLoginPage(origin,postID,0,cookies.get("id"),startPos,endPos)
        }
        else{
          const requestSetup = {
              method: 'DELETE',
          };
          fetch(serverLocation + "/comment?commentID=" + commentID + "&userID=" + cookies.get("id") + "&sessionID=" + cookies.get("sessionID"),requestSetup)
            .then(response => response.json())
            .then(data => {
              if (data.status === -1){
                changeCode(<div><h1> Oops! </h1>An Error Has Occured.</div>)
              }else if (origin === "indepthPost" || origin === "indepthComment"){
                showInDepthPost(postID,startPos,endPos,"commentDeleted")
              }else if (origin === "userProfile"){
                showUserProfile(cookies.get("id"),startPos,endPos,"commentDeleted")
              }
            })
        }
      }
      //Edit Posts
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
              if (data.authorID !== cookies.get("id")){
                changeCode(<div><h1> Oops! </h1>An Error Has Occured.</div>)
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
        "&userID=" + cookies.get("userID") + "&visibility=" + document.getElementById("visibility").value
        + "&title=" + document.getElementById("title").value
        + "&content=" + document.getElementById("content").value,requestSetup)
          .then(response => response.json())
          .then(data => {
            if (data.status === -1){
              changeCode(<div><h1> Oops! </h1>An Error Has Occured.</div>)
            }else if (origin === "indepthPost"){
              showInDepthPost(postID,startPos,endPos,"Edit");
            }else if (origin === "userProfile"){
              showUserProfile(cookies.get("id"),startPos,endPos,"posts")
            }
          })
      }
      //Edit Comments
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
              if (cookies.get("id") !== data.commenterID){
                changeCode(<div><h1> Oops! </h1>An Error Has Occured.</div>)
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
        "&userID=" + cookies.get("userID") + "&visibility=" + document.getElementById("visibility").value
        + "&comments=" + document.getElementById("comments").value,requestSetup)
          .then(response => response.json())
          .then(data => {
            if (data.status === -1){
              changeCode(<div><h1> Oops! </h1>An Error Has Occured.</div>)
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
      //Edit Both
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
      }
      //like handlers
      function handlePostLike(postID,origin,commentID = 0,userID = 0, startPos = 0, endPos = 0){
        //broad use function - rewrite others
        if (!cookies.get("sessionID") || !cookies.get("userID")){
          getLoginPage(origin,postID,commentID,userID,startPos,endPos);
        }else{
          const requestSetup = {
              method: 'PUT',
          }
          fetch(serverLocation + "/like?postID=" + postID + "&sessionID=" + cookies.get('sessionID')
              + "&userID=" + cookies.get('id'),requestSetup)
            .then(response =>response.json())
            .then(data =>{
              if (data.status === -1){
                changeCode(<div><h1> Oops! </h1>An Error Has Occured.</div>)
              }else{
                if (origin === "userProfile"){
                  showUserProfile(userID,startPos,endPos,"posts");
                  // userID, start, end
                }else if (origin === "indepthPost"){
                  showInDepthPost(postID,"changed");
                }else if (origin === "indepthComment"){
                  showInDepthComment(commentID,"changed");
                    //commentID
                }else{
                  changeCode(<div><h1> Oops! </h1>An Error Has Occured.</div>)
                }
              }
            })
        }
      }
      function handlePostUnlike(postID,origin,commentID = 0, userID = 0, startPos = 0, endPos = 0){
        if (!cookies.get("sessionID") || !cookies.get("userID")){
          getLoginPage(origin,postID,commentID,userID,startPos,endPos);
        }else{
          var sessionID = cookies.get('sessionID');
          var id = cookies.get('id');
          const requestSetup = {
              method: 'DELETE',
          }
          fetch(serverLocation + "/like?postID=" + postID + "&sessionID=" + sessionID + "&userID=" + id,requestSetup)
            .then(response => response.json())
            .then(data => {
              if (data.status === -1){
                changeCode(<div><h1> Oops! </h1>An Error Has Occured.</div>)
              }else{
                if (origin === "userProfile"){
                  showUserProfile(userID,startPos,endPos,"posts");
                }else if (origin === "indepthPost"){
                  showInDepthPost(postID,"changed");
                }else if (origin === "indepthComment"){
                  showInDepthComment(commentID,"changed");
                }else{
                  changeCode(<div><h1> Oops! </h1>An Error Has Occured.</div>)
                }
              }
            })
        }
      }
      function handleCommentLike(commentID,origin,postID = 0, userID = 0, startPos = 0, endPos = 0){
        if (!cookies.get("sessionID") || !cookies.get("userID")){
          getLoginPage(origin,postID,commentID,userID,startPos,endPos);
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
              if (data.status === -1){
                changeCode(<div><h1> Oops! </h1>An Error Has Occured.</div>)
              }else{
                if (origin === "userProfile"){
                  showUserProfile(userID,startPos,endPos,"comments");
                }else if (origin === "indepthPost"){
                  showInDepthPost(postID,startPos,endPos);
                }else if (origin === "indepthComment"){
                  showInDepthComment(commentID,"changed");
                }else{
                  changeCode(<div><h1> Oops! </h1>An Error Has Occured.</div>)
                }
              }
            })
        }
      }
      function handleCommentUnlike(commentID,origin,postID = 0, userID = 0, startPos = 0, endPos = 0){
        if (!cookies.get("sessionID") || !cookies.get("userID")){
          getLoginPage(origin,postID,commentID,userID,startPos,endPos);
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
              if (data.status === -1){
                changeCode(<div><h1> Oops! </h1>An Error Has Occured.</div>)
              }else{
                if (origin === "userProfile"){
                  showUserProfile(userID,startPos,endPos,"comments");
                }else if (origin === "indepthPost"){
                  showInDepthPost(postID,startPos,endPos);
                }else if (origin === "indepthComment"){
                  showInDepthComment(commentID,"changed");
                }else{
                  changeCode(<div><h1> Oops! </h1>An Error Has Occured.</div>)
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
          </Nav>
        </Navbar.Collapse>
          </Navbar>
        )
      }
      //Login Functions --Rework FIX THIS
      function handleLogin(event,origin,postID,commentID,userID,startPos,endPos){
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
                getLoginPage(origin,postID,commentID,userID,startPos,endPos);
              }else if (data.status === -1){///Other Error
                getLoginPage(origin,postID,commentID,userID,startPos,endPos);
              }else if (data.status === 0){//No Error
                cookies.set('name',data.username,{path:'/'});
                cookies.set('id',data.userID,{path:'/'});
                cookies.set('sessionID',data.sessionID,{path:'/'})
                cookies.set('expireTime',rememberMe === 'hour' ? Date.now() + 3600000 : "forever",{path:"/"})
                if (origin === ""){
                  window.location.reload();
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
                      <Button onClick={getHome}> Cancel Logging In </Button> <Button onClick={() => sendActivationAccountMessage(data.userID,data.rememberMe,origin)}> Reactivate Account </Button>
                    </div>
                  </div>
                )
              }
            });
      }
      function sendActivationAccountMessage(userID,rememberMe,origin){
        //Make a random code and send it in email
        const requestSetup = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({userID:userID})
        };
        fetch("reactivationCode",requestSetup)
          .then(response => response.json())
          .then(data => {
            changeCode(
              <div>
                <h1> Reactivating Your Account </h1>
                <div>
                  You have now been sent a six-character code to the email associated with your account.
                  <br></br>
                  Please check your email and type the code in below to reactivate your account.
                  <form onSubmit={(event) => handleReactivationCodeSubmission(event,userID,rememberMe,origin)}>
                    <input required>  </input>
                    <br></br>
                    <Button type='submit'> Reactivate Account </Button>
                  </form>
                </div>
              </div>
            )
          })
      }
      function handleReactivationCodeSubmission(event,userID,rememberMe,origin){

      }
      function getLoginPage(origin = "",postID=0,commentID=0,userID=0,startPos=0,endPos=0,msg=""){
        hideWriteForm();
        var cancelButton;
        if (origin !== ""){
          cancelButton = (<Button variant='dark' onClick={() => {cancel(origin,postID,commentID,userID,startPos,endPos)}} className='exitButton'>Cancel</Button>);
        }
        var overheadMsg;
        if (msg === "conf"){
          overheadMsg = (<div className="confMsg">You have successfully registered.</div>)
        }else if (msg === "err"){
          overheadMsg = (<div className="errMsg">There was an error. Please try again.</div>);
        }else if (msg === "badCombo"){
          overheadMsg = (<div className="errMsg">That was not a valid username/password combination.</div>);
        }
        changeCode(
          <div>
            {overheadMsg}
            {cancelButton}
            <form onSubmit={(event) => {handleLogin(event,origin = "",postID,commentID,userID,startPos,endPos)}}>
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
            </form>
          </div>
        )
      }
        //Set up Functions
      function showUserProfile(userID,startPos = 0, endPos = 10, variation = ""){
          //FIX THIS: Could memoize?
          //FIX THIS: check if changingcss is really needed?
          //Block List functions
          function showBlockedList(firstPoint = 0,secondPoint = 10){
            //show blocked users for a certain id
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
            var userID = cookies.get("id");
            var sessionID = cookies.get("sessionID");
            fetch(serverLocation + "/block?userID=" + userID + "&sessionID=" + sessionID)
              .then(response=>response.json())
              .then(data=>{
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
                if (data.status === -1){
                  changeCode(<div><h1> Oops! </h1>An Error Has Occured.</div>)
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
                if (data.status === -1){
                  changeCode(<div><h1> Oops! </h1>An Error Has Occured.</div>)
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
            var userID = cookies.get("id");
            var sessionID = cookies.get("sessionID");
            fetch(serverLocation + "/whoimviewing?userID="+userID+"&sessionID="+sessionID)
                .then(response=>response.json())
                .then(data=>{
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
                })
          }
          function showPeopleViewingMe(firstPoint = 0, secondPoint = 10){
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
            var userID = cookies.get("id");
            var sessionID = cookies.get("sessionID");
            fetch(serverLocation + "/whosviewingMe?userID="+userID+"&sessionID="+sessionID)
              .then(response=>response.json())
              .then(data=>{
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
              if (data.status === -1){
                changeCode(<div><h1> Oops! </h1>An Error Has Occured.</div>)
              }else{
                if (variation === "poster"){
                  showUserProfile(posterID,0,10,"options")
                }else if (variation === "viewer"){
                  showUserProfile(viewerID,0,10,"options")
                }else{
                  //FIX THIS
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
                if (data.status === -1){
                  changeCode(<div><h1> Oops! </h1>An Error Has Occured.</div>)
                }else{
                  if (variation === "profile"){
                    showUserProfile(userID,0,10,"options");
                  }else{
                    //FIX THIS
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
                if (data.status === -1){
                  changeCode(<div><h1> Oops! </h1>An Error Has Occured.</div>)
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
            var userID = cookies.get("id");
            var sessionID = cookies.get("sessionID");
            fetch(serverLocation + "/mylikedposts?sessionID=" + sessionID + "&userID=" + userID)
              .then(response => response.json())
              .then(data => {
                var listOfPosts;
                var listOfPostsCode;
                if (data.contents.length === 0){
                  listOfPostsCode = (<div> You have not liked any posts that are still visible. </div>)
                }
                else{
                  for (let i = firstPoint; i < Math.min(secondPoint,data.contents.length); i++){
                    //push a simple post?
                    var dict = data.contents[i];
                    listOfPosts.push(
                      <li key={i}>
                      <Card>
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
                      </li>
                    )
                  }
                  listOfPostsCode = (
                    <ul>
                      {listOfPosts}
                    </ul>
                  )
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
                      <div className="nav-link active" aria-current="page" onClick={() => {showLikedPosts(username,posts,comments)}}> Options </div>
                    </li>
                    <li className="nav-item">
                      <div className="nav-link" aria-current="page" onClick={() => {showLikedComments(username,posts,comments)}}> Options </div>
                    </li>
                    <li className="nav-item">
                      <div className="nav-link" aria-current="page" onClick={() => {showOptions(username,posts,comments)}}> Options </div>
                    </li>
                  </ul>
                  <div>
                    {paginationBar}
                    {listOfPostsCode}
                    {paginationBar}
                  </div>
                  </div>
                )
              })
          }
          function showLikedComments(username,posts,comments,firstPoint = 0,secondPoint = 10){
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
            var userID = cookies.get("id");
            var sessionID = cookies.get("sessionID");
            fetch(serverLocation + "/mylikedcomments?sessionID=" + sessionID + "&userID=" + userID)
              .then(response => response.json())
              .then(data => {
                var listOfComments;
                var listOfCommentsCode;
                if (data.contents.length === 0){
                  listOfCommentsCode = (<div> You have not liked any comments that are still visible. </div>);
                }else{
                  for (let i = firstPoint;  i < Math.min(secondPoint,data.contents.length); i++){
                    var dict = data.contents[i];
                    listOfComments.push(
                      <li key={i}>
                      <Card>
                        <Card.Subtitle> {"Username: " + dict.username} </Card.Subtitle>
                        <Card.Subtitle> {"User ID: " + dict.userID} </Card.Subtitle>
                        <Card.Body> {dict.comments} </Card.Body>
                        <Card.Subtitle> {dict.commentDate} </Card.Subtitle>
                        <Card.Body>
                        <br></br>
                        <Button onClick={()=>{showInDepthComment(data.contents[i].commentID)}}> Expand Post </Button>
                        </Card.Body>
                      </Card>
                      </li>
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
                      <div className="nav-link" aria-current="page" onClick={() => {showLikedPosts(username,posts,comments)}}> Options </div>
                    </li>
                    <li className="nav-item">
                      <div className="nav-link active" aria-current="page" onClick={() => {showLikedComments(username,posts,comments)}}> Options </div>
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
              })
          }
          function showOptions(username,posts,comments,variation=null){
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
                        <div className="nav-link active" aria-current="page" onClick={() => {showLikedPosts(username,posts,comments)}}> Options </div>
                      </li>
                      <li className="nav-item">
                        <div className="nav-link" aria-current="page" onClick={() => {showLikedComments(username,posts,comments)}}> Options </div>
                      </li>
                    <li className="nav-item">
                      <div className="nav-link active" aria-current="page" onClick={() => {showOptions(username,posts,comments)}}> Options </div>
                    </li>
                  </ul>
                  {optionsMenu}
                  </div>
                )
              }else{//issomeoneelse
                fetch(serverLocation + "/relationship?sessionID=" + cookies.get("sessionID") + "&userID=" + cookies.get("id") + "&profileID=" + userID)
                  .then(response=>response.json())
                  .then(data =>{
                    console.log(data);
                    var blockButton = (<Button variant='danger' onClick={() => blockUser()}> Block User </Button>);
                    if (data.blockingThem && data.blockingThem === 'true'){
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
                  })
              }
            }else{
              optionsMenu = (
                <div>
                You will need to be logged in to view these options.
                <br></br>
                <Button onClick={() => {getLoginPage("userProfileOptions",0,userID,startPos,endPos)}}> Login </Button>
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
            var listOfShownComments = [];
            var likeText = (<Button className='likeText' onClick={() => {getLoginPage("userProfileComments",0,userID,startPos,endPos)}}>Like</Button>);
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
            var likedPosts;
            if (cookies.get("id") && cookies.get("id") === userID){
              likedPosts = (
                <div>
                <li className="nav-item">
                  <div className="nav-link active" aria-current="page" onClick={() => {showLikedPosts(username,posts,comments)}}> Options </div>
                </li>
                <li className="nav-item">
                  <div className="nav-link" aria-current="page" onClick={() => {showLikedComments(username,posts,comments)}}> Options </div>
                </li>
                </div>
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
              <ul className="nav nav-tabs justify-content-center">
                <li className="nav-item">
                  <div className="nav-link"  onClick={() => {showPosts(username,posts,0,10,comments)}}>{username}'s Posts</div>
                </li>
                <li className="nav-item">
                  <div className="nav-link active" aria-current="page" onClick={()=>{showComments(username,comments,0,10,posts)}}>{username}'s Comments</div>
                </li>
                {likedPosts}
                <li className="nav-item">
                  <div className="nav-link"  onClick={() => {showOptions(username,posts,comments)}}> Options </div>
                </li>
              </ul>
              <div className='centerAlignPaginationBar'> {paginationBar}  </div>
              <div className='listOfStuffs'>
                {listOfShownComments}
              </div>
              <div className='centerAlignPaginationBar'> {paginationBar}  </div>
              </div>
            )
          }
          function showPosts(username,posts,start,end,comments, variation = ""){
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
            var listOfShownPosts = [];
            var detect = cookies.get('id') && cookies.get('sessionID');
            for (let i = start; i < (Math.min(end,posts.length)); i++){
              var dict = posts[i];
              var likeText = (<Button className='likeText' onClick={() => {getLoginPage("userProfilePosts",0,userID,startPos,endPos)}}>Like</Button>);
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
            var likedPosts;
            if (cookies.get("id") && cookies.get("id") === userID){
              likedPosts = (
                <div>
                <li className="nav-item">
                  <div className="nav-link active" aria-current="page" onClick={() => {showLikedPosts(username,posts,comments)}}> Options </div>
                </li>
                <li className="nav-item">
                  <div className="nav-link" aria-current="page" onClick={() => {showLikedComments(username,posts,comments)}}> Options </div>
                </li>
                </div>
              )
            }
            changeCode(
              <div>
              {msg}
              <h1> {username}'s Profile </h1>
              <ul className="nav nav-tabs justify-content-center">
                <li className="nav-item">
                  <div className="nav-link active" aria-current="page" onClick={() => {showPosts(username,posts,start,end,comments)}}>{username}'s Posts</div>
                </li>
                <li className="nav-item">
                  <div className="nav-link" onClick={()=>{showComments(username,comments,0,10,posts)}}>{username}'s Comments</div>
                </li>
                {likedPosts}
                <li className="nav-item">
                  <div className="nav-link"  onClick={() => {showOptions(username,posts,comments)}}> Options </div>
                </li>
              </ul>
              <div className='centerAlignPaginationBar'> {paginationBar}  </div>
              <div className='listOfStuffs'>
                {listOfShownPosts}
              </div>
              <div className='centerAlignPaginationBar'> {paginationBar}  </div>
              </div>
            );
          }
          //Privacy Handlers
          function showDeactivationPage(){
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
                if (data.status === -1){
                  changeCode(<div><h1> Oops! </h1>An Error Has Occured.</div>)
                }else{
                  if (visibility === "hidden"){
                    //remove all cookies and set them at home
                    cookies.remove("sessionID",{path: '/'});
                    cookies.remove("expireTime",{path:"/"})
                    cookies.remove("name",{path:'/'});
                    cookies.remove("id",{path:'/'});
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
              )
          }
          //Main
          var sessionID = cookies.get("sessionID");
          var id = cookies.get("id");
          if (sessionID && id){
            fetch(serverLocation + "/user?profileID=" + userID + "&userID=" + id + "&sessionID=" + sessionID)
              .then(response => response.json())
              .then(data=>{
                // console.log(data)
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
                }
                else{
                  showPosts(data.username,data.posts,startPos,endPos,data.comments);
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
            console.log(data);
            var editButton;
            var likePostButton = (
              <Button onClick={() => {getLoginPage("indepthComment",0,commentID,0,0,0)}}> Like </Button>
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
            changeCode(
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
            ///FIX THIS: May need more details or beautification
            //FIX THIS: Maybe Include the like button above?
          })}
      function showInDepthPost(postID,commentStart = 0, commentEnd = 10, pact = ""){
          //Other
          function displayCommentWriter(){
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
          function handleWritingComment(event){
            event.preventDefault();
            var content = document.getElementById('postContent').value;
            var privacy = document.getElementById('privacySwitch').checked ? 'private' : 'public';
            const requestSetup = {
                method: 'PUT',
            }
            // console.log(content,privacy);
            fetch(serverLocation+"/comment?userID=" + cookies.get('id') + "&sessionID="
              + cookies.get('sessionID') + "&postID=" + postID + "&content=" + content + "&privacy=" + privacy,requestSetup)
              .then(response => response.json())
              .then(data=>{
                if (data.status === -1){
                  console.log(data);
                  changeCode(<div><h1> Oops! </h1>An Error Has Occured.</div>);
                }else{
                  showInDepthPost(postID,0,10,"Add");
                }
              })
          }
          function handlePrivacyToggled(){
            var checked = document.getElementById('privacySwitch').checked;
            console.log(checked);
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
              displayCommentWriter();
            }
          }
          changeMainBodyCSS(
            {
              display: 'none',
              transition: 'height 2s ease-in'
            }
          );
          changeInDepthCSS(
            {
              height: 'auto',
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
          var detect = cookies.get("sessionID") && cookies.get("id");
          var serverString = serverLocation + "/post?postID=" + postID;
          if (detect){
            serverString = serverLocation + "/post?postID=" + postID + "&sessionID=" + cookies.get('sessionID') + "&userID=" + cookies.get('id')
          }
          fetch(serverString)
            .then(response=>response.json())
            .then(data => {
              console.log(data);
              if (data.status === -1 || data.status === -2){
                  changeCode(<div><h1> Oops! </h1>An Error Has Occured.</div>)
              }
              else{
                var listOfComments = [];
                for (let key = commentStart; key < Math.min(data.comments.length,commentEnd); key++){
                  var comment = data.comments[key];
                  var likeButton = (<Button onClick={() => {getLoginPage("indepthPost",postID,0,0,commentStart,commentEnd)}}>Like</Button>);
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
                var postLikedText = (<Button onClick={() => {getLoginPage("indepthPost",postID,0,0,commentStart,commentEnd)}}>Like</Button>);;
                if (detect){
                  postLikedText = (<Button onClick={() => {handlePostLike(data.postID,"indepthPost")}}>Like</Button>);
                  if (data.likedPost && data.likedPost === "Liked"){
                    postLikedText = (<Button onClick={() => {handlePostUnlike(data.postID,"indepthPost")}}>Unlike</Button>)
                  }
                }
                var writeCommentButton = (<Button onClick={() => {getLoginPage("indepthPost",postID,0,0,commentStart,commentEnd)}}>Like</Button>);
                if (detect){
                  writeCommentButton = (<Button onClick={() => {displayCommentWriter()}}>Add Comment</Button>)
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
      function simplePost(key,dict){
        //FIX THIS: Maybe be able to like from the simple post?
        return (
        <Card key={key}>
          <Card.Title> {dict.title} </Card.Title>
          <Card.Subtitle> {"Username: " + dict.username} </Card.Subtitle>
          <Card.Subtitle> {"User ID: " + dict.userID} </Card.Subtitle>
          <Card.Body> {dict.content} </Card.Body>
          <Card.Subtitle> {dict.subDate} </Card.Subtitle>
          <Card.Body>
          Likes: {dict.totalLikes} Comments: {dict.totalComments}
          <br></br>
          <Button onClick={()=>{showInDepthPost(dict.postID)}}> Expand Post </Button>
          </Card.Body>
        </Card>
        )
        }
      //Search Page
      function getSearchPage(){
        hideWriteForm();
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
        //FIX THIS: HANDLE SESSIONID AND ID
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
        // console.log(url);
        //fetch and changecode to a new screen that displays all the posts
        fetch(url)
        .then(response=>response.json())
        .then(data => {
          console.log(data);
          var listOfPosts = [];
          for (let key = 0; key < data.contents.length; key++){
            listOfPosts.push(simplePost(key,data.contents[key]))
          }
          if (listOfPosts.length === 0){
            listOfPosts = (<div>There were no posts matching your criteria.</div>)
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
            {listOfPosts}
            </div>
          )
        })
      }
      ////////////////
      function getRegistrationPage(){
        hideWriteForm();
        // if (checkSessionID()){
        //   return;
        // }
        changeCode(
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
        )
      }
      //SHOWERS AND HIDERS
      function showWriteForm(){
        //have something navigate down from the top
        if (checkSessionID()){
          return;
        }
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
            {privacySwitchDescriptor}
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
      //LOGGED IN GETEMS
      function getMyFeed(start = 0, end = 10){
        hideWriteForm();
        if (checkSessionID()){
          return;
        }
        var listOfPosts = [];
        var userSession = cookies.get("sessionID");
        var userId = cookies.get("id");
        fetch(serverLocation + "/myfeed?userID=" + userId + "&sessionID="+userSession)
          .then(response=>response.json())
          .then(data =>{
            console.log(data);
            for (let key = start; key < Math.min(data.contents.length,end); key++){
              listOfPosts.push(simplePost(key,data.contents[key]))
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
          })
      }
      function getProfile(){ //be able to delete account, change visiblity, identify if admin, post count
        if (checkSessionID()){
          getExpiredHome()
        }
        else{
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
          showUserProfile(cookies.get("id"));
        }
        //get all posts
        //be able to set Visibility
        //show role
        //be able to delete Account
      }
      //Event Handlers
      function handleRegistration(event){
        event.preventDefault();
        // if (checkSessionID()){
        //   return;
        // }
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
                getLoginPage("",0,0,0,0,0,"conf");
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
      function handleWritePost(event){
        //FIX THIS: REWORK
        event.preventDefault();
        if (checkSessionID()){
          return;
        }
        var title = document.getElementById('postTitle').value;
        var content = document.getElementById('postContent').value;
        var privacy = document.getElementById('privacySwitch').checked ? 'private' : 'public';
        var sessionID = cookies.get('sessionID');
        const requestSetup = {
            method: 'PUT',
        }
        fetch(serverLocation + "/post?title=" + title + "&contents="
        + content + "&visibility=" + privacy + '&userID=' + cookies.get('id') + "&sessionID=" + cookies.get(sessionID),requestSetup)
          .then(response => response.json())
          .then(data => {
            if (data.status !== 0){
              changeCode(<div><h1> Oops! </h1>An Error Has Occured.</div>)
            }else{
              showUserProfile(cookies.get("id"),0,10,"posts");
            }
          });
      }
      function handlePrivacyChecked(){
        if (checkSessionID()){
          return;
        }
        var i = document.getElementById('privacySwitch').checked;
        // console.log(i);
        if (i){
          changePrivacySwitchDescriptor(
            <div> This post can only be seen by you or those you've linked with. </div>
          )
        }else{
          changePrivacySwitchDescriptor(
            <div> This post can be seen by anyone. </div>
          )
        }
      }
      //Check Session Cookies
      function checkSessionID(){
        //really only necessary if sessionID exists and timelimit is over
        //read sessionID and log out user if timeline is too old
        // console.log(expireTime);
        if (cookies.get('expireTime') !== "forever" && Date.now() >= cookies.get('expireTime')){
          getExpiredHome();
          return true;
        }
        if ( !cookies.get("sessionID") || !cookies.get("id")){
          return false;
        }
        var expiry = cookies.get("expireTime");
        if (!expiry || (expiry !== "forever" && Date.now() >= expiry)){
          getExpiredHome();
          // console.log("Error2");
          return true;
        }
        return false;
      }
      function getExpiredHome(){
        cookies.remove("sessionID",{path: '/'});
        cookies.remove("expireTime",{path:"/"})
        cookies.remove("name",{path:'/'});
        cookies.remove("id",{path:'/'});
        changeNavToLoggedOut();
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
        var listOfPosts = [];
        fetch(serverLocation + "/posts")
          .then(response=>response.json())
          .then(data => {
              // console.log(data.contents);
              for (let key = 0; key < data.contents.length; key++){
                listOfPosts.push(simplePost(key,data.contents[key]))
              }
              // console.log(listOfPosts);
              changeCode(
                <div>
                <div className='errMsg'> You have been logged out. </div>
               <h1> QuickiePost </h1>
                {listOfPosts}
                </div>
              )
          })
      }
      //log out
      function logOut(){
        cookies.remove("sessionID",{path: '/'});
        cookies.remove("expireTime",{path:"/"})
        cookies.remove("name",{path:'/'});
        cookies.remove("id",{path:'/'});
        changeNavToLoggedOut();
        fetch(serverLocation + "/posts")
          .then(response=>response.json())
          .then(data => {
              getHome('exit');
          })
      }
      //MAIN
      hideWriteForm();
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
        changeNavToLoggedOut();
      }
      var listOfPosts = [];
      var extensionString = "";
      if (cookies.get("id") && cookies.get("sessionID")){
        extensionString = "?sessionID=" + cookies.get("sessionID") + "&id=" + cookies.get("id");
      }
        fetch(serverLocation + "/posts" + extensionString)
          .then(response=>response.json())
          .then(data => {
            for (let key = beginPosition; key < Math.min(data.contents.length,endPosition); key++){
              listOfPosts.push(simplePost(key,data.contents[key]))
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
    },[serverLocation,cookies,changeCode,privacySwitchDescriptor])

  //FIX THIS If SessionID, change server to accomadate being logged in
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
    {code}
    </div>
    </div>
  );
}

export default App;
