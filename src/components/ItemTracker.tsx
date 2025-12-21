import { useState, useEffect, useCallback } from 'react';
import { useUniversalisQueue } from '../hooks/useUniversalisQueue.ts';

interface Props { 
  itemId: string; 
  isHq: boolean; 
  region: string; 
  initialName: string; 
  iconUrl: string; 
  globalRefresh: number; 
  onClose: () => void; 
}

export const ItemTracker = ({ itemId, isHq, region, initialName, iconUrl, globalRefresh, onClose }: Props) => {
  const [data, setData] = useState<{market: any, history: any} | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(globalRefresh);
  const [isPaused, setIsPaused] = useState(false);
  
  const { fetchQueued } = useUniversalisQueue();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const cleanId = itemId.replace(/\D/g, '');
      const hq = isHq ? '&hq=1' : '&hq=0';

      const mData = await fetchQueued(`https://universalis.app/api/v2/${region}/${cleanId}?listings=8${hq}`);
      const hData = await fetchQueued(`https://universalis.app/api/v2/history/${region}/${cleanId}?entriesToReturn=25${hq}`);

      setData({ market: mData, history: hData });
      setLoading(false);
      setTimeLeft(globalRefresh);
    } catch (e) { 
      console.error("Queue error:", e); 
      setLoading(false); 
    }
  }, [itemId, region, globalRefresh, isHq, fetchQueued]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const tick = setInterval(() => {
      if (!isPaused) {
        setTimeLeft(t => {
          if (t <= 1) { fetchData(); return globalRefresh; }
          return t - 1;
        });
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [isPaused, fetchData, globalRefresh]);

  const stats = (() => {
    if (!data?.market?.listings || !data?.history?.entries) return null;
    const h = data.history.entries as any[];
    const m = data.market.listings as any[];
    
    const avgRecent = h.length > 0 
      ? Math.round(h.slice(0, 5).reduce((a, b) => a + b.pricePerUnit, 0) / Math.min(h.length, 5)) 
      : 0;
      
    const sorted = [...h].sort((a, b) => a.pricePerUnit - b.pricePerUnit);
    const avgLowest = h.length > 0 
      ? Math.round(sorted.slice(0, 5).reduce((a, b) => a + b.pricePerUnit, 0) / Math.min(h.length, 5)) 
      : 0;
      
    return { current: m[0], lastSale: h[0], avgRecent, avgLowest };
  })();

  const hqSub = isHq ? " HQ" : "";

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <button onClick={onClose} style={{ position: 'absolute', top: '-10px', right: '-10px', width: '34px', height: '22px', borderRadius: '11px', background: '#ff4d4d', color: '#fff', border: 'none', cursor: 'pointer', zIndex: 10, fontWeight: 'bold', fontSize: '12px' }}>✕</button>
      <div style={{ background: '#242424', padding: '16px', borderRadius: '12px', border: '1px solid #333', boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <img src={iconUrl} style={{ width: '32px', height: '32px', borderRadius: '4px' }} alt="" />
          <div style={{ flexGrow: 1, overflow: 'hidden' }}>
            <h3 style={{ margin: 0, fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: isHq ? '#f1c40f' : '#fff' }}>{initialName}</h3>
            <div style={{ fontSize: '0.6rem', color: '#666' }}>ID: {itemId} {isHq && '• High Quality'}</div>
          </div>
          <div onClick={() => setIsPaused(!isPaused)} style={{ fontSize: '0.65rem', color: isPaused ? '#f39c12' : '#00d4ff', background: '#111', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer' }}>{isPaused ? 'PAUSED' : `${Math.floor(timeLeft/60)}:${(timeLeft%60).toString().padStart(2,'0')}`}</div>
        </div>
        
        {loading && !data ? <div style={{color:'#444', fontSize:'0.7rem'}}>In Queue...</div> : stats ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ background: '#1a1a1a', padding: '10px', borderRadius: '0px', borderLeft: '4px solid #a29bfe' }}>
              <div style={{ fontSize: '0.55rem', color: '#888', fontWeight: 'bold' }}>DC LOWEST ACTIVE{hqSub}</div>
              {stats.current ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '2px' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fff' }}>{stats.current.pricePerUnit.toLocaleString()}g</div>
                  <div style={{ fontSize: '0.75rem', color: '#a29bfe', fontWeight: 'bold' }}>{stats.current.worldName?.toUpperCase()}</div>
                </div>
              ) : <div style={{fontSize:'0.8rem', color:'#444'}}>No Listings</div>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <div style={rowStyle('#00d4ff')}><span style={labelStyle}>Last{hqSub} Sold</span><span style={valStyle}>{stats.lastSale?.pricePerUnit.toLocaleString()}g</span></div>
              <div style={rowStyle('#f1c40f')}><span style={labelStyle}>Recent{hqSub} Avg</span><span style={valStyle}>{stats.avgRecent.toLocaleString()}g</span></div>
              <div style={rowStyle('#2e7d32')}><span style={labelStyle}>Avg Lowest{hqSub}</span><span style={valStyle}>{stats.avgLowest.toLocaleString()}g</span></div>
            </div>
          </div>
        ) : <div style={{fontSize:'0.7rem', color:'#666', textAlign:'center', padding:'10px'}}>Data Unavailable</div>}
      </div>
    </div>
  );
};

const rowStyle = (c: string) => ({ background: '#1d1d1d', padding: '6px 10px', borderLeft: `3px solid ${c}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as const);
const labelStyle = { fontSize: '0.55rem', color: '#555', textTransform: 'uppercase' as const };
const valStyle = { fontSize: '0.8rem', fontWeight: 'bold', color: '#bbb' };