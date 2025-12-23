import { useState, useEffect } from 'react';
import { ItemTracker } from './components/ItemTracker/ItemTracker';
import { TrackedItemCard } from './components/TrackedItemCard/TrackedItemCard';
import './App.css'; // Make sure this is imported!

interface TrackedItem {
  id: string;
  name: string;
  icon: string;
  isHq: boolean;
  isActive?: boolean;
}

export default function App() {
  const [favorites, setFavorites] = useState<TrackedItem[]>(() => {
    const saved = localStorage.getItem('ffxiv-watchlist-final');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeTrackers, setActiveTrackers] = useState<TrackedItem[]>(() => {
    const saved = localStorage.getItem('ffxiv-active-grid-final');
    return saved ? JSON.parse(saved) : [];
  });

  const intervals = [1, 1.5, 2, 2.5, 3, 4, 5, 10, 20, 30, 60];
  const [intervalIndex, setIntervalIndex] = useState(() => {
    const saved = localStorage.getItem('ffxiv-refresh-idx');
    return saved ? parseInt(saved) : 2;
  });

  const [showSettings, setShowSettings] = useState(false);
  const [formName, setFormName] = useState("");
  const [formId, setFormId] = useState("");
  const [formIcon, setFormIcon] = useState("");
  const [formIsHq, setFormIsHq] = useState(false);

  useEffect(() => {
    localStorage.setItem('ffxiv-watchlist-final', JSON.stringify(favorites));
    localStorage.setItem('ffxiv-active-grid-final', JSON.stringify(activeTrackers));
    localStorage.setItem('ffxiv-refresh-idx', intervalIndex.toString());
  }, [favorites, activeTrackers, intervalIndex]);

  const toProperCase = (str: string) => {
    return str.toLowerCase().split(' ').map(word => {
      const romanRegex = /^(i|v|x|l|c|d|m)+(?![a-z])$/i;
      if (romanRegex.test(word)) return word.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
  };

  const addFavorite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formId) return;
    
    let formattedName = toProperCase(formName.trim());
    if (formIsHq && !formattedName.toUpperCase().endsWith(" HQ")) {
      formattedName += " HQ";
    }

    const newItem: TrackedItem = { 
      id: formId.trim(), 
      name: formattedName, 
      icon: formIcon.trim() || "https://xivapi.com/i/020000/020001.png", 
      isHq: formIsHq 
    };
    
    setFavorites(prev => [newItem, ...prev]);
    setFormName(""); setFormId(""); setFormIcon(""); setFormIsHq(false);
  };

  const toggleTracker = (item: TrackedItem) => {
    const isAlreadyActive = activeTrackers.find(t => t.id === item.id && t.isHq === item.isHq);
    if (isAlreadyActive) {
      setActiveTrackers(prev => prev.filter(t => !(t.id === item.id && t.isHq === item.isHq)));
    } else {
      setActiveTrackers(prev => [...prev, item]);
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <h2 className="sidebar-title">ADD NEW ITEM</h2>
        <form onSubmit={addFavorite} className="add-item-form">
          <input placeholder="Item Name" value={formName} onChange={e => setFormName(e.target.value)} />
          <input placeholder="Item ID" value={formId} onChange={e => setFormId(e.target.value)} />
          <input placeholder="Icon URL" value={formIcon} onChange={e => setFormIcon(e.target.value)} />
          <label className="hq-label">
            <input type="checkbox" checked={formIsHq} onChange={e => setFormIsHq(e.target.checked)} /> 
            HQ Only
          </label>
          <button type="submit" className="save-button">Save</button>
        </form>

        <div style={{ flexGrow: 1, overflowY: 'auto' }}>
          {favorites.map((fav, i) => (
            <TrackedItemCard 
              key={`${fav.id}-${fav.isHq}-${i}`} 
              item={fav} 
              isActive={!!activeTrackers.find(t => t.id === fav.id && t.isHq === fav.isHq)}
              onSelect={() => toggleTracker(fav)}
              onDelete={() => setFavorites(prev => prev.filter(f => f !== fav))}
            />
          ))}
        </div>
      </div>

      {/* Grid Area */}
      <div className="main-grid">
        {activeTrackers.map((item) => (
          <ItemTracker 
            key={`${item.id}-${item.isHq}`}
            itemId={item.id} isHq={item.isHq} region="Aether" 
            initialName={item.name} iconUrl={item.icon}
            globalRefresh={intervals[intervalIndex] * 60}
            onClose={() => setActiveTrackers(prev => prev.filter(t => t !== item))}
          />
        ))}
      </div>

      {/* Settings UI */}
      <button className="settings-toggle-btn" onClick={() => setShowSettings(!showSettings)}>
        <span>⚙</span>
      </button>

      {showSettings && (
        <div className="settings-panel">
          <div style={{ color: '#00d4ff', fontSize: '0.8rem', marginBottom: '10px' }}>
            REFRESH: {intervals[intervalIndex]}m
          </div>
          <input 
            type="range" 
            min="0" max={intervals.length - 1} 
            value={intervalIndex} 
            onChange={e => setIntervalIndex(parseInt(e.target.value))} 
            style={{ width: '100%' }} 
          />
          <button className="wipe-button" onClick={() => { localStorage.clear(); window.location.reload(); }}>
            WIPE CACHE
          </button>
        </div>
      )}
    </div>
  );
}