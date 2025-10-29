export type UserType = 'buyer' | 'seller' | 'admin';
export type PaymentMethod = 'paypal' | 'credit_card';
export type ProductCondition = 'New with tags' | 'Like new' | 'Good' | 'Fair';
export type ProductStatus = 'available' | 'sold' | 'expired';

export interface Review {
  id: string;
  authorId: string;
  authorName: string;
  targetId: string;
  rating: number;
  text: string;
  transactionId: string;
  createdAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  age: number;
  type: UserType;
  reviews: Review[];
  isAdmin?: boolean;
  ageVerified?: boolean;
  isNSFW?: boolean;
  reportedNSFW?: boolean;
  paymentMethods?: {
    paypal?: string;
  };
  feesOwed?: number;
  isSuspended?: boolean;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  reservePrice?: number;
  imageUrl: string;
  category: string;
  condition: ProductCondition;
  sellerId: string;
  sellerName: string;
  shippingCost: number;
  status: ProductStatus;
  isNSFW: boolean;
  reportedNSFW?: boolean;
  documentedDamage?: {
    description: string;
    imageUrls: string[];
  }[];
  createdAt: Date;
  expiresAt: Date;
}

export interface Transaction {
  id: string;
  productId: string;
  productTitle: string;
  buyerId: string;
  sellerId:string;
  price: number;
  shippingCost: number;
  fee: number;
  createdAt: Date;
  reviewedByBuyer: boolean;
  reviewedBySeller: boolean;
}

export interface PurchaseRequest {
  id: string;
  productId: string;
  productTitle: string;
  buyerId: string;
  buyerName: string;
  minBid: number;
  maxBid: number;
  comment: string;
  createdAt: Date;
  status: 'pending' | 'accepted' | 'rejected';
}