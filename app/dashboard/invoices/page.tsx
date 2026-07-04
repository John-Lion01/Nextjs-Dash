import Pagination from '@/app/ui/invoices/pagination';
import Search from '@/app/ui/search';
import Table from '@/app/ui/invoices/table';
import { CreateInvoice } from '@/app/ui/invoices/buttons';
import { lusitana } from '@/app/ui/fonts';
import { InvoicesTableSkeleton } from '@/app/ui/skeletons';
import { Suspense } from 'react';
import { get_filtered_invoicePage } from '../fetch_data';
import { redirect } from 'next/navigation'; 

export default async function Page(props : {
    searchParams?: Promise<{
        query?: String;
        page?: string;
    }>;    
}) {
    const searchParams = await props.searchParams;
    const query = searchParams?.query || '';
    let currentPage = Number(searchParams?.page) || 1;
    const totalPages = await get_filtered_invoicePage(query);
    if ((currentPage > 0) && (currentPage > totalPages)) {
      // currentPage = totalPages
      redirect(`/dashboard/invoices?page=${totalPages}&query=${query}`)
    }
    
  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>Invoices</h1>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Search placeholder="Search invoices..." />
        <CreateInvoice />
      </div>
       <Suspense key={query + currentPage} fallback={<InvoicesTableSkeleton />}>
        <Table query={query} currentPage={currentPage} />
      </Suspense>
      <div className="mt-5 flex w-full justify-center">
        <Pagination totalPages={totalPages} />
      </div>
    </div>
  );
}