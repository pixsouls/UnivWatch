import { useState, useEffect } from 'react';
import { ItemTracker } from './components/ItemTracker';
import { TrackedItemCard } from './components/TrackedItemCard';

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

  // Refined Proper Case + Roman Numeral Support
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
    
    // Step 1: Format base name to Proper Case
    let formattedName = toProperCase(formName.trim());
    
    // Step 2: Append uppercase " HQ" if checked
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
    <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#121212', color: '#e0e0e0', fontFamily: 'sans-serif', overflow: 'hidden' }}>
      
      {/* Sidebar */}
      <div style={{ width: '300px', padding: '20px', borderRight: '1px solid #333', backgroundColor: '#1a1a1a', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <h2 style={{ fontSize: '0.7rem', color: '#00d4ff', marginBottom: '15px' }}>ADD NEW ITEM</h2>
        <form onSubmit={addFavorite} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', padding: '12px', background: '#222', borderRadius: '8px' }}>
          <input placeholder="Item Name" value={formName} onChange={e => setFormName(e.target.value)} style={{ padding: '8px', background: '#111', border: '1px solid #444', color: '#fff' }} />
          <input placeholder="Item ID" value={formId} onChange={e => setFormId(e.target.value)} style={{ padding: '8px', background: '#111', border: '1px solid #444', color: '#fff' }} />
          <input placeholder="Icon URL" value={formIcon} onChange={e => setFormIcon(e.target.value)} style={{ padding: '8px', background: '#111', border: '1px solid #444', color: '#fff' }} />
          <label style={{ fontSize: '0.8rem', color: '#888', cursor: 'pointer' }}><input type="checkbox" checked={formIsHq} onChange={e => setFormIsHq(e.target.checked)} /> HQ Only</label>
          <button type="submit" style={{ padding: '10px', background: '#2e7d32', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Save</button>
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
      <div style={{ flexGrow: 1, padding: '40px', overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', alignContent: 'start' }}>
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

      {/* Settings Button - Perfect Center */}
      <button 
        onClick={() => setShowSettings(!showSettings)} 
        style={{ 
          position: 'fixed', bottom: '25px', right: '25px', width: '50px', height: '50px', borderRadius: '50%', 
          background: '#333', color: '#fff', border: '1px solid #555', cursor: 'pointer', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' 
        }}
      >
        <span style={{ display: 'block', height: '28px', lineHeight: '28px' }}>⚙</span>
      </button>

      {showSettings && (
        <div style={{ position: 'fixed', bottom: '85px', right: '25px', background: '#222', padding: '20px', borderRadius: '12px', border: '1px solid #444', zIndex: 1000, width: '200px' }}>
          <div style={{ color: '#00d4ff', fontSize: '0.8rem', marginBottom: '10px' }}>REFRESH: {intervals[intervalIndex]}m</div>
          <input type="range" min="0" max={intervals.length - 1} value={intervalIndex} onChange={e => setIntervalIndex(parseInt(e.target.value))} style={{ width: '100%' }} />
          <button onClick={() => { localStorage.clear(); window.location.reload(); }} style={{ marginTop: '15px', width: '100%', padding: '8px', background: '#c0392b', border: 'none', color: 'white', borderRadius: '4px', fontSize: '0.7rem' }}>WIPE CACHE</button>
        </div>
      )}
    </div>
  );
}