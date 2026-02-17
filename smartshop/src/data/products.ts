// data/products.ts
import { Product } from "@/types/product";

export const products: Product[] = [

  // should be updated and organized into categories for example electronics, fashion, home, etc.
  // so for each catefory shoukd be hold 20 products
  // Electronics
  {
    id: "p1",
    slug: "apple-ecosystem-bundle-macbook-pro-iphone-airpods-max",
    title: "Apple Ecosystem Bundle (MacBook Pro, iPhone, Apple Watch)",
    price: 3000,
    compareAt: 3400,
    rating: 4.8,
    images: ["/images/prod1.jpg", "/images/macbook.jpg", "/images/watch.jpg", "/images/iphone.jpg"],
    colors: ["#2b2b2b", "#5d6b64", "#2b3457"],
    sizes: [],
    description: "All devices are brand new, sealed in original packaging. Ideal for creators, developers, or anyone who wants the complete premium Apple ecosystem in one click.",
    details: "256GB, 512GB, 1TB, 2TB storage options",
    category: "electronics",
    brand: "Apple",
  },
  // Perfumes
  {
    id: "p2",
    slug: "chanel-coco-noir-eau-de-parfum-100ml",
    title: "Chanel Coco Noir Eau de Parfum 100m",
    price: 212,
    compareAt: 242,
    rating: 4.0,
    images: ["/images/prod5.jpg"],
    colors: ["#111111", "#b5b5b5"],
    sizes: ["10ML", "30ML", "50ML"],
    description: "Coco Noir is a voluptuous oriental scent with luminous accents of grapefruit and bergamot, a floral heart of rose and jasmine, and a rich, sensual base of patchouli, sandalwood, vanilla, and frankincense..",
    category: "accessories",
    brand: "Chanel",
  },
  //Clothing
  {
    id: "p3",
    slug: "minimalist-beige-long-blazer",
    title: "Minimalist Beige Long Blazer",
    price: 180,
    rating: 4.5,
    images: ["/images/prod7.jpg"],
    colors: ["#222", "#0e7490"],
    sizes: ["Small", "Medium", "Large"],
    description: "Features a relaxed oversized fit, long sleeves, and a subtle sheen that photographs like a dream.",
    category: "fashion",
    brand: "Zara",
  },
  // Accessories
  {
    id: "p4",
    slug: "bold-twisted-gold-hoop-earrings",
    title: "Bold Twisted Gold Hoop Earrings",
    price: 60,
    compareAt: 90,
    rating: 5.0,      
    images: ["/images/prod4.jpg"],
    colors: ["#111", "#ddd"],
    sizes: [],
    description: "Summer collection",
    category: "accessories",
    brand: "Generic",
  },

  
  // //skincare 
  // {
  //   id: "p50",
  //   slug: "neutrogena-hydroboost-water-gel-100ml",
  //   title: "Neutrogena Hydroboost Water Gel 100ml",
  //   price: 120,
  //   rating: 4.5,
  //   images: ["/images/prod6.jpg"],
  //   colors: ["#111", "#ddd"],
  //   sizes: [],
  //   description: "Hydrating water gel for all skin types. Perfect for daily use.",
  // },

 

  //Home & Kitchen 60
  // {
  //   id: "p60",
  //   slug: "kitchen-aid-stand-mixer-5-qt",
  //   title: "KitchenAid Stand Mixer 5 Qt",
  //   price: 180,
  //   rating: 4.5,
  //   images: ["/images/prod8.jpg"],
  //   colors: ["#111", "#ddd"],
  //   sizes: [],
  //   description: "KitchenAid Stand Mixer 5 Qt. Perfect for daily use.",
  // },
  // //Beauty 70
  // {
  //   id: "p70",
  //   slug: "lancome-advanced-genifique-eye-contour-cream",
  //   title: "Lancome Advanced Genifique Eye Contour Cream",
  //   price: 180,
  //   rating: 4.5,
  //   images: ["/images/prod9.jpg"],
  //   colors: ["#111", "#ddd"],
  //   sizes: [],
  //   description: "Lancome Advanced Genifique Eye Contour Cream. Perfect for daily use.",
  // },
  // //Books 80
  // {
  //   id: "p80",
  //   slug: "the-alchemist-paulo-coelho",
  //   title: "The Alchemist Paulo Coelho",
  //   price: 180,
  //   rating: 4.5,
  //   images: ["/images/prod10.jpg"],
  //   colors: ["#111", "#ddd"],
  //   sizes: [],
  //   description: "The Alchemist Paulo Coelho. Perfect for daily use.",
  // },
];
