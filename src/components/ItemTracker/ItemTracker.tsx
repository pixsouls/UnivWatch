import { useState, useEffect, useCallback } from 'react';
import { useUniversalisQueue } from '../../hooks/useUniversalisQueue';
import './ItemTracker.css'; // Import the new styles

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
  const [data, setData] = useState<{ market: any, history: any } | null>(null);
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
    <div className="tracker-wrapper">
      <button onClick={onClose} className="close-tracker-btn">✕</button>

      <div className="tracker-card">
        <div className="tracker-header">
          <img src={iconUrl} className="item-icon" alt="" />
          <div className="item-info">
            <h3 className="item-name" style={{ color: isHq ? '#f1c40f' : '#fff' }}>{initialName}</h3>
            <div className="item-meta">ID: {itemId} {isHq && '• High Quality'}</div>
          </div>
          <div
            onClick={() => setIsPaused(!isPaused)}
            className={`timer-badge ${isPaused ? 'timer-paused' : 'timer-active'}`}
          >
            {isPaused ? 'PAUSED' : `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`}
          </div>
        </div>

        {loading && !data ? (
          <div className="status-msg" style={{ color: '#444' }}>In Queue...</div>
        ) : stats ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="price-highlight-box">
              <div className="highlight-label">DC LOWEST ACTIVE{hqSub}</div>
              {stats.current ? (
                <div className="highlight-main">
                  <div className="current-price">{stats.current.pricePerUnit.toLocaleString()}g</div>
                  <div className="world-name">{stats.current.worldName?.toUpperCase()}</div>
                </div>
              ) : <div style={{ fontSize: '0.8rem', color: '#444' }}>No Listings</div>}
            </div>

            <div className="stats-container">
              <div className="stat-row row-blue">
                <span className="stat-label">Last{hqSub} Sold</span>
                <span className="stat-value">{stats.lastSale?.pricePerUnit.toLocaleString()}g</span>
              </div>
              <div className="stat-row row-yellow">
                <span className="stat-label">Recent{hqSub} Avg</span>
                <span className="stat-value">{stats.avgRecent.toLocaleString()}g</span>
              </div>
              <div className="stat-row row-green">
                <span className="stat-label">Avg Lowest{hqSub}</span>
                <span className="stat-value">{stats.avgLowest.toLocaleString()}g</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="status-msg" style={{ color: '#666' }}>Data Unavailable</div>
        )}
      </div>
    </div>
  );
};