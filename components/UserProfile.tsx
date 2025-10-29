import React, { useState, useMemo } from 'react';
import type { User, Product, Transaction, PurchaseRequest } from '../types';
import ProductCard from './ProductCard';
import { useAppContext } from '../contexts/AppContext';
import { StarIcon, FlagIcon } from './IconComponents';
import ReviewModal from './ReviewModal';

interface UserProfileProps {
  user: User;
}

const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  const { 
    currentUser, allProducts, transactions, users, updatePaymentMethods, 
    payFees, setAccountNSFW, reportUser, upgradeToSeller, wishlist,
    purchaseRequests, finalizeSale, setCurrentView
  } = useAppContext();
  const [activeTab, setActiveTab] = useState('listings');
  const [paypalEmail, setPaypalEmail] = useState(user.paymentMethods?.paypal || '');
  const [reviewModalState, setReviewModalState] = useState<{
    isOpen: boolean;
    transaction: Transaction | null;
    targetUser: User | null;
  }>({ isOpen: false, transaction: null, targetUser: null });
  const [expandedOffers, setExpandedOffers] = useState<Record<string, boolean>>({});

  const isOwnProfile = currentUser?.id === user.id;

  const userProducts = useMemo(() => {
    const sellersAllItems = allProducts.filter(p => p.sellerId === user.id);
    if (isOwnProfile) {
        return sellersAllItems.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    // For public view, only show available items.
    return sellersAllItems.filter(p => p.status === 'available').sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [allProducts, user.id, isOwnProfile]);
  
  const pendingOffers = useMemo(() => {
    if (user.type !== 'seller') return [];
    const userProductIds = new Set(userProducts.map(p => p.id));
    return purchaseRequests.filter(r => userProductIds.has(r.productId) && r.status === 'pending');
  }, [purchaseRequests, userProducts, user.type]);
  
  const offersByProduct = useMemo(() => {
    // FIX: Correctly type the reduce accumulator to avoid type inference issues.
    // The user has provided an explicit comment here that this needs to be fixed.
    // By casting the initial value, we ensure `acc` is correctly typed throughout the reduction,
    // which in turn correctly types `offersByProduct` and resolves downstream errors.
    return pendingOffers.reduce((acc, req) => {
        if (!acc[req.productId]) {
            acc[req.productId] = [];
        }
        acc[req.productId].push(req);
        return acc;
    }, {} as Record<string, PurchaseRequest[]>);
  }, [pendingOffers]);

  const userTransactions = useMemo(() => transactions.filter(t => t.sellerId === user.id || t.buyerId === user.id), [transactions, user.id]);
  const userReviews = useMemo(() => user.reviews, [user.reviews]);

  const wishlistedProducts = useMemo(() => {
    if (!isOwnProfile) return [];
    const productMap = new Map(allProducts.map(p => [p.id, p]));
    return wishlist.map(id => productMap.get(id)).filter(p => !!p) as Product[];
  }, [allProducts, wishlist, isOwnProfile]);

  const avgRating = useMemo(() => {
    if (!userReviews || userReviews.length === 0) return 0;
    const total = userReviews.reduce((acc, review) => acc + review.rating, 0);
    return total / userReviews.length;
  }, [userReviews]);

  const handleSettingsSave = () => {
    if (!isOwnProfile) return;
    updatePaymentMethods(user.id, { paypal: paypalEmail });
    alert('Settings saved!');
  };

  const handlePayFees = () => {
    if (!isOwnProfile) return;
    payFees(user.id);
    alert('Fees paid successfully!');
  };
  
  const handleReportUser = () => {
    if(isOwnProfile) return;
    if (confirm(`Are you sure you want to report ${user.name} for inappropriate content? Their account and listings will be hidden pending review.`)) {
      reportUser(user.id);
      alert(`${user.name} has been reported.`);
    }
  };

  const handleUpgradeAccount = () => {
    if (!isOwnProfile) return;
    if (confirm('Are you sure you want to become a seller? You will be able to list items for sale.')) {
      upgradeToSeller(user.id);
      alert('Your account has been upgraded to a seller account!');
    }
  }
  
  const handleOpenReviewModal = (transaction: Transaction, targetUser: User) => {
    setReviewModalState({ isOpen: true, transaction, targetUser });
  };

  const handleCloseReviewModal = () => {
    setReviewModalState({ isOpen: false, transaction: null, targetUser: null });
  };
  
  const toggleOfferExpansion = (productId: string) => {
    setExpandedOffers(prev => ({ ...prev, [productId]: !prev[productId] }));
  };

  const tabs = [
    { id: 'listings', label: 'Listings' },
    ...(isOwnProfile && user.type === 'seller' ? [{ id: 'offers', label: 'Offers' }] : []),
    ...(isOwnProfile ? [{ id: 'wishlist', label: 'Wishlist' }] : []),
    ...(isOwnProfile ? [{ id: 'transactions', label: 'Transaction History' }] : []),
    { id: 'reviews', label: 'Reviews' },
    ...(isOwnProfile ? [{ id: 'settings', label: 'Settings' }] : []),
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'listings':
        return userProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {userProducts.map(product => <ProductCard key={product.id} product={product} />)}
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-50 rounded-lg"><p className="text-gray-500">No items listed yet.</p></div>
        );
      case 'offers':
        if (!isOwnProfile || user.type !== 'seller') return null;
        if (Object.keys(offersByProduct).length === 0) {
            return <div className="text-center py-16 bg-gray-50 rounded-lg"><p className="text-gray-500">You have no pending offers.</p></div>
        }
        return (
          <div className="space-y-6">
            {Object.entries(offersByProduct).map(([productId, requests]) => {
              const product = userProducts.find(p => p.id === productId);
              if (!product) return null;
              
              const sortedRequests = [...requests].sort((a, b) => b.maxBid - a.maxBid || a.createdAt.getTime() - b.createdAt.getTime());

              return (
                <div key={productId} className="bg-white border rounded-lg overflow-hidden">
                  <div className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50" onClick={() => toggleOfferExpansion(productId)}>
                    <div className="flex items-center space-x-4">
                      <img src={product.imageUrl} alt={product.title} className="w-16 h-16 object-cover rounded-md" />
                      <div>
                        <p className="font-semibold text-gray-800">{product.title}</p>
                        <p className="text-sm text-gray-500">{requests.length} pending offer{requests.length > 1 ? 's' : ''}</p>
                         {product.reservePrice && <p className="text-xs text-gray-500">Reserve: ${product.reservePrice.toFixed(2)}</p>}
                      </div>
                    </div>
                     <button className="text-indigo-600 font-semibold text-sm">
                      {expandedOffers[productId] ? 'Hide Offers' : 'View Offers'}
                    </button>
                  </div>
                  {expandedOffers[productId] && (
                    <div className="border-t">
                      {sortedRequests.map((req, index) => {
                          const buyer = users.find(u => u.id === req.buyerId);
                          const buyerAvgRating = buyer?.reviews.length ? (buyer.reviews.reduce((acc, r) => acc + r.rating, 0) / buyer.reviews.length) : 0;
                          const meetsReserve = !product.reservePrice || req.maxBid >= product.reservePrice;
                          
                          let winningPrice = 0;
                          if (index === 0) {
                              const secondHighestBidder = sortedRequests[1];
                              const secondHighestMaxBid = secondHighestBidder ? secondHighestBidder.maxBid : 0;
                              winningPrice = Math.max(req.minBid, secondHighestMaxBid + 1);
                              winningPrice = Math.min(req.maxBid, winningPrice); // Can't be more than their max bid
                              if (product.reservePrice) {
                                  winningPrice = Math.max(winningPrice, product.reservePrice);
                              }
                          }

                          return (
                            <div key={req.id} className={`p-4 ${index > 0 ? 'border-t' : ''} ${index === 0 ? 'bg-green-50' : 'bg-gray-50'}`}>
                              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3">
                                    <p className="font-semibold text-gray-900 cursor-pointer hover:underline" onClick={() => setCurrentView({name: 'profile', userId: req.buyerId})}>{req.buyerName}</p>
                                    {buyer && (
                                       <div className="flex items-center text-xs">
                                          <StarIcon filled className="w-4 h-4 text-yellow-400" />
                                          <span className="ml-1 font-semibold">{buyerAvgRating.toFixed(1)}</span>
                                          <span className="ml-1 text-gray-500">({buyer.reviews.length})</span>
                                        </div>
                                    )}
                                  </div>
                                   <p className="text-sm text-gray-600 mt-1">
                                      Bid Range: <span className="font-bold text-gray-800">${req.minBid.toFixed(2)} - ${req.maxBid.toFixed(2)}</span>
                                  </p>
                                  {index === 0 && meetsReserve && (
                                      <p className="text-sm text-green-700 mt-1">
                                          Current Winning Price: <span className="font-bold">${winningPrice.toFixed(2)}</span>
                                      </p>
                                  )}
                                  {!meetsReserve && (
                                    <p className="text-sm text-red-600 mt-1 font-semibold">
                                        Does not meet reserve price of ${product.reservePrice?.toFixed(2)}
                                    </p>
                                  )}
                                  {req.comment && <p className="text-sm text-gray-800 mt-2 p-2 bg-white rounded-md border italic">"{req.comment}"</p>}
                                </div>
                                <button
                                  onClick={() => finalizeSale(req.id)}
                                  disabled={!meetsReserve}
                                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 w-full sm:w-auto disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                  Accept &amp; Sell
                                </button>
                              </div>
                            </div>
                          )
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      case 'wishlist':
        if (!isOwnProfile) return null;
        return wishlistedProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistedProducts.map(product => <ProductCard key={product.id} product={product} />)}
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-50 rounded-lg">
            <p className="text-lg font-semibold text-gray-700">Your Wishlist is Empty</p>
            <p className="text-gray-500 mt-2">Click the heart icon on any item to save it here for later!</p>
          </div>
        );
      case 'transactions':
        if (!isOwnProfile || !currentUser) return null;
        return userTransactions.length > 0 ? (
          <div className="space-y-4">
            {userTransactions.sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime()).map(t => {
                const isBuyer = t.buyerId === currentUser.id;
                const isSeller = t.sellerId === currentUser.id;
                const hasReviewed = isBuyer ? t.reviewedByBuyer : (isSeller ? t.reviewedBySeller : true);
                const otherPartyId = isBuyer ? t.sellerId : t.buyerId;
                const otherParty = users.find(u => u.id === otherPartyId);

                return (
                  <div key={t.id} className="bg-white p-4 rounded-md border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <p><strong>Item:</strong> {t.productTitle}</p>
                      <p className="text-sm text-gray-500"><strong>Date:</strong> {t.createdAt.toLocaleDateString()}</p>
                      <p className="text-sm text-gray-500"><strong>Total:</strong> ${(t.price + t.shippingCost).toFixed(2)}</p>
                      {isBuyer && <p className="text-sm text-gray-500">You bought from <span className="font-medium">{otherParty?.name}</span></p>}
                      {isSeller && <p className="text-sm text-gray-500">You sold to <span className="font-medium">{otherParty?.name}</span></p>}
                    </div>
                    <div>
                      {!hasReviewed && otherParty ? (
                        <button 
                          onClick={() => handleOpenReviewModal(t, otherParty)}
                          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                        >
                          Leave a Review
                        </button>
                      ) : (
                        <p className="text-sm text-gray-500 italic">Review submitted</p>
                      )}
                    </div>
                  </div>
                )
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-50 rounded-lg"><p className="text-gray-500">No transaction history.</p></div>
        );
      case 'reviews':
        return userReviews.length > 0 ? (
          <div className="space-y-4">
            {userReviews.map(r => (
              <div key={r.id} className="bg-white p-4 rounded-md border">
                <div className="flex items-center mb-2">
                  {[...Array(5)].map((_, i) => <StarIcon key={i} filled={i < r.rating} className="w-5 h-5 text-yellow-500" />)}
                  <span className="ml-2 font-semibold">{r.authorName}</span>
                </div>
                <p className="text-gray-600">{r.text}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-50 rounded-lg"><p className="text-gray-500">No reviews yet.</p></div>
        );
      case 'settings':
        if (!isOwnProfile || !currentUser) return null;
        return (
          <div className="bg-white p-6 rounded-lg border space-y-8">
            <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Account Information</h3>
                  <p className="mt-2 text-sm text-gray-600">Email: <span className="font-medium text-gray-800">{currentUser.email}</span></p>
                  <p className="mt-1 text-sm text-gray-600">Age: <span className="font-medium text-gray-800">{currentUser.age}</span></p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Content Preferences</h3>
                  <div className="mt-4 p-4 rounded-md bg-gray-100">
                    <div className="flex items-center">
                       <span className={`h-4 w-4 rounded-full mr-3 ${currentUser.ageVerified ? 'bg-green-500' : 'bg-red-500'}`}></span>
                       <span className="text-sm text-gray-800">
                         {currentUser.ageVerified 
                           ? "Your account is verified to view adult (NSFW) content."
                           : "Your account is restricted from viewing adult (NSFW) content."
                         }
                       </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 ml-7">This is based on the age provided by your sign-in provider and cannot be changed.</p>
                  </div>
                </div>

                {currentUser.type === 'seller' && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Seller Settings</h3>
                    <div className="mt-4">
                      <label className="flex items-center">
                        <input 
                          type="checkbox"
                          checked={currentUser.isNSFW || false}
                          onChange={(e) => setAccountNSFW(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="ml-3 block text-sm text-gray-900">
                          Mark my entire account and all listings as NSFW.
                        </span>
                      </label>
                    </div>
                  </div>
                )}
            </div>

            <div className="border-t pt-8 space-y-6">
              {currentUser.type === 'seller' ? (
                <>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Payment Methods</h3>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label htmlFor="paypal" className="block text-sm font-medium text-gray-700">PayPal Email</label>
                        <input type="email" id="paypal" value={paypalEmail} onChange={e => setPaypalEmail(e.target.value)} className="mt-1 block w-full md:w-1/2 border-gray-300 rounded-md shadow-sm"/>
                      </div>
                      <button onClick={handleSettingsSave} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Save Payment Settings</button>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Brokerage Fees</h3>
                    <p className="mt-2">You currently owe: <span className="font-bold text-indigo-600">${user.feesOwed?.toFixed(2) || '0.00'}</span></p>
                    <button onClick={handlePayFees} disabled={!user.feesOwed || user.feesOwed <= 0} className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400">Pay Fees Now</button>
                  </div>
                </>
              ) : (
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Become a Seller</h3>
                  <p className="mt-2 text-sm text-gray-600">Want to start selling your own items? Upgrade your account to get started.</p>
                  <button onClick={handleUpgradeAccount} className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Upgrade to Seller Account</button>
                </div>
              )}
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {user.isSuspended && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-8 rounded-md" role="alert">
          <p className="font-bold">Account Suspended</p>
          <p>This account is currently suspended and cannot participate in marketplace activities.</p>
        </div>
      )}
      <div className="bg-white p-8 rounded-lg shadow-md mb-8">
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-4xl font-bold text-gray-900">{user.name}</h1>
                <div className="flex items-center mt-2 space-x-4">
                  <p className="text-lg text-gray-500">
                    Account Type: <span className="font-semibold text-indigo-600 capitalize">{user.type}</span>
                  </p>
                  <div className="flex items-center">
                    <StarIcon filled className="w-5 h-5 text-yellow-400" />
                    <span className="ml-1 text-lg text-gray-600 font-semibold">{avgRating.toFixed(1)}</span>
                    <span className="ml-1 text-gray-500">({userReviews.length} reviews)</span>
                  </div>
                </div>
            </div>
            {!isOwnProfile && (
              <button 
                onClick={handleReportUser} 
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
              >
                <FlagIcon className="w-4 h-4"/>
                <span>Report User</span>
              </button>
            )}
        </div>
      </div>

      <div>
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`${activeTab === tab.id ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                  flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}>
                <span>{tab.label}</span>
                {tab.id === 'wishlist' && isOwnProfile && wishlist.length > 0 && (
                    <span className={`ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none rounded-full ${activeTab === 'wishlist' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
                        {wishlist.length}
                    </span>
                )}
                 {tab.id === 'offers' && isOwnProfile && pendingOffers.length > 0 && (
                    <span className={`ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none rounded-full ${activeTab === 'offers' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
                        {pendingOffers.length}
                    </span>
                )}
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-8">{renderContent()}</div>
      </div>
      {reviewModalState.isOpen && reviewModalState.transaction && reviewModalState.targetUser && (
        <ReviewModal
          isOpen={reviewModalState.isOpen}
          onClose={handleCloseReviewModal}
          transaction={reviewModalState.transaction}
          targetUser={reviewModalState.targetUser}
        />
      )}
    </div>
  );
};

export default UserProfile;