import React, { useMemo, useState, useEffect, useCallback } from 'react';
import ProductCard from './ProductCard';
import { useAppContext } from '../contexts/AppContext';
import type { Product, ProductCondition, User, PurchaseRequest } from '../types';

const categories = ['All', 'Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Shoes', 'Accessories', 'NSFW'];
const conditions: (ProductCondition | 'All')[] = ['All', 'New with tags', 'Like new', 'Good', 'Fair'];
const priceRanges = [
    { label: 'Any Price', value: 'All' },
    { label: '$0 - $25', value: '0-25' },
    { label: '$25 - $75', value: '25-75' },
    { label: '$75 - $150', value: '75-150' },
    { label: '$150+', value: '150-Infinity' },
];
const sortOptions = [
    { label: 'Recommended', value: 'recommended' },
    { label: 'Relevance', value: 'relevance' },
    { label: 'Newest', value: 'newest' },
    { label: 'Price: Low to High', value: 'price-asc' },
    { label: 'Price: High to Low', value: 'price-desc' },
];


const ProductGrid: React.FC = () => {
  const { 
    products, 
    searchedProductIds, 
    searchSummary, 
    clearSearch, 
    isSearching,
    users,
    purchaseRequests,
    getWishlistCountForItem 
  } = useAppContext();
  
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [conditionFilter, setConditionFilter] = useState('All');
  const [priceFilter, setPriceFilter] = useState('All');
  const [sortOption, setSortOption] = useState('recommended');

  const isSearchActive = searchedProductIds !== null;
  
  // Automatically switch to 'relevance' sort when a search is active, and 'recommended' otherwise.
  useEffect(() => {
    if (isSearchActive) {
      setSortOption('relevance');
    } else {
      setSortOption('recommended');
    }
  }, [isSearchActive]);

  const calculateSortScore = useCallback((product: Product): number => {
    let score = 0;
    const now = Date.now();

    // 1. Recency Score (newer is better)
    const ageInHours = (now - new Date(product.createdAt).getTime()) / (1000 * 3600);
    if (ageInHours <= 24) { // Last 24 hours
        score += 50;
    } else if (ageInHours <= 24 * 7) { // Last week
        score += 20;
    }

    // 2. Urgency Score (expiring soon is better)
    const timeLeftInHours = (new Date(product.expiresAt).getTime() - now) / (1000 * 3600);
    if (timeLeftInHours > 0 && timeLeftInHours <= 24) { // Expires in next 24 hours
        score += 60;
    } else if (timeLeftInHours > 0 && timeLeftInHours <= 24 * 7) { // Expires in next week
        score += 30;
    }

    // 3. Popularity Score (more wishlists is better)
    const wishlistCount = getWishlistCountForItem(product.id);
    score += wishlistCount * 5;

    // 4. Activity Score (more offers is better)
    const offerCount = purchaseRequests.filter(
        r => r.productId === product.id && r.status === 'pending'
    ).length;
    score += offerCount * 10;

    // 5. Seller Score (higher rating is better)
    const seller = users.find(u => u.id === product.sellerId);
    if (seller && seller.reviews.length > 0) {
        const avgRating = seller.reviews.reduce((acc, r) => acc + r.rating, 0) / seller.reviews.length;
        // A 5-star seller gets +10 points, a 3-star gets 0, a 1-star gets -10.
        score += (avgRating - 3) * 5;
    }

    return score;
  }, [users, purchaseRequests, getWishlistCountForItem]);

  const displayedProducts = useMemo(() => {
    // 1. Determine the base set of products. If a search is active, use the search results.
    // Otherwise, use all available products.
    let baseProducts: Product[];
    if (isSearchActive) {
      const productMap = new Map(products.map(p => [p.id, p]));
      baseProducts = searchedProductIds
        .map(id => productMap.get(id))
        .filter((p): p is Product => p !== undefined && p.status === 'available');
    } else {
      baseProducts = products.filter(p => p.status === 'available');
    }

    // 2. Apply manual filters (category, condition, price) to the base set.
    const filteredProducts = baseProducts.filter(p => {
        if (categoryFilter !== 'All' && p.category !== categoryFilter) return false;
        if (conditionFilter !== 'All' && p.condition !== conditionFilter) return false;
        if (priceFilter !== 'All') {
            const [minStr, maxStr] = priceFilter.split('-');
            const min = parseFloat(minStr);
            const max = maxStr === 'Infinity' ? Infinity : parseFloat(maxStr);
            if (p.price < min || p.price > max) return false;
        }
        return true;
    });

    // 3. Apply sorting. 'Relevance' sort (the default for AI search) means preserving the order.
    // Any other selection will re-sort the filtered results.
    if (isSearchActive && sortOption === 'relevance') {
      return filteredProducts;
    }

    return [...filteredProducts].sort((a, b) => {
        switch (sortOption) {
            case 'recommended':
                return calculateSortScore(b) - calculateSortScore(a);
            case 'price-asc':
                return a.price - b.price;
            case 'price-desc':
                return b.price - a.price;
            case 'newest':
            default:
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
    });

  }, [products, searchedProductIds, isSearchActive, categoryFilter, conditionFilter, priceFilter, sortOption, calculateSortScore]);
  
  const handleClearFilters = () => {
      setCategoryFilter('All');
      setConditionFilter('All');
      setPriceFilter('All');
      // Sort option is handled by the useEffect when clearSearch is called, or when search becomes active.
  };
  
  const areFiltersActive = categoryFilter !== 'All' || conditionFilter !== 'All' || priceFilter !== 'All';

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {isSearchActive && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-8 flex justify-between items-center">
          <div>
            <p className="font-semibold text-indigo-800">AI Search Results</p>
            <p className="text-sm text-indigo-700 italic">{searchSummary}</p>
          </div>
          <button 
            onClick={clearSearch}
            className="px-4 py-2 text-sm font-medium text-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-100 transition-colors"
          >
            &times; Clear Search
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-8 border">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
              <div>
                  <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700">Category</label>
                  <select id="category-filter" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                      {categories.map(c => <option key={c}>{c}</option>)}
                  </select>
              </div>
              <div>
                  <label htmlFor="condition-filter" className="block text-sm font-medium text-gray-700">Condition</label>
                  <select id="condition-filter" value={conditionFilter} onChange={e => setConditionFilter(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                      {conditions.map(c => <option key={c}>{c}</option>)}
                  </select>
              </div>
              <div>
                  <label htmlFor="price-filter" className="block text-sm font-medium text-gray-700">Price Range</label>
                  <select id="price-filter" value={priceFilter} onChange={e => setPriceFilter(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                      {priceRanges.map(pr => <option key={pr.value} value={pr.value}>{pr.label}</option>)}
                  </select>
              </div>
               <div>
                  <label htmlFor="sort-options" className="block text-sm font-medium text-gray-700">Sort by</label>
                  <select id="sort-options" value={sortOption} onChange={e => setSortOption(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                      {sortOptions.map(opt => (
                        // Disable relevance option if not in an AI search
                        <option key={opt.value} value={opt.value} disabled={opt.value === 'relevance' && !isSearchActive}>{opt.label}</option>
                      ))}
                  </select>
              </div>
              <button
                onClick={handleClearFilters}
                disabled={!areFiltersActive}
                className="w-full bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                  Clear Filters
              </button>
          </div>
      </div>

      {!isSearchActive && <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-8">Latest Finds</h2>}

      {isSearching ? (
        <div className="text-center py-16">
          <p className="text-gray-500">The AI assistant is looking for items...</p>
        </div>
      ) : displayedProducts.length === 0 ? (
        <div className="text-center py-16 bg-gray-100 rounded-lg">
          <p className="text-lg font-semibold text-gray-700">No items found.</p>
          <p className="text-gray-500 mt-2">{isSearchActive || areFiltersActive ? "Try adjusting your search or filters." : "Be the first to sell!"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductGrid;