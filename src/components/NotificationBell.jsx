import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { notificationService } from '../services/api';

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const boxRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const response = await notificationService.getNotifications({ per_page: 8 });
      if (response.success) {
        setItems(response.data.notifications || []);
        setUnread(response.data.statistics?.unread || 0);
      }
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 60000);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    const onClick = (event) => {
      if (boxRef.current && !boxRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const markAll = async () => {
    try {
      await notificationService.markAllAsRead();
      await load();
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        onClick={() => {
          setOpen((value) => !value);
          if (!open) load();
        }}
        className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-brand-green-light transition-colors relative"
        aria-label="Notifications"
      >
        <Bell size={20} className="text-gray-700" />
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 bg-brand-orange text-white text-[10px] rounded-full min-w-[1.1rem] h-[1.1rem] px-0.5 flex items-center justify-center font-bold">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <p className="text-sm font-bold text-gray-900">Notifications</p>
            {unread > 0 && (
              <button type="button" onClick={markAll} className="text-xs font-semibold text-brand-green">
                Tout lire
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-6 text-sm text-gray-500">Aucune notification pour le moment.</p>
            ) : (
              items.map((item) => (
                <div key={item.id} className={`px-4 py-3 border-b border-gray-50 ${item.is_read ? '' : 'bg-brand-green-light/40'}`}>
                  <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{item.message}</p>
                </div>
              ))
            )}
          </div>
          <Link
            to="/profile"
            onClick={() => setOpen(false)}
            className="block text-center text-xs font-bold text-brand-green px-4 py-3 hover:bg-brand-cream"
          >
            Voir mon espace
          </Link>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
