// import logo from './logo.svg';
import Navbar from 'react-bootstrap/Navbar'
import Nav from 'react-bootstrap/Nav'
import Card from "react-bootstrap/Card"
// import ReactDOM from 'react-dom';
// import Button from 'react-bootstrap/Button'
import './App.css';
import React from "react";

//things ill Need
//simple navbar
//onload produce Posts

function App() {
  //Set up Functions
  function simplePost(key,dict){
    return (
      <Card key={key}>
        <Card.Title> {dict.title} </Card.Title>
        <Card.Subtitle> {"User ID: " + dict.userID} </Card.Subtitle>
        <Card.Body> {dict.content} </Card.Body>
        <Card.Subtitle> {dict.subDate} </Card.Subtitle>
      </Card>
    )
  }
  //Variables
  var serverLocation = "http://localhost:3001";
  const [code,changeCode] = React.useState(
    <div>
    <h1> QuickiePost </h1>
    </div>
  );
  //Rerendering Functions
  // function getPosts(){
  //   var listOfPosts = [];
  //   fetch(serverLocation + "/posts")
  //     .then(response=>response.json())
  //     .then(data => {
  //         // console.log(data.contents);
  //         for ( const key in data.contents){
  //           // console.log(simplePost(data.contents[key]));
  //           listOfPosts.push(simplePost(key,data.contents[key]))
  //         }
  //         console.log(listOfPosts);
  //         return listOfPosts;
  //     })
  // }
  function getHome(){
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
           <h1> QuickiePost </h1>
            {listOfPosts}
            </div>
          )
      })
  }

  React.useEffect(() => {
    var listOfPosts = [];
    var serverLocation = "http://localhost:3001";
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
           <h1> QuickiePost </h1>
            {listOfPosts}
            </div>
          )
      })
  },[changeCode])

  return (
    <div className="App">
    <Navbar bg="light" expand="lg">
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
      >Home</Nav.Link>
      <Nav.Link>Register</Nav.Link>
      <Nav.Link>Login</Nav.Link>
      <Nav.Link>Search</Nav.Link>
    </Nav>
  </Navbar.Collapse>
</Navbar>
    {code}
    </div>
  );
}

export default App;
