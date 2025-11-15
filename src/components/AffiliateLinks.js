import React from 'react';

const AffiliateLinks = ({ category = 'general', limit = 3 }) => {
  // Base de datos de productos sugeridos por categoría
  const productSuggestions = {
    general: [
      {
        name: "iPhone 15 Pro Max",
        price: "$1,199",
        image: "📱",
        affiliateUrl: "https://amzn.to/iphone15promax", // Enlace de afiliado
        store: "Amazon"
      },
      {
        name: "Samsung TV 65\"",
        price: "$799",
        image: "📺",
        affiliateUrl: "https://amzn.to/samsung65tv",
        store: "Amazon"
      },
      {
        name: "MacBook Air M2",
        price: "$999",
        image: "💻",
        affiliateUrl: "https://amzn.to/macbookairm2",
        store: "Amazon"
      }
    ],
    technology: [
      {
        name: "AirPods Pro",
        price: "$249",
        image: "🎧",
        affiliateUrl: "https://amzn.to/airpodspro",
        store: "Amazon"
      },
      {
        name: "iPad Air",
        price: "$599",
        image: "📱",
        affiliateUrl: "https://amzn.to/ipadair",
        store: "Amazon"
      }
    ],
    home: [
      {
        name: "Roomba i7+",
        price: "$599",
        image: "🤖",
        affiliateUrl: "https://amzn.to/roombai7",
        store: "Amazon"
      },
      {
        name: "Nespresso Vertuo",
        price: "$199",
        image: "☕",
        affiliateUrl: "https://amzn.to/nespresso",
        store: "Amazon"
      }
    ]
  };

  const suggestions = productSuggestions[category] || productSuggestions.general;
  const displaySuggestions = suggestions.slice(0, limit);

  return (
    <div className="affiliate-suggestions">
      <h4 className="suggestions-title">
        🎯 Premios Populares para tu Rifa
      </h4>
      <div className="suggestions-grid">
        {displaySuggestions.map((product, index) => (
          <a
            key={index}
            href={product.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="suggestion-card"
          >
            <div className="suggestion-image">
              {product.image}
            </div>
            <div className="suggestion-info">
              <div className="suggestion-name">{product.name}</div>
              <div className="suggestion-price">{product.price}</div>
              <div className="suggestion-store">{product.store}</div>
            </div>
            <div className="suggestion-arrow">→</div>
          </a>
        ))}
      </div>
      <div className="affiliate-disclosure">
        <small>💡 Enlaces de afiliados - SorteoHub puede recibir comisión</small>
      </div>
    </div>
  );
};

export default AffiliateLinks;
