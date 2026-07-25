import { listProducts } from "@/server/products";
import { FilterSidebar } from "@/components/shop/FilterSidebar";
import { ProductGrid } from "@/components/shop/ProductGrid";

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const allProducts = await listProducts();

  // Apply filters to products
  let filteredProducts = allProducts;

  // Filter by search query only when user typed a search (not experiment params)
  if (typeof params.search === "string" && params.search.trim()) {
    const searchTerm = params.search.trim().toLowerCase();
    filteredProducts = filteredProducts.filter((p) =>
      p.title.toLowerCase().includes(searchTerm) ||
      p.description.toLowerCase().includes(searchTerm) ||
      p.category?.toLowerCase().includes(searchTerm) ||
      p.brand?.toLowerCase().includes(searchTerm)
    );
  }

  // Filter by category
  if (params.category && typeof params.category === "string") {
    filteredProducts = filteredProducts.filter((p) => 
      p.category === params.category
    );
  }

  // Filter by brand
  if (params.brand && typeof params.brand === "string") {
    filteredProducts = filteredProducts.filter((p) => 
      p.brand?.toLowerCase() === (params.brand as string).toLowerCase()
    );
  }

  // Filter by colors
  if (params.colors && typeof params.colors === "string") {
    const selectedColors = params.colors.split(",");
    filteredProducts = filteredProducts.filter((p) =>
      p.colors.some((color) => selectedColors.includes(color))
    );
  }

  // Filter by sizes
  if (params.sizes && typeof params.sizes === "string") {
    const selectedSizes = params.sizes.split(",");
    filteredProducts = filteredProducts.filter((p) =>
      p.sizes.some((size) => selectedSizes.includes(size))
    );
  }

  // Filter by price range
  if (params.minPrice || params.maxPrice) {
    const min = params.minPrice ? parseFloat(params.minPrice as string) : 0;
    const max = params.maxPrice ? parseFloat(params.maxPrice as string) : Infinity;
    filteredProducts = filteredProducts.filter((p) => p.price >= min && p.price <= max);
  }

  // Extract unique values for filters from all products
  const categoryCounts = allProducts.reduce((acc, p) => {
    if (p.category) {
      acc[p.category] = (acc[p.category] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const categories = [
    { value: "", label: "All Categories", count: allProducts.length },
    { value: "electronics", label: "Electronics", count: categoryCounts.electronics || 0 },
    { value: "fashion", label: "Fashion", count: categoryCounts.fashion || 0 },
    { value: "accessories", label: "Accessories", count: categoryCounts.accessories || 0 },
  ];

  const brandCounts = allProducts.reduce((acc, p) => {
    if (p.brand) {
      acc[p.brand.toLowerCase()] = (acc[p.brand.toLowerCase()] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const brands = [
    { value: "", label: "All Brands", count: allProducts.length },
    { value: "apple", label: "Apple", count: brandCounts.apple || 0 },
    { value: "chanel", label: "Chanel", count: brandCounts.chanel || 0 },
    { value: "zara", label: "Zara", count: brandCounts.zara || 0 },
    { value: "nike", label: "Nike", count: brandCounts.nike || 0 },
    { value: "adidas", label: "Adidas", count: brandCounts.adidas || 0 },
  ];

  const colors = [
    { value: "#000000", label: "Black" },
    { value: "#FFFFFF", label: "White" },
    { value: "#FF0000", label: "Red" },
    { value: "#0000FF", label: "Blue" },
    { value: "#00FF00", label: "Green" },
    { value: "#FFFF00", label: "Yellow" },
    { value: "#FFC0CB", label: "Pink" },
    { value: "#808080", label: "Gray" },
  ];

  const sizes = [
    { value: "XS", label: "XS" },
    { value: "S", label: "S" },
    { value: "M", label: "M" },
    { value: "L", label: "L" },
    { value: "XL", label: "XL" },
    { value: "XXL", label: "XXL" },
  ];

  const priceRange = {
    min: 0,
    max: 5000,
  };

  // Only show "Search results" when the user actually searched
  const searchQuery =
    typeof params.search === "string" && params.search.trim()
      ? params.search.trim()
      : "";
  const pageTitle = searchQuery
    ? `Search results for "${searchQuery}"`
    : "Shop All Products";

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">{pageTitle}</h1>
      
      <div className="flex flex-col lg:flex-row gap-8">
        <FilterSidebar
          categories={categories}
          brands={brands}
          colors={colors}
          sizes={sizes}
          priceRange={priceRange}
        />
        
        <ProductGrid products={filteredProducts} totalCount={allProducts.length} />
      </div>
    </div>
  );
}
