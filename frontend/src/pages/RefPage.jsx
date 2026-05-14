import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function RefPage() {
  const { code } = useParams();
  const navigate  = useNavigate();

  useEffect(() => {
    if (code) {
      localStorage.setItem('streammindai_ref', code.toUpperCase());
    }
    navigate('/login', { replace: true });
  }, []);

  return (
    <div style={{
      background: '#0d0d0d', minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <p style={{ color: '#6b6b6b', fontSize: '14px' }}>Reindirizzamento in corso...</p>
    </div>
  );
}
