import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
  const { userData, isAdmin, signOut } = useAuth();

  return (
    <div className="app-shell">
      <nav className="top-nav">
        <span className="brand">Ecozap</span>

        <NavLink to="/parts">Parts</NavLink>
        {isAdmin && <NavLink to="/export">Export</NavLink>}
        <NavLink to="/history">History</NavLink>
        {isAdmin && <NavLink to="/admin/viewers">Viewers</NavLink>}

        <span className="nav-spacer" />
        <span className="nav-user">{userData?.alias}</span>
        <button onClick={signOut}>Sign out</button>
      </nav>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
