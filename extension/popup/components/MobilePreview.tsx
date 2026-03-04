interface MobilePreviewProps {
  title: string;
  price?: string;
  imageUrl?: string;
  rating?: number | null;
  reviewCount?: string | null;
}

export default function MobilePreview({ title, price, imageUrl, rating, reviewCount }: MobilePreviewProps) {
  const MOBILE_TITLE_LIMIT = 80;
  const truncatedTitle = title.length > MOBILE_TITLE_LIMIT
    ? title.substring(0, MOBILE_TITLE_LIMIT) + '...'
    : title;
  const isTruncated = title.length > MOBILE_TITLE_LIMIT;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Mobile Preview</h3>
        <span className="text-xs text-gray-500">Amazon App</span>
      </div>

      {/* Search Result Layout */}
      <div className="bg-white border border-gray-200 rounded-lg p-3">
        <div className="flex gap-3">
          {/* Product Image - Left Side */}
          <div className="flex-shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Product"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    // Hide image and show placeholder if load fails
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      parent.innerHTML = `
                        <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      `;
                    }
                  }}
                />
              ) : (
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              )}
            </div>
          </div>

          {/* Title and Price - Right Side */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <p className="text-xs leading-relaxed text-gray-900 mb-1.5">
              {truncatedTitle}
            </p>

            {/* Price */}
            {price && (
              <div className="mb-1.5">
                <span className="text-red-600 font-semibold text-sm">{price}</span>
              </div>
            )}

            {/* Star rating */}
            {rating !== null && rating !== undefined ? (
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${
                      star <= Math.round(rating) ? 'text-amber-400' : 'text-gray-300'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <span className="text-xs text-gray-600 ml-1">
                  {rating.toFixed(1)} {reviewCount && <span className="text-[#007185]">({reviewCount})</span>}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">No ratings yet</span>
              </div>
            )}
          </div>
        </div>

        {/* Truncation warning */}
        {isTruncated && (
          <div className="mt-3 flex items-start gap-1.5 text-xs text-amber-600 bg-amber-50 p-2 rounded">
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>Title truncates at {MOBILE_TITLE_LIMIT} characters on mobile</span>
          </div>
        )}
      </div>

      {!title && (
        <p className="text-xs text-gray-500 text-center mt-3">
          Preview will update when a title is detected
        </p>
      )}
    </div>
  );
}
