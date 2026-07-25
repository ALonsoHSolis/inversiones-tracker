function AccountRowSkeleton() {
  return (
    <div className="border border-[#ECEEF2] rounded-xl px-[15px] py-[13px] flex items-center justify-between gap-3">
      <div className="flex flex-col gap-2 min-w-0">
        <div className="skeleton h-3.5 w-32" />
        <div className="skeleton h-2.5 w-20" />
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="skeleton h-3.5 w-20" />
        <div className="skeleton h-2.5 w-14" />
      </div>
    </div>
  );
}

function BreakdownCardSkeleton() {
  return (
    <section className="bg-white border border-[#E7E9EE] rounded-2xl p-5 shadow-[0_1px_2px_rgba(20,30,50,0.03)]">
      <div className="skeleton h-3.5 w-32 mb-2" />
      <div className="skeleton h-2.5 w-44 mb-4" />
      <div className="flex flex-col gap-[15px]">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col gap-[7px]">
            <div className="flex items-baseline justify-between gap-2.5">
              <div className="skeleton h-3 w-24" />
              <div className="skeleton h-3 w-16" />
            </div>
            <div className="skeleton h-1.5 w-full" />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Loading() {
  return (
    <main className="max-w-[1160px] mx-auto px-6 pt-[26px] pb-16">
      <header className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="skeleton w-10 h-10 rounded-xl" />
          <div className="flex flex-col gap-1.5">
            <div className="skeleton h-3.5 w-24" />
            <div className="skeleton h-2.5 w-36" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="skeleton h-[34px] w-20 rounded-[9px]" />
          <div className="skeleton h-[34px] w-20 rounded-[9px]" />
        </div>
      </header>

      <section className="bg-white border border-[#E7E9EE] rounded-[18px] px-7 py-6 shadow-[0_1px_2px_rgba(20,30,50,0.03)]">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(280px,1fr)_minmax(360px,1.35fr)] gap-8">
          <div>
            <div className="skeleton h-3 w-40 mb-3" />
            <div className="skeleton h-11 w-56 mb-4" />
            <div className="skeleton h-6 w-32 rounded-full mb-6" />
            <div className="h-px bg-[#EEF0F4] my-5" />
            <div className="grid grid-cols-3 gap-3.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <div className="skeleton h-2.5 w-16" />
                  <div className="skeleton h-4 w-20" />
                </div>
              ))}
            </div>
          </div>
          <div className="skeleton h-[210px] w-full" />
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <BreakdownCardSkeleton />
        <BreakdownCardSkeleton />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-4 mt-4 items-start">
        <section className="bg-white border border-[#E7E9EE] rounded-2xl p-5 shadow-[0_1px_2px_rgba(20,30,50,0.03)]">
          <div className="skeleton h-3.5 w-24 mb-4" />
          <div className="flex flex-col gap-[9px]">
            <AccountRowSkeleton />
            <AccountRowSkeleton />
            <AccountRowSkeleton />
          </div>
        </section>
        <section className="bg-white border border-[#E7E9EE] rounded-2xl p-5 shadow-[0_1px_2px_rgba(20,30,50,0.03)]">
          <div className="skeleton h-3.5 w-28 mb-4" />
          <div className="skeleton h-10 w-full mb-3.5" />
          <div className="skeleton h-10 w-full mb-3.5" />
          <div className="skeleton h-10 w-full" />
        </section>
      </div>
    </main>
  );
}
