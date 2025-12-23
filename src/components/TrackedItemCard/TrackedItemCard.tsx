import './TrackedItemCard.css';

interface TrackedItem {
  id: string;
  name: string;
  icon: string;
  isHq: boolean;
}

interface TrackedItemCardProps {
  item: TrackedItem;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export const TrackedItemCard = ({ item, isActive, onSelect, onDelete }: TrackedItemCardProps) => {
  return (
    <div
      onClick={onSelect}
      className={`favorite-card ${isActive ? 'active' : ''}`}
    >
      <img src={item.icon} className="card-icon" alt="" />

      <div className="card-content">
        <div className="card-title">
          {item.name}
        </div>
        <div className="card-id">ID: {item.id}</div>
      </div>

      <button
        className="delete-fav-btn"
        onClick={(e) => {
          e.stopPropagation();
          if (window.confirm(`Remove ${item.name} from favorites?`)) onDelete();
        }}
      >
        ×
      </button>
    </div>
  );
};