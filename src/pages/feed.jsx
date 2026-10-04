import { useEffect, useState } from 'react'
import { useAuth } from '../context/login'
import { ENDPOINTS } from '../App'

function getPostAuthorId(post) {
  return post.author_id ?? post.authorId ?? post.user_id ?? post.userId
    ?? post.author?.id ?? post.author?.user_id ?? post.author?.userId
}

export default function Feed() {
  const auth = useAuth()
  const { apiFetch } = auth
  const currentUserId = auth.user?.id
  const [posts, setPosts] = useState([])
  const [friends, setFriends] = useState([])
  const [followedIds, setFollowedIds] = useState(() => new Set())
  const [followedLoaded, setFollowedLoaded] = useState(false)
  const [followingIds, setFollowingIds] = useState(() => new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [visibility, setVisibility] = useState('')
  const [posting, setPosting] = useState(false)

  function loadPosts() {
    return apiFetch(ENDPOINTS.posts)
      .then((data) => setPosts(Array.isArray(data) ? data : data.posts || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadPosts()
  }, [])

  useEffect(() => {
    setFollowedLoaded(false)
    apiFetch(ENDPOINTS.follow)
      .then((data) => {
        const followRows = Array.isArray(data) ? data : []
        setFollowedIds(new Set(
          followRows
            .map((relationship) => relationship.followed_id)
            .filter((followedId) => followedId != null)
            .map(String),
        ))
      })
      .catch(() => setFollowedIds(new Set()))
      .finally(() => setFollowedLoaded(true))
  }, [apiFetch, currentUserId])

  useEffect(() => {
    apiFetch(ENDPOINTS.friends)
      .then((data) => setFriends(Array.isArray(data) ? data : data.users || []))
      .catch(() => {})
  }, [apiFetch])

  const friendIds = new Set(friends.map((friend) => friend.id ?? friend.user_id ?? friend.userId).filter((id) => id != null).map(String))

  async function handleFollow(authorId) {
    const id = String(authorId)
    setFollowingIds((current) => new Set(current).add(id))
    setError('')
    try {
      await apiFetch(ENDPOINTS.follow, {
        method: 'POST',
        body: JSON.stringify({ followed_id: String(authorId) }),
      })
      setFollowedIds((current) => new Set(current).add(id))
      setFriends((current) => current.some((friend) => String(friend.id ?? friend.user_id) === id)
        ? current
        : [...current, { id: authorId }])
    } catch (err) {
      if (err.status === 409 || err.message === 'Already following this user') {
        setFollowedIds((current) => new Set(current).add(id))
      } else {
        setError(err.message)
      }
    } finally {
      setFollowingIds((current) => {
        const next = new Set(current)
        next.delete(id)
        return next
      })
    }
  }

  async function handlePost(e) {
    e.preventDefault()
    setError('')
    if (!title.trim()) return setError('Add a title')
    if (!content.trim()) return setError('Write something first')
    if (!visibility) return setError('Choose Public or Friends only')

    setPosting(true)
    try {
      await apiFetch(ENDPOINTS.createPost, {
        method: 'POST',
        body: JSON.stringify({ title, content, visibility }),
      })
      setTitle('')
      setContent('')
      setVisibility('')
      await loadPosts()
    } catch (err) {
      setError(err.message)
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="kitten-feed">
      <header className="feed-heading">
        <div>
          <span className="feed-kicker">A LITTLE HANGOUT FOR YOU & YOUR PALS</span>
          <h1>Kitten Feed <span aria-hidden="true">{'\u273F'}</span></h1>
          <p>Fresh updates from around the litter.</p>
        </div>
        <span className="feed-mascot" aria-hidden="true">{'\u{1F431}'}</span>
      </header>

      <form className="kitten-composer card" onSubmit={handlePost}>
        <div className="composer-heading"><span className="composer-paw" aria-hidden="true">{'\u{1F43E}'}</span><div><h2>Share a little moment</h2><p>Your friends would love to hear it!</p></div></div>
        <p className="composer-field">
          <input
            className="form-control"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </p>
        <p className="composer-field">
          <textarea
            className="form-control"
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            cols={40}
          />
        </p>
        <div className="visibility-options">
          <label className="form-check form-check-inline">
            <input
              className="form-check-input"
              type="radio"
              name="visibility"
              value="public"
              checked={visibility === 'public'}
              onChange={(e) => setVisibility(e.target.value)}
            />{' '}
            Public
          </label>
          <label className="form-check form-check-inline">
            <input
              className="form-check-input"
              type="radio"
              name="visibility"
              value="friends"
              checked={visibility === 'friends'}
              onChange={(e) => setVisibility(e.target.value)}
            />{' '}
            Friends only
          </label>
        </div>
        <button className="btn btn-primary kitten-post-button" type="submit" disabled={posting}>
          {posting ? 'Posting...' : 'Post'}
        </button>
      </form>

      {error && <p className="alert alert-danger kitten-error" role="alert">{error}</p>}
      <div className="feed-section-title"><span>{'\u{1F43E}'}</span><h2>Fresh from the litter</h2><span>{'\u{1F43E}'}</span></div>

      {loading && <p className="feed-empty">Loading posts...</p>}
      {!loading && posts.length === 0 && <p className="feed-empty">No posts yet.</p>}
      {posts.map((post) => {
        const authorId = getPostAuthorId(post)
        const friendPost = authorId != null && friendIds.has(String(authorId))
        const ownPost = authorId != null && currentUserId != null && String(authorId) === String(currentUserId)
        const authorAlreadyFollowed = authorId != null && followedIds.has(String(authorId))
        const isFollowing = authorId != null && followingIds.has(String(authorId))

        return (
          <article className="kitten-post card" key={post.id}>
            <div className="post-title-row"><span className="post-avatar" aria-hidden="true">{'\u{1F431}'}</span><h3>{post.title}</h3>
              
              <span className="post-sparkle" aria-hidden="true">{'\u2726'}</span></div>
            <p className="post-content">{post.content}</p>
            <small className="post-meta">
              <span className="post-author">{post.author}</span>
              {followedLoaded && authorId != null && !ownPost && String(authorId) !== String(currentUserId) && !authorAlreadyFollowed && <button className="follow-author-button btn" type="button" onClick={() => handleFollow(authorId)} disabled={isFollowing}>{isFollowing ? 'Following...' : 'Follow'}</button>}
              {ownPost && <span className="own-post-badge">You</span>}
              {friendPost && <span className="friend-source-badge">Friend</span>}
              {authorAlreadyFollowed && <span className="followed-author-badge">Following</span>}
              {post.created_at && <span className="post-time">{new Date(post.created_at).toLocaleString()}</span>}
            </small>
          </article>
        )
      })}
    </div>
  )
}
