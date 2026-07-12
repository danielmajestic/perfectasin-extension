interface ItemHighlightSectionProps {
  title: string;
  itemHighlight?: string | null;
  itemHighlightCharCount?: number;
}

/**
 * v3.7.5 Feature 2 — Item Highlight rendered directly under Item Name (Title),
 * mirroring Seller Central's layout. Uses Amazon's exact field names.
 */
export default function ItemHighlightSection({ title, itemHighlight, itemHighlightCharCount }: ItemHighlightSectionProps) {
  const charCount = itemHighlightCharCount ?? (itemHighlight?.length ?? 0);
  const isOverCap = charCount > 125;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 space-y-2.5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Item Name (Title)</p>
        <p className="text-sm text-gray-800 mt-0.5">{title}</p>
      </div>

      <div className="border-t border-gray-100 pt-2.5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Item Highlight</p>
          <span className={`text-[10px] font-medium ${isOverCap ? 'text-red-600' : 'text-gray-400'}`}>
            {charCount} / 125 chars{isOverCap ? ' ⚠️' : ''}
          </span>
        </div>
        {itemHighlight ? (
          <p className="text-sm text-gray-800 mt-0.5">{itemHighlight}</p>
        ) : (
          <p className="text-xs text-gray-400 italic mt-0.5">Not yet generated for this listing.</p>
        )}
      </div>
    </div>
  );
}
