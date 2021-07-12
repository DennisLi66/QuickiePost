import logo from './logo.svg';
import Navbar from 'react-bootstrap/Navbar'
import Nav from 'react-bootstrap/Nav'
// import Button from 'react-bootstrap/Button'
import './App.css';

//things ill Need
//simple navbar
//onload produce Posts

function App() {




  return (
    <div className="App">
    <Navbar bg="light" expand="lg">
  <Navbar.Brand>QuickiePost</Navbar.Brand>
  <Navbar.Toggle aria-controls="navbarScroll" />
  <Navbar.Collapse id="navbarScroll">
    <Nav
      className="mr-auto my-2 my-lg-0"
      style={{ maxHeight: '100px' }}
      navbarScroll
    >
      <Nav.Link>Home</Nav.Link>
      <Nav.Link>Register</Nav.Link>
      <Nav.Link>Login</Nav.Link>
      <Nav.Link>Search</Nav.Link>
    </Nav>

  </Navbar.Collapse>
</Navbar>
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
