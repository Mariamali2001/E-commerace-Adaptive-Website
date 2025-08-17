// components/shared/Newsletter.tsx
export function Newsletter() {
  return (
    <section className="container mt-14">
      <div className="rounded-2xl bg-neutral-900 px-6 py-10 text-white">
        <h3 className="text-2xl font-extrabold leading-tight">STAY UPTO DATE ABOUT<br/>OUR LATEST OFFERS</h3>
        <form className="mt-6 flex flex-col gap-2 sm:flex-row">
          <input className="flex-1 rounded-xl border-0 p-3 text-neutral-900" placeholder="Enter your email address" />
          <button className="btn bg-white text-neutral-900 hover:opacity-90">Subscribe to Newsletter</button>
        </form>
      </div>
    </section>
  );
}
