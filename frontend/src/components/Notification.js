import React, { useEffect, useState } from 'react';

function Notification({ message, type = 'success', onClose }) {
  const [visible, setVisible] = useState(!!message);

  useEffect(() => {
    if (message) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!visible) return null;

  return (
    <div className={`alert alert-${type} alert-dismissible fade show`} role="alert" style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000 }}>
      {message}
      <button type="button" className="btn-close" onClick={() => setVisible(false)}></button>
    </div>
  );
}

export default Notification;