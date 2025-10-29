import React, { useState } from 'react';
import { Product } from '../types';
import { useAppContext } from '../contexts/AppContext';
import { FlagIcon, StarIcon, HeartIcon } from './IconComponents';
import PurchaseRequestModal from './PurchaseRequestModal';

interface ProductDetailViewProps {
  product: Product;
}

const ProductDetailView: React.FC<ProductDetailViewProps> = ({ product }) => {
  const { 
    users, 
    currentUser, 
    reportItem, 
    setCurrentView, 
    isEffectivelyNSFW, 
    getWishlistCountForItem, 
    purchaseRequests,
    wishlist,
    addToWishlist,
    removeFromWishlist
  } = useAppContext();
  const seller = users.find(u => u.id === product.sellerId);
  const [isRequestModalOpen, setRequestModalOpen] = useState(false);

  if (!seller) {
    return <div className="text-center py-10">Seller not found.</div>;
  }
  
  const isInWishlist = currentUser ? wishlist.includes(product.id) : false;

  const handleWishlistToggle = () => {
    if (!currentUser) {
      alert('Please log in to use the wishlist feature.');
      return;
    }
    if (isInWishlist) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product.id);
    }
  };

  const isOwnProduct = currentUser?.id === seller.id;
  const sellerIsSuspended = seller.isSuspended;
  const existingRequest = purchaseRequests.find(r => r.productId === product.id && r.buyerId === currentUser?.id && r.status === 'pending');
  const canRequestPurchase = currentUser && !isOwnProduct && product.status === 'available' && !sellerIsSuspended && !existingRequest;
  
  const isNSFW = isEffectivelyNSFW(product);
  const wishlistCount = getWishlistCountForItem(product.id);
  
  const handleReportItem = () => {
    if (confirm('Are you sure you want to report this item for inappropriate content? It will be hidden pending review.')) {
      reportItem(product.id);
      alert('Item has been reported.');
      setCurrentView({ name: 'browse' });
    }
  };

  const avgRating = React.useMemo(() => {
    if (!seller.reviews || seller.reviews.length === 0) return 0;
    const total = seller.reviews.reduce((acc, review) => acc + review.rating, 0);
    return total / seller.reviews.length;
  }, [seller.reviews]);

  const getButtonState = () => {
      if (product.status === 'sold') return { text: 'Sold Out', disabled: true };
      if (product.status === 'expired') return { text: 'Listing Expired', disabled: true };
      if (sellerIsSuspended) return { text: 'Seller Suspended', disabled: true };
      if (isOwnProduct) return { text: 'This is Your Listing', disabled: true };
      if (existingRequest) return { text: 'Request Sent', disabled: true };
      if (currentUser) return { text: 'Request to Purchase', disabled: false };
      return { text: 'Login to Purchase', disabled: true };
  }
  const buttonState = getButtonState();


  return (
    <>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="md:flex">
            <div className="md:flex-shrink-0 md:w-1/2 relative">
               {currentUser && (
                <button
                    onClick={handleWishlistToggle}
                    aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                    className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/70 text-gray-700 hover:text-red-500 hover:bg-white transition-all"
                >
                    <HeartIcon className="w-8 h-8" filled={isInWishlist} />
                </button>
               )}
               {isNSFW && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full z-10">
                    NSFW
                  </div>
                )}
              <img className="h-96 w-full object-cover" src={product.imageUrl} alt={product.title} />
            </div>
            <div className="p-8 md:w-1/2 flex flex-col justify-between">
              <div>
                <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">{product.condition}</div>
                <h1 className="block mt-1 text-4xl leading-tight font-bold text-black">{product.title}</h1>
                <p className="mt-4 text-gray-600 text-lg">{product.description}</p>
                
                {wishlistCount > 0 && (
                  <div className="mt-4 flex items-center text-gray-600">
                    <HeartIcon className="w-5 h-5 text-red-500" filled={true} />
                    <span className="ml-2 text-sm font-medium">
                      In {wishlistCount} wishlist{wishlistCount > 1 ? 's' : ''}
                    </span>
                  </div>
                )}

                <div className="mt-6">
                  <div className="flex items-center">
                      <p className="text-3xl font-bold text-gray-900">${product.price.toFixed(2)}</p>
                      <p className="text-lg text-gray-500 ml-4">+ ${product.shippingCost.toFixed(2)} shipping</p>
                  </div>
                   {product.status === 'available' && (
                    <p className="mt-2 text-sm text-gray-500">
                        Listing expires on: {new Date(product.expiresAt).toLocaleDateString()}
                    </p>
                   )}
                </div>

                {sellerIsSuspended && (
                  <div className="mt-6 bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-md relative" role="alert">
                    <strong className="font-bold">Unavailable:</strong>
                    <span className="block sm:inline ml-2">The seller's account is suspended. This item cannot be purchased.</span>
                  </div>
                )}
                
                <div className="mt-6 border-t pt-6">
                  <h3 className="text-md font-semibold text-gray-800">Sold by</h3>
                  <div className="flex items-center mt-2">
                      <div className="text-lg text-indigo-600 hover:text-indigo-800 cursor-pointer" onClick={() => setCurrentView({ name: 'profile', userId: seller.id })}>
                          {seller.name}
                      </div>
                       <div className="flex items-center ml-4">
                          <StarIcon filled className="w-5 h-5 text-yellow-400" />
                          <span className="ml-1 text-md text-gray-600 font-semibold">{avgRating.toFixed(1)}</span>
                          <span className="ml-1 text-gray-500">({seller.reviews.length})</span>
                      </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                  {product.documentedDamage && product.documentedDamage.length > 0 && (
                      <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                          <div className="flex">
                              <div className="flex-shrink-0">
                                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                              </div>
                              <div className="ml-3">
                                  <h3 className="text-sm font-bold text-yellow-800">Known Imperfections</h3>
                                  <div className="mt-2 text-sm text-yellow-700 space-y-4">
                                      {product.documentedDamage.map((damage, index) => (
                                          <div key={index} className="flex items-start space-x-4">
                                              <div className="flex space-x-2 flex-shrink-0">
                                                  {damage.imageUrls.map((url, imgIndex) => (
                                                      <img 
                                                          key={imgIndex} 
                                                          src={url} 
                                                          alt={`Damage detail ${imgIndex + 1}`} 
                                                          className="w-20 h-20 object-cover rounded-md border" 
                                                      />
                                                  ))}
                                              </div>
                                              <p className="flex-1 pt-1">{damage.description}</p>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          </div>
                      </div>
                  )}
                  { product.documentedDamage && product.documentedDamage.length > 0 &&
                    <p className="text-xs text-center text-gray-500 mb-2">
                        By purchasing, you acknowledge and accept the documented imperfections listed above.
                    </p>
                  }
                  <div className="space-y-4">
                      <button 
                          onClick={() => { if(canRequestPurchase) setRequestModalOpen(true); }}
                          disabled={buttonState.disabled}
                          className="w-full py-4 px-6 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                         {buttonState.text}
                      </button>
                      {!isOwnProduct && (
                          <button 
                              onClick={handleReportItem}
                              className="w-full flex justify-center items-center space-x-2 py-3 px-6 border border-gray-300 text-gray-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                          >
                              <FlagIcon className="w-5 h-5"/>
                              <span>Report this Item</span>
                          </button>
                      )}
                  </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      { isRequestModalOpen &&
        <PurchaseRequestModal 
            isOpen={isRequestModalOpen}
            onClose={() => setRequestModalOpen(false)}
            product={product}
        />
      }
    </>
  );
};

export default ProductDetailView;