'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { OrderItem } from '@/types';

interface CartContextType {
  items: OrderItem[];
  addItem: (item: OrderItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  deliveryMethod: 'shop_collection' | 'home_delivery';
  setDeliveryMethod: (method: 'shop_collection' | 'home_delivery') => void;
  deliveryCharge: number;
  subtotal: number;
  grandTotal: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [deliveryMethod, setDeliveryMethod] = useState<'shop_collection' | 'home_delivery'>('shop_collection');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('dp_cart');
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load cart', e);
    }
    setIsLoaded(true);
  }, []);

  // Save to local storage on changes
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('dp_cart', JSON.stringify(items));
      } catch (e) {
        console.error('Failed to save cart', e);
      }
    }
  }, [items, isLoaded]);

  const addItem = (item: OrderItem) => {
    setItems((prev) => {
      // If exact same item already exists with matching dimensions/material, increment
      const existingIdx = prev.findIndex(
        (i) =>
          i.productId === item.productId &&
          i.material === item.material &&
          i.selectedSize === item.selectedSize &&
          i.selectedColor === item.selectedColor &&
          i.width === item.width &&
          i.height === item.height &&
          i.customText === item.customText
      );

      if (existingIdx >= 0) {
        const updated = [...prev];
        const existing = updated[existingIdx];
        const newQty = existing.quantity + item.quantity;
        const unitCost = existing.totalPrice / existing.quantity;
        updated[existingIdx] = {
          ...existing,
          quantity: newQty,
          totalPrice: unitCost * newQty,
        };
        return updated;
      }
      return [...prev, item];
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const unitCost = item.totalPrice / item.quantity;
          return {
            ...item,
            quantity,
            totalPrice: Math.round(unitCost * quantity * 100) / 100,
          };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const deliveryCharge = 0;
  const grandTotal = subtotal;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        deliveryMethod,
        setDeliveryMethod,
        deliveryCharge,
        subtotal,
        grandTotal,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
