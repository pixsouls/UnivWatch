interface TrackedItem {
  id: string;
  name: string;
  icon: string;
  isHq: boolean; // Added to match App.tsx
}

interface TrackedItemCardProps {
  item: TrackedItem;
  isActive: boolean;    // <--- THIS WAS MISSING
  onSelect: () => void;
  onDelete: () => void; // Changed from (id: string) to match App.tsx logic
}

export const TrackedItemCard = ({ item, isActive, onSelect, onDelete }: TrackedItemCardProps) => {
  return (
    <div 
      onClick={onSelect}
      style={{ 
        display: 'flex', alignItems: 'center', padding: '10px', background: '#252525', 
        borderRadius: '8px', marginBottom: '8px', cursor: 'pointer', 
        // Use isActive to change the border color permanently when selected
        border: isActive ? '1px solid #00d4ff' : '1px solid #333',
        transition: 'all 0.2s'
      }}
      onMouseOver={(e) => { if(!isActive) e.currentTarget.style.borderColor = '#555' }}
      onMouseOut={(e) => { if(!isActive) e.currentTarget.style.borderColor = '#333' }}
    >
      <img src={item.icon} style={{ width: '32px', height: '32px', borderRadius: '4px', marginRight: '12px' }} alt="" />
      
      <div style={{ flexGrow: 1, overflow: 'hidden' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.name}
        </div>
        <div style={{ fontSize: '0.7rem', color: '#666' }}>ID: {item.id}</div>
      </div>

      <button 
        onClick={(e) => {
          e.stopPropagation();
          if (window.confirm(`Remove ${item.name} from favorites?`)) onDelete();
        }}
        style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: '18px' }}
      >×</button>
    </div>
  );
};