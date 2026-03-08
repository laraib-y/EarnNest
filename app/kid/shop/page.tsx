"use client";

import KidBottomNav from "@/components/KidBottomNav";
import "./shop.css";

export default function KidShopPage() {
  return (
    <div className="kid-shop-page">
      <div className="kid-shop-container">
        <div className="kid-shop-content">
          <div className="kid-shop-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="20" r="1.5" />
              <circle cx="18" cy="20" r="1.5" />
              <path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L23 7H7" />
            </svg>
          </div>
          <h1 className="kid-shop-title">Shop Coming Soon!</h1>
          <p className="kid-shop-subtitle">
            We're getting the shop ready with amazing rewards just for you.
          </p>
          <p className="kid-shop-description">
            Keep earning coins from your chores and learning modules to get ready for the grand opening! 🎉
          </p>
        </div>
      </div>
      <KidBottomNav />
    </div>
  );
}
