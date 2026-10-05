import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import { createRoot } from 'react-dom/client'
import { AuthProvider, useAuth } from './context/login'
import Signup from './pages/signup'
import Login from './pages/login'
import Feed from './pages/feed'
import Friends from './pages/friends'
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css'

export const ENDPOINTS = {
  // signup: `${API_URL}/signup`, // POST { email, password, username }
  signup: 'https://soc-med-api-production.up.railway.app/auth/signup',
  // login: `${API_URL}/login`, // POST { email, password } -> token
  login: 'https://soc-med-api-production.up.railway.app/auth/login',
  // posts: `${API_URL}/posts`, // GET public + friends' posts
  posts: 'https://soc-med-api-production.up.railway.app/posts',
  // createPost: `${API_URL}/posts`, // POST { title, content, visibility } -> new post
  createPost: 'https://soc-med-api-production.up.railway.app/posts',
  // users: `${API_URL}/users`, // GET all users
  users: 'https://soc-med-api-production.up.railway.app/users',
  // friends: `${API_URL}/friends`, // GET the current user's friends
  friends: 'https://soc-med-api-production.up.railway.app/friends',
  // follow: `${API_URL}/follow`, // POST { followed_id } & GET all followed users
  follow: 'https://soc-med-api-production.up.railway.app/follow',
}

function RequireAuth({ children }) {
  const { token } = useAuth()
  return token ? children : <Navigate to="/login" replace />
}

function GuestOnly({ children }) {
  const { token } = useAuth()
  return token ? <Navigate to="/feed" replace /> : children
}

function Nav() {
  const { token, logout } = useAuth()
  if (!token) {
    return (
      <nav className="kitten-nav navbar navbar-expand">
        <div className="kitten-nav-inner container-fluid">
          <Link className="kitten-brand navbar-brand" to="/login"><span className="kitten-mark" aria-hidden="true">{'\u{1F431}'}</span><span>Meowly</span></Link>
          <div className="kitten-nav-links">
            <Link className="kitten-nav-link" to="/login">Login</Link>
            <Link className="kitten-nav-link kitten-signup" to="/signup">Sign up</Link>
          </div>
        </div>
      </nav>
    )
  }
  return (
    <nav className="kitten-nav navbar navbar-expand">
      <div className="kitten-nav-inner container-fluid">
        <Link className="kitten-brand navbar-brand" to="/feed"><span className="kitten-mark" aria-hidden="true">{'\u{1F431}'}</span><span>Meowly</span></Link>
        <div className="kitten-nav-links">
          <Link className="kitten-nav-link" to="/feed">Feed</Link>
          <Link className="kitten-nav-link" to="/friends">Friends</Link>
          <button className="kitten-nav-link kitten-logout" onClick={logout}>Log out</button>
        </div>
      </div>
    </nav>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Nav />
        <Routes>
          <Route path="signup" element={<GuestOnly><Signup /></GuestOnly>} />
          <Route path="login" element={<GuestOnly><Login /></GuestOnly>} />
          <Route path="feed" element={<RequireAuth><Feed /></RequireAuth>} />
          <Route path="friends" element={<RequireAuth><Friends /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/feed" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

createRoot(document.getElementById('root')).render(
  <App />,
)

