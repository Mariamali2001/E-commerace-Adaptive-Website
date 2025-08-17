// components/home/Trending.tsx
export function Trending() {
  return (
    <section className="container mt-10">
      <h2 className="mb-4 text-xl font-bold">Trending Products</h2>
      <div className="grid grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-neutral-900/90" />
        ))}
      </div>
    </section>
  );
}
