import React, { createContext, useContext, useState, useMemo, ReactNode, useEffect } from 'react';
import type { User, Product, Transaction, Review, PurchaseRequest } from '../types';
import { getSearchFiltersFromQuery, AISearchResult } from '../services/geminiService';


// Mock Data
const initialUsers: User[] = [
  {
    id: 'user-seller-1',
    name: 'Jane Doe',
    email: 'jane.d@example.com',
    age: 25,
    type: 'seller',
    reviews: [
      { id: 'review-1', authorId: 'user-buyer-1', authorName: 'John Smith', targetId: 'user-seller-1', rating: 5, text: 'Great seller, fast shipping!', transactionId: 'txn-1', createdAt: new Date() }
    ],
    paymentMethods: { paypal: 'jane.d@example.com' },
    feesOwed: 12.50,
    ageVerified: true,
    isNSFW: false,
  },
  {
    id: 'user-seller-2',
    name: 'NSFW Seller',
    email: 'nsfw.seller@example.com',
    age: 28,
    type: 'seller',
    reviews: [],
    ageVerified: true,
    isNSFW: true, // This whole account is NSFW
    reportedNSFW: false,
    feesOwed: 5.00,
  },
  {
    id: 'user-buyer-1',
    name: 'John Smith',
    email: 'john.s@example.com',
    age: 16,
    type: 'buyer',
    reviews: [],
    ageVerified: false, // Not age verified
  },
  {
    id: 'user-buyer-2',
    name: 'Alice Wonder',
    email: 'alice.w@example.com',
    age: 35,
    type: 'buyer',
    reviews: [
        { id: 'review-2', authorId: 'user-seller-1', authorName: 'Jane Doe', targetId: 'user-buyer-2', rating: 4, text: 'Polite buyer, quick communication.', transactionId: 'some-past-txn', createdAt: new Date() }
    ],
    ageVerified: true,
  },
];

const initialProducts: Product[] = [
  { id: 'prod-1', title: 'Vintage Denim Jacket', description: 'A classic denim jacket from the 9s.', price: 75, imageUrl: 'https://picsum.photos/seed/jacket/400/400', category: 'Outerwear', condition: 'Good', sellerId: 'user-seller-1', sellerName: 'Jane Doe', shippingCost: 10, status: 'available', isNSFW: false, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 88) },
  { id: 'prod-2', title: 'Silk Scarf', description: 'A beautiful 100% silk scarf.', price: 25, imageUrl: 'https://picsum.photos/seed/scarf/400/400', category: 'Accessories', condition: 'Like new', sellerId: 'user-seller-1', sellerName: 'Jane Doe', shippingCost: 5, status: 'sold', isNSFW: false, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 85) },
  { id: 'prod-3', title: 'Leather Boots', description: 'Handmade leather boots, barely worn.', price: 150, reservePrice: 160, imageUrl: 'https://picsum.photos/seed/boots/400/400', category: 'Shoes', condition: 'Like new', sellerId: 'user-seller-1', sellerName: 'Jane Doe', shippingCost: 15, status: 'available', isNSFW: false, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1), expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 89) },
  { id: 'prod-4', title: 'Gothic Corset', description: 'A very specific style for mature audiences.', price: 90, imageUrl: 'https://picsum.photos/seed/corset/400/400', category: 'NSFW', condition: 'New with tags', sellerId: 'user-seller-2', sellerName: 'NSFW Seller', shippingCost: 8, status: 'available', isNSFW: true, reportedNSFW: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 87) },
  { id: 'prod-5', title: 'Chain Necklace', description: 'Goes with the corset.', price: 40, imageUrl: 'https://picsum.photos/seed/chain/400/400', category: 'Accessories', condition: 'Good', sellerId: 'user-seller-2', sellerName: 'NSFW Seller', shippingCost: 5, status: 'available', isNSFW: false, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12), expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5) }, // Expiring soon
];

const initialTransactions: Transaction[] = [
    { id: 'txn-1', productId: 'prod-2', productTitle: 'Silk Scarf', buyerId: 'user-buyer-1', sellerId: 'user-seller-1', price: 25, shippingCost: 5, fee: 2.5, createdAt: new Date(), reviewedByBuyer: true, reviewedBySeller: false },
];

const initialPurchaseRequests: PurchaseRequest[] = [
  { id: 'req-1', productId: 'prod-3', productTitle: 'Leather Boots', buyerId: 'user-buyer-1', buyerName: 'John Smith', minBid: 140, maxBid: 150, comment: 'I love these boots! Hope you consider my offer.', createdAt: new Date(Date.now() - 1000 * 60 * 30), status: 'pending' },
  { id: 'req-2', productId: 'prod-3', productTitle: 'Leather Boots', buyerId: 'user-buyer-2', buyerName: 'Alice Wonder', minBid: 155, maxBid: 165, comment: 'Willing to pay a bit extra, I need these for an event next week!', createdAt: new Date(Date.now() - 1000 * 60 * 15), status: 'pending' },
  { id: 'req-3', productId: 'prod-1', productTitle: 'Vintage Denim Jacket', buyerId: 'user-buyer-2', buyerName: 'Alice Wonder', minBid: 60, maxBid: 75, comment: '', createdAt: new Date(Date.now() - 1000 * 60 * 60), status: 'pending' },
];


// Mock wishlist data for non-logged-in users to provide social proof.
const MOCK_OTHER_USER_WISHLISTS: { [userId: string]: string[] } = {
  'user-seller-1': ['prod-4', 'prod-3'],
  'user-buyer-1': ['prod-1'],
  'some-other-user-id': ['prod-1', 'prod-5']
};


export type View =
  | { name: 'browse' }
  | { name: 'sell' }
  | { name: 'profile'; userId: string }
  | { name: 'productDetail'; productId: string }
  | { name: 'admin' };

interface AppContextType {
  currentUser: User | null;
  users: User[];
  products: Product[]; // Filtered products
  allProducts: Product[]; // Unfiltered for admin
  transactions: Transaction[];
  purchaseRequests: PurchaseRequest[];
  currentView: View;
  isSearching: boolean;
  searchSummary: string | null;
  searchedProductIds: string[] | null;
  performSearch: (query: string) => void;
  clearSearch: () => void;
  login: (userId: string) => void;
  loginWithProvider: (email: string) => void;
  logout: () => void;
  setCurrentView: (view: View) => void;
  addItem: (item: Omit<Product, 'id' | 'sellerId' | 'sellerName' | 'status' | 'createdAt'>, isFlaggedByAI?: boolean) => void;
  addPurchaseRequest: (productId: string, minBid: number, maxBid: number, comment: string) => void;
  finalizeSale: (purchaseRequestId: string) => void;
  addReview: (transactionId: string, targetUserId: string, rating: number, text: string) => void;
  reportItem: (productId: string) => void;
  reportUser: (userId: string) => void;
  suspendUser: (userId: string) => void;
  reinstateUser: (userId: string) => void;
  reviewReportedItem: (productId: string, action: 'dismiss' | 'confirm') => void;
  reviewReportedUser: (userId: string, action: 'dismiss' | 'confirm') => void;
  updatePaymentMethods: (userId: string, methods: { paypal: string }) => void;
  payFees: (userId: string) => void;
  setAccountNSFW: (isNSFW: boolean) => void;
  upgradeToSeller: (userId: string) => void;
  isEffectivelyNSFW: (item: Product) => boolean;
  wishlist: string[];
  addToWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
  getWishlistCountForItem: (productId: string) => number;
  searchHistory: string[];
  clearSearchHistory: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [allProducts, setAllProducts] = useState<Product[]>(initialProducts);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>(initialPurchaseRequests);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>({ name: 'browse' });
  
  // State for AI Search
  const [isSearching, setIsSearching] = useState(false);
  const [searchSummary, setSearchSummary] = useState<string | null>(null);
  const [searchedProductIds, setSearchedProductIds] = useState<string[] | null>(null);

  // State for Wishlist
  const [wishlist, setWishlist] = useState<string[]>([]);
  
  // State for Search History
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  
  // Effect to periodically check for and update expired products
  useEffect(() => {
    const interval = setInterval(() => {
        const now = new Date();
        setAllProducts(prevProducts => {
            let hasChanges = false;
            const updated = prevProducts.map(p => {
                if (p.status === 'available' && new Date(p.expiresAt) < now) {
                    hasChanges = true;
                    return { ...p, status: 'expired' };
                }
                return p;
            });
            return hasChanges ? updated : prevProducts;
        });
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  // Load/clear wishlist from localStorage when user changes
  useEffect(() => {
    if (currentUser) {
      try {
        const storedWishlist = localStorage.getItem(`wishlist_${currentUser.id}`);
        if (storedWishlist) {
          setWishlist(JSON.parse(storedWishlist));
        } else {
          setWishlist([]);
        }
      } catch (error) {
        console.error("Failed to parse wishlist from localStorage", error);
        setWishlist([]);
      }
    } else {
      setWishlist([]); // Clear wishlist on logout
    }
  }, [currentUser]);

  // Load/clear search history from localStorage when user changes
  useEffect(() => {
    if (currentUser) {
        try {
            const storedHistory = localStorage.getItem(`search_history_${currentUser.id}`);
            if (storedHistory) {
                setSearchHistory(JSON.parse(storedHistory));
            } else {
                setSearchHistory([]);
            }
        } catch (error) {
            console.error("Failed to parse search history from localStorage", error);
            setSearchHistory([]);
        }
    } else {
        setSearchHistory([]); // Clear history on logout
    }
  }, [currentUser]);


  const login = (userId: string) => {
    const user = users.find(u => u.id === userId);
    setCurrentUser(user || null);
    setCurrentView({ name: 'browse' });
  };
  
  const loginWithProvider = (email: string) => {
    let user = users.find(u => u.email === email);

    if (!user) {
        // Create a new user if one doesn't exist
        const newUser: User = {
            id: `user-${Date.now()}`,
            email: email,
            name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            age: 30, // Default age
            type: 'buyer', // Default to buyer
            reviews: [],
            ageVerified: 30 >= 18,
            isSuspended: false,
            feesOwed: 0,
        };

        if (email === 'dbrabon@gmail.com') {
            newUser.isAdmin = true;
            newUser.type = 'admin';
        }
        
        setUsers(prev => [...prev, newUser]);
        setCurrentUser(newUser);
    } else {
        // If user exists, check if they should be admin and update their record if needed.
        if (email === 'dbrabon@gmail.com' && !user.isAdmin) {
            user = { ...user, isAdmin: true, type: 'admin' };
            setUsers(prev => prev.map(u => u.id === user.id ? user : u));
        }
        setCurrentUser(user);
    }
    setCurrentView({ name: 'browse' });
  };

  const logout = () => {
    setCurrentUser(null);
  };
  
  const isEffectivelyNSFW = (item: Product): boolean => {
      const seller = users.find(u => u.id === item.sellerId);
      return item.isNSFW || (seller?.isNSFW || false);
  };

  const products = useMemo(() => {
    return allProducts.filter(p => {
      // Hide reported items from general view
      if (p.reportedNSFW && currentUser?.type !== 'admin') return false;
      // Hide suspended seller items
      const seller = users.find(u => u.id === p.sellerId);
      if (seller?.isSuspended) return false;
      // Handle NSFW content filtering
      if (isEffectivelyNSFW(p) && !currentUser?.ageVerified) {
        return false;
      }
      return true;
    });
  }, [allProducts, users, currentUser]);
  
  const performSearch = async (query: string) => {
    setIsSearching(true);
    setSearchSummary(null);
    setSearchedProductIds(null);
    setCurrentView({ name: 'browse' });

    if (currentUser) {
        const updatedHistory = [
            query, 
            ...searchHistory.filter(h => h.toLowerCase() !== query.toLowerCase())
        ].slice(0, 5);
        setSearchHistory(updatedHistory);
        localStorage.setItem(`search_history_${currentUser.id}`, JSON.stringify(updatedHistory));
    }

    const searchableProducts = products.filter(p => p.status === 'available');
    const result: AISearchResult = await getSearchFiltersFromQuery(query, searchableProducts);
    
    setSearchSummary(result.summary);
    setSearchedProductIds(result.productIds);
    setIsSearching(false);
  };

  const clearSearch = () => {
    setIsSearching(false);
    setSearchSummary(null);
    setSearchedProductIds(null);
  };
  
  const clearSearchHistory = () => {
    setSearchHistory([]);
    if (currentUser) {
        localStorage.removeItem(`search_history_${currentUser.id}`);
    }
  };

  const addItem = (item: Omit<Product, 'id' | 'sellerId' | 'sellerName' | 'status' | 'createdAt'>, isFlaggedByAI: boolean = false) => {
    if (!currentUser || currentUser.type !== 'seller') return;
    const newProduct: Product = {
      ...item,
      id: `prod-${Date.now()}`,
      sellerId: currentUser.id,
      sellerName: currentUser.name,
      status: 'available',
      reportedNSFW: isFlaggedByAI,
      createdAt: new Date(),
    };
    setAllProducts(prev => [...prev, newProduct]);
    setCurrentView({ name: 'profile', userId: currentUser.id });
  };
  
  const addPurchaseRequest = (productId: string, minBid: number, maxBid: number, comment: string) => {
    if (!currentUser) {
      alert("You must be logged in to make a bid.");
      return;
    }
    const product = allProducts.find(p => p.id === productId);
    if (!product) {
      alert("Product not found.");
      return;
    }

    const newRequest: PurchaseRequest = {
      id: `req-${Date.now()}`,
      productId,
      productTitle: product.title,
      buyerId: currentUser.id,
      buyerName: currentUser.name,
      minBid,
      maxBid,
      comment,
      createdAt: new Date(),
      status: 'pending',
    };

    setPurchaseRequests(prev => [...prev, newRequest]);
    alert('Your bid has been sent to the seller!');
  };

  const finalizeSale = (purchaseRequestId: string) => {
    const request = purchaseRequests.find(r => r.id === purchaseRequestId);
    if (!request) {
      alert("Purchase request not found.");
      return;
    }
    const product = allProducts.find(p => p.id === request.productId);
    const seller = users.find(u => u.id === product?.sellerId);
    const buyer = users.find(u => u.id === request.buyerId);

    if (!product || !seller || !buyer) {
      alert("Error processing sale: product, seller, or buyer not found.");
      return;
    }
    
    if (currentUser?.id !== seller.id) {
      alert("You are not authorized to accept this offer.");
      return;
    }
    
    if (product.reservePrice && request.maxBid < product.reservePrice) {
      alert("This bid does not meet the reserve price and cannot be accepted.");
      return;
    }
    
    // Calculate final price based on second-price auction logic
    const allRequestsForProduct = purchaseRequests.filter(r => r.productId === request.productId && r.status === 'pending');
    const otherRequests = allRequestsForProduct.filter(r => r.id !== purchaseRequestId);
    const highestOtherMaxBid = otherRequests.reduce((max, r) => Math.max(max, r.maxBid), 0);
    
    let finalPrice = Math.max(request.minBid, highestOtherMaxBid + 1);
    finalPrice = Math.min(request.maxBid, finalPrice); // Clamp at winner's max bid
    if (product.reservePrice) {
      finalPrice = Math.max(finalPrice, product.reservePrice);
    }

    setAllProducts(prev => prev.map(p => p.id === product.id ? { ...p, status: 'sold' } : p));
    
    const fee = finalPrice * 0.1;
    const newTransaction: Transaction = {
      id: `txn-${Date.now()}`,
      productId: product.id,
      productTitle: product.title,
      buyerId: buyer.id,
      sellerId: seller.id,
      price: finalPrice,
      shippingCost: product.shippingCost,
      fee,
      createdAt: new Date(),
      reviewedByBuyer: false,
      reviewedBySeller: false,
    };
    setTransactions(prev => [...prev, newTransaction]);
    
    setUsers(prev => prev.map(u => u.id === seller.id ? { ...u, feesOwed: (u.feesOwed || 0) + fee } : u));
    
    setPurchaseRequests(prev => prev.map(r => {
      if (r.productId === product.id) {
        return r.id === purchaseRequestId ? { ...r, status: 'accepted' } : { ...r, status: 'rejected' };
      }
      return r;
    }));
    
    alert(`Sale to ${buyer.name} for $${finalPrice.toFixed(2)} confirmed!`);
    setCurrentView({ name: 'profile', userId: seller.id });
  };
  
  const addReview = (transactionId: string, targetUserId: string, rating: number, text: string) => {
    if (!currentUser) {
      alert("You must be logged in to leave a review.");
      return;
    }

    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) {
      alert("Transaction not found.");
      return;
    }
    
    const isBuyer = transaction.buyerId === currentUser.id;
    const isSeller = transaction.sellerId === currentUser.id;

    if ((isBuyer && transaction.reviewedByBuyer) || (isSeller && transaction.reviewedBySeller)) {
      alert("You have already reviewed this transaction.");
      return;
    }
    
    if (!isBuyer && !isSeller) {
        alert("You are not part of this transaction.");
        return;
    }

    const newReview: Review = {
      id: `review-${Date.now()}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      targetId: targetUserId,
      rating,
      text,
      transactionId,
      createdAt: new Date(),
    };

    setUsers(prevUsers => prevUsers.map(user => {
      if (user.id === targetUserId) {
        return { ...user, reviews: [...user.reviews, newReview] };
      }
      return user;
    }));
    
    setTransactions(prevTransactions => prevTransactions.map(t => {
        if (t.id === transactionId) {
            return {
                ...t,
                reviewedByBuyer: isBuyer ? true : t.reviewedByBuyer,
                reviewedBySeller: isSeller ? true : t.reviewedBySeller,
            }
        }
        return t;
    }));
  };

  const reportItem = (productId: string) => {
      setAllProducts(prev => prev.map(p => p.id === productId ? { ...p, reportedNSFW: true } : p));
  };

  const reportUser = (userId: string) => {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, reportedNSFW: true } : u));
  };

  const suspendUser = (userId: string) => {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isSuspended: true } : u));
  };
  
  const reinstateUser = (userId: string) => {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isSuspended: false } : u));
  };
  
  const reviewReportedItem = (productId: string, action: 'dismiss' | 'confirm') => {
      setAllProducts(prev => prev.map(p => {
          if (p.id === productId) {
              return { ...p, reportedNSFW: false, isNSFW: action === 'confirm' ? true : p.isNSFW };
          }
          return p;
      }));
  };
  
  const reviewReportedUser = (userId: string, action: 'dismiss' | 'confirm') => {
      setUsers(prev => prev.map(u => {
          if (u.id === userId) {
              return { ...u, reportedNSFW: false, isNSFW: action === 'confirm' ? true : u.isNSFW };
          }
          return u;
      }));
  };
  
  const updatePaymentMethods = (userId: string, methods: { paypal: string }) => {
      if(currentUser?.id !== userId) return;
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, paymentMethods: methods } : u));
      setCurrentUser(prev => prev ? { ...prev, paymentMethods: methods } : null);
  };
  
  const payFees = (userId: string) => {
      if(currentUser?.id !== userId) return;
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, feesOwed: 0 } : u));
      setCurrentUser(prev => prev ? { ...prev, feesOwed: 0 } : null);
  };
  
  const setAccountNSFW = (isNSFW: boolean) => {
      if(!currentUser) return;
      setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, isNSFW } : u));
      setCurrentUser(prev => prev ? { ...prev, isNSFW } : null);
  };

  const upgradeToSeller = (userId: string) => {
    if (currentUser?.id !== userId) return;

    const upgradeUser = (user: User | null): User | null => {
        if (!user || user.type === 'seller') return user;
        return {
            ...user,
            type: 'seller',
            paymentMethods: user.paymentMethods || {},
            feesOwed: user.feesOwed || 0,
            isSuspended: user.isSuspended || false,
        };
    };

    setUsers(prevUsers => prevUsers.map(u => u.id === userId ? upgradeUser(u)! : u));
    setCurrentUser(prevUser => upgradeUser(prevUser));
  };
  
  const addToWishlist = (productId: string) => {
    if (!currentUser) return;
    setWishlist(prevWishlist => {
      if (prevWishlist.includes(productId)) return prevWishlist;
      const newWishlist = [...prevWishlist, productId];
      localStorage.setItem(`wishlist_${currentUser.id}`, JSON.stringify(newWishlist));
      return newWishlist;
    });
  };

  const removeFromWishlist = (productId: string) => {
    if (!currentUser) return;
    setWishlist(prevWishlist => {
      const newWishlist = prevWishlist.filter(id => id !== productId);
      localStorage.setItem(`wishlist_${currentUser.id}`, JSON.stringify(newWishlist));
      return newWishlist;
    });
  };

  const getWishlistCountForItem = (productId: string): number => {
    const uniqueUserIds = new Set<string>();

    // Count from the mock data for other users
    for (const userId in MOCK_OTHER_USER_WISHLISTS) {
      if (MOCK_OTHER_USER_WISHLISTS[userId].includes(productId)) {
        uniqueUserIds.add(userId);
      }
    }

    // Include the current user if they have the item in their wishlist
    if (currentUser && wishlist.includes(productId)) {
      uniqueUserIds.add(currentUser.id);
    }

    return uniqueUserIds.size;
  };

  const value = {
    currentUser,
    users,
    products,
    allProducts,
    transactions,
    purchaseRequests,
    currentView,
    isSearching,
    searchSummary,
    searchedProductIds,
    performSearch,
    clearSearch,
    login,
    loginWithProvider,
    logout,
    setCurrentView,
    addItem,
    addPurchaseRequest,
    finalizeSale,
    addReview,
    reportItem,
    reportUser,
    suspendUser,
    reinstateUser,
    reviewReportedItem,
    reviewReportedUser,
    updatePaymentMethods,
    payFees,
    setAccountNSFW,
    upgradeToSeller,
    isEffectivelyNSFW,
    wishlist,
    addToWishlist,
    removeFromWishlist,
    getWishlistCountForItem,
    searchHistory,
    clearSearchHistory,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};