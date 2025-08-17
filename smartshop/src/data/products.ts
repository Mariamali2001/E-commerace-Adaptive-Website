// data/products.ts
import { Product } from "@/types/product";

export const products: Product[] = [
  {
    id: "p1",
    slug: "one-life-graphic-t-shirt",
    title: "ONE LIFE GRAPHIC T-SHIRT",
    price: 260,
    compareAt: 300,
    rating: 4.5,
    images: ["/images/prod1.jpg", "/images/prod1b.jpg", "/images/prod1c.jpg", "/images/prod1d.jpg"],
    colors: ["#2b2b2b", "#5d6b64", "#2b3457"],
    sizes: ["Small", "Medium", "Large", "X-Large"],
    description:
      "This graphic t-shirt is perfect for any occasion. Crafted from a soft and breathable fabric, it offers superior comfort and style.",
    details:
      "100% cotton, 180gsm. Crew neck. Regular fit. Printed graphic. Made responsibly.",
  },
  {
    id: "p2",
    slug: "polo-with-contrast-trims",
    title: "Polo with Contrast Trims",
    price: 212,
    compareAt: 242,
    rating: 4.0,
    images: ["/images/prod2.jpg"],
    colors: ["#111111", "#b5b5b5"],
    sizes: ["Small", "Medium", "Large"],
    description: "Classic polo with a modern twist.",
  },
  {
    id: "p3",
    slug: "gradient-graphic-tshirt",
    title: "Gradient Graphic T-shirt",
    price: 145,
    rating: 3.5,
    images: ["/images/prod3.jpg"],
    colors: ["#222", "#2b3457"],
    sizes: ["Small", "Medium", "Large", "X-Large"],
    description: "Subtle gradient print on soft cotton.",
  },
  {
    id: "p4",
    slug: "polo-with-tipping-details",
    title: "Polo with Tipping Details",
    price: 180,
    rating: 4.5,
    images: ["/images/prod4.jpg"],
    colors: ["#222", "#0e7490"],
    sizes: ["Small", "Medium", "Large"],
    description: "Refined tipping adds polish to a wardrobe staple.",
  },
  {
    id: "p5",
    slug: "black-striped-tshirt",
    title: "Black Striped T-shirt",
    price: 120,
    compareAt: 160,
    rating: 5.0,
    images: ["/images/prod5.jpg"],
    colors: ["#111", "#ddd"],
    sizes: ["Small", "Medium", "Large"],
    description: "Timeless stripes with a clean silhouette.",
  },
  // add more as needed…
];
