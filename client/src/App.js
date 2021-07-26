// import logo from './logo.svg';
import Navbar from 'react-bootstrap/Navbar'
import Nav from 'react-bootstrap/Nav'
import Card from "react-bootstrap/Card"
// import Form from 'react-bootstrap/Form'
// import ReactDOM from 'react-dom';
import Button from 'react-bootstrap/Button'
import './App.css';
import React from "react";
import Cookies from 'universal-cookie';
//things ill Need
//ADD comments and likes to posts
//INCLUDE Private posts for self users
//Add fine tuning to posts after submission and in my posts
//change getPosts to SELECT posts where post != private and user != private
//FIX THIS: upgrade simple posts when logged in to post comments
//FIX THIS: Add a display if there are no posts
//FIX THIS IF LOGGED IN RETRIEVE POSTS WITH LIKES
//FIX THIS ADD Pagination

function App() {
  //Set up Functions
  function simplePost(key,dict){
    var likeText;
    if (dict.Liked && dict.Liked === "Liked"){
      likeText = (
        <div onClick={handleLikedPost}>Unlike</div>
      );
    }else{
      likeText = (
        <div onClick={handleUnlikedPost}>Like</div>
      );
    }
    return (
      <Card key={key}>
        <Card.Title> {dict.title} </Card.Title>
        <Card.Subtitle> {"Username: " + dict.username} </Card.Subtitle>
        <Card.Subtitle> {"User ID: " + dict.userID} </Card.Subtitle>
        <Card.Body> {dict.content} </Card.Body>
        <Card.Subtitle> {dict.subDate} </Card.Subtitle>
        <Card.Body>
        Likes: {dict.totalLikes} Comments: {dict.totalComments}
        {likeText}
        <div onClick={()=>{showInDepthPost(dict.postID)}}>
          Comment
        </div>
        </Card.Body>
      </Card>
    )
  }
  //Variables
  const serverLocation = "http://localhost:3001";
  const cookies = new Cookies();
  const id = cookies.get("id");
  const sessionID = cookies.get("sessionID");
  const expireTime = cookies.get("expireTime");
  // console.log(id)
  const [code,changeCode] = React.useState(
    <div>
    <h1> QuickiePost </h1>
    </div>
  );
  const [navBarLoggedOut,changeLoggedOut] = React.useState(
    false
  )
  const [navBarLoggedIn,changeLoggedIn] = React.useState(
    true
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
  const [inDepthPostCSS,changeInDepthCSS] = React.useState(

  );
  const [privacySwitchDescriptor,changePrivacySwitchDescriptor] = React.useState(
    <div> This post can be seen by anyone. </div>
  )
  //Rerendering Functions
  function getHome(){
    hideWriteForm();
    if (checkSessionID()){
      return;
    }
    var listOfPosts = [];
    fetch(serverLocation + "/posts")
      .then(response=>response.json())
      .then(data => {
          // console.log(data.contents);
          for ( const key in data.contents){
            // console.log(simplePost(data.contents[key]));
            listOfPosts.push(simplePost(key,data.contents[key]))
          }
          // console.log(listOfPosts);
          changeCode(
            <div>
           <h1> QuickiePost </h1>
            {listOfPosts}
            </div>
          )
      })
  }
  function getSearchPage(){
    hideWriteForm();
    // if (checkSessionID()){
    //   return;
    // }
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
  function getLoginPage(){
    hideWriteForm();
    // if (checkSessionID()){
    //   return;
    // }
    changeCode(
      <form onSubmit={handleLogin}>
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
    )
  }
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
    )
  }
  function hideWriteForm(){
    changeWriteFormCSS(
      {
        height: '0%',
        display: 'none',
        transition: 'height 2s ease-in'
      }
    )
    changeMainBodyCSS({
      height: 'auto',
      transition: 'height 2s ease-in'
    })
  }
  function showInDepthPost(postID){
    console.log(postID);
    changeMainBodyCSS(
      {
        display: 'none',
        transition: 'height 2s ease-in'
      }
    );
    var sID = cookies.get("sessionID");
    var id = cookies.get("id");
    if (sID && id){

    }else{
      
    }
  }
  function closeInDepthPost(){
    changeMainBodyCSS({
      height: 'auto',
      transition: 'height 2s ease-in'
    });
  }
  function getMyPosts(){ //change visibility possible here
    hideWriteForm();
    if (checkSessionID()){
      return;
    }
    var listOfPosts = [];
    fetch(serverLocation + "/user?userID=" + cookies.get("id"))
      .then(response=>response.json())
      .then(data => {
        console.log(data);
        for ( const key in data.posts){
          // console.log(data.posts[key]);
          if (data.posts[key].content){
            listOfPosts.push(simplePost(key,data.posts[key]))
          }
        }
        if (listOfPosts.length === 0){
          listOfPosts = (
            <div> You either haven't written any posts, or they've all been deleted.</div>
          )
        }
        changeCode(
          <div>
          <h1> QuickiePost - Your Posts </h1>
          {listOfPosts}
          </div>
        )
      })
  }
  function getMyFeed(){
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
        for ( const key in data.contents){
          // console.log(simplePost(data.contents[key]));
          listOfPosts.push(simplePost(key,data.contents[key]))
        }
        console.log(listOfPosts);
        changeCode(
          <div>
         <h1> QuickiePost - Your Feed</h1>
          {listOfPosts}
          </div>
        )
      })
  }
  function getProfile(){ //be able to delete account, change visiblity, identify if admin, post count
    if (checkSessionID()){
      return;
    }
    //get all posts
    //be able to set Visibility
    //show role
    //be able to delete Account
    //show stats - likes, comments, amount of posts
  }
  //Event Handlers
  function handleSearch(event){
    event.preventDefault();
    // if (checkSessionID()){
    //   return;
    // }
    var title = document.getElementById("title").value;
    var content = document.getElementById("content").value;
    var username = document.getElementById("username").value;
    var sDate = document.getElementById("sDate").value;
    var url = serverLocation + "/search?";
    var isBig = false;
    if (title){
      console.log("Title: " + title);
      isBig = true;
      url += "title=" + title;
    }
    if (content){
      console.log("Content: " + content );
      if (isBig){
        url += "&content=" + content;
      }else{
        isBig = true;
        url += "content=" + content;
      }
    }
    if (username){
      console.log("Username: " + username);
      if (isBig){
        url += "&username=" + username;
      }else{
        isBig = true;
        url += "username=" + username;
      }
    }
    if (sDate){
      console.log("sdate: " + sDate);
      if (isBig){
        url += "&sdate=" + sDate
      }else{
        url += "sDate=" + sDate;
      }
    }
    url = encodeURI(url);
    console.log(url);
    //fetch and changecode to a new screen that displays all the posts
    fetch(url)
    .then(response=>response.json())
    .then(data => {
      console.log(data);
      var listOfPosts = [];
      for ( const key in data.contents){
        // console.log(simplePost(data.contents[key]));
        listOfPosts.push(simplePost(key,data.contents[key]))
      }
      if (listOfPosts.length === 0){
        listOfPosts = (<div>There were no posts matching your criteria.</div>)
      }
      changeCode(
        <div>
        <h1> Search for a Post </h1>
        <form onSubmit={handleSearch}>
        <label for='title'>Search for Title:</label>
        <br></br>
        <input name='title' id='title' placeholder={title}></input>
        <br></br>
        <label for='content'>Search by Contents:</label>
        <br></br>
        <input name='content'  id='content' placeholder={content}></input>
        <br></br>
        <label for='username'>Search by Username:</label>
        <br></br>
        <input name='username' placeholder={username} id='username'></input>
        <br></br>
        <label for='date'>Search By Date:</label>
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
            changeCode(
              <div>
              <div className='confMsg'>You have been registered.</div>
              <form onSubmit={handleLogin}>
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
  function handleLogin(event){
    event.preventDefault();
    // if (checkSessionID()){
    //   return;
    // }
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
          changeCode(
            <div>
              <div className="errMsg">That was not an existing email/password combination.</div>
              <form onSubmit={handleLogin}>
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
        }else if (data.status === -1){///Other Error
          changeCode(
            <div>
              <div className="errMsg">There was an error. Please try again.</div>
              <form onSubmit={handleLogin}>
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
        }else if (data.status === 0){//No Error
          cookies.set('name',data.username,{path:'/'});
          cookies.set('id',data.userID,{path:'/'});
          cookies.set('sessionID',data.sessionID,{path:'/'})
          cookies.set('expireTime',rememberMe === 'hour' ? Date.now() + 3600000 : "forever",{path:"/"})
          changeLoggedIn(true);
          changeLoggedOut(false);
          getHome();
        }
      });
  }
  function handleWritePost(event){
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
        hideWriteForm();
        var listOfPosts = [];
        fetch(serverLocation + "/user?userID=" + cookies.get("id"))
          .then(response=>response.json())
          .then(data => {
            console.log(data);
            for ( const key in data.posts){
              // console.log(data.posts[key]);
              if (data.posts[key].content){
                listOfPosts.push(simplePost(key,data.posts[key]))
              }
            }
            if (listOfPosts.length === 0){
              listOfPosts = (
                <div> You either haven't written any posts, or they've all been deleted.</div>
              )
            }
            changeCode(
              <div>
              <h1> QuickiePost - Your Posts </h1>
              {listOfPosts}
              </div>
            )
          })
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
  function handleLikedPost(){

  }
  function handleUnlikedPost(){

  }
  //Check Session Cookies
  function checkSessionID(){
    //really only necessary if sessionID exists and timelimit is over
    //read sessionID and log out user if timeline is too old
    // console.log(expireTime);
    if (expireTime !== "forever" && Date.now() >= expireTime){
      // console.log(Date.now() > expireTime);
      // console.log(Date.now() < expireTime);
      getExpiredHome();
      return true;
    }
    var expiry = cookies.get("expireTime");
    if (!expiry || !cookies.get("sessionID") || !cookies.get("id") || (expiry !== "forever" && Date.now() >= expireTime)){
      getExpiredHome();
      return true;
    }
    return false;
  }
  function getExpiredHome(){
    cookies.remove("sessionID",{path: '/'});
    cookies.remove("expireTime",{path:"/"})
    cookies.remove("name",{path:'/'});
    cookies.remove("id",{path:'/'});
    changeLoggedOut(true);
    changeLoggedIn(false);
    var listOfPosts = [];
    fetch(serverLocation + "/posts")
      .then(response=>response.json())
      .then(data => {
          // console.log(data.contents);
          for ( const key in data.contents){
            // console.log(simplePost(data.contents[key]));
            listOfPosts.push(simplePost(key,data.contents[key]))
          }
          console.log(listOfPosts);
          changeCode(
            <div>
            <div className='errMsg'> Your session has expired. </div>
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
    changeLoggedOut(true);
    changeLoggedIn(false);
    var listOfPosts = [];
    fetch(serverLocation + "/posts")
      .then(response=>response.json())
      .then(data => {
          // console.log(data.contents);
          for ( const key in data.contents){
            // console.log(simplePost(data.contents[key]));
            listOfPosts.push(simplePost(key,data.contents[key]))
          }
          console.log(listOfPosts);
          changeCode(
            <div>
            <div className='confMsg'> You have been logged out. </div>
           <h1> QuickiePost </h1>
            {listOfPosts}
            </div>
          )
      })
  }
  //FIX THIS If SessionID, change server to accomadate being logged in
  React.useEffect(() => {
    var listOfPosts = [];
    var serverLocation = "http://localhost:3001";
      fetch(serverLocation + "/posts")
        .then(response=>response.json())
        .then(data => {
            for ( const key in data.contents){
              listOfPosts.push(simplePost(key,data.contents[key]))
            }
            // console.log(listOfPosts);
            changeCode(
              <div>
             <h1> QuickiePost </h1>
              {listOfPosts}
              </div>
            )
        })

  },[changeCode,simplePost,sessionID,id])
  React.useEffect(() => {
    if (id && (expireTime === "forever" || Date.now() < expireTime)){
      console.log("Logged In");
      changeLoggedIn(true);
      changeLoggedOut(false);
    }
    else{
      console.log("Not Logged In.");
      changeLoggedIn(false);
      changeLoggedOut(true);
    }
  },[expireTime,id,changeLoggedIn,changeLoggedOut])

  return (
    <div className="App">
    <Navbar bg="light" expand="lg" className='loggedInBar' hidden={navBarLoggedOut}>
  <Navbar.Brand
  onClick={getHome}
  >QuickiePost</Navbar.Brand>
  <Navbar.Toggle aria-controls="navbarScroll" />
  <Navbar.Collapse id="navbarScroll">
    <Nav
      className="mr-auto my-2 my-lg-0 container-fluid"
      style={{ maxHeight: '100px' }}
      navbarScroll
    >
      <Nav.Link
      onClick={getHome}
      >Home</Nav.Link>
      <Nav.Link
      onClick={getMyFeed}
      >My Feed</Nav.Link>
      <Nav.Link
      onClick={getSearchPage}
      >Search</Nav.Link>
      <Nav.Link
      onClick={getMyPosts}
      >My Posts</Nav.Link>
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
    <Navbar bg="light" expand="lg" className='loggedOutBar' hidden={navBarLoggedIn}>
  <Navbar.Brand
  onClick={getHome}
  >QuickiePost</Navbar.Brand>
  <Navbar.Toggle aria-controls="navbarScroll" />
  <Navbar.Collapse id="navbarScroll">
    <Nav
      className="mr-auto my-2 my-lg-0"
      style={{ maxHeight: '100px' }}
      navbarScroll
    >
      <Nav.Link
      onClick={getHome}
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
    <div className='writeForm' style={writeFormCSS}>
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
    <div className='inDepthPost' style={inDepthPostCSS}>

    </div>
    <div className='mainBody' style={mainBodyCSS}>
    {code}
    </div>
    </div>
  );
}

export default App;
