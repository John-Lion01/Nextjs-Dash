import Form from '@/app/ui/invoices/edit-form';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
// import { fetchCustomers } from '@/app/lib/data';
import { fetchCustomers, get_invoice_by_id } from '@/app/dashboard/fetch_data';
import { notFound } from 'next/navigation';
import { Invoice } from '@/app/lib/definitions';
 
export default async function Page(
    props: { params: Promise<{ id: string }> 
}) {
    const params = await props.params;
    const id = params.id;
    const [invoice, customers] = await Promise.all([
        get_invoice_by_id(id),
        fetchCustomers(),
    ]);
    console.log("get invoices : ", invoice)
    if (!invoice) {
      notFound();
    }

    invoice.amount /= 100
  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Invoices', href: '/dashboard/invoices' },
          {
            label: 'Edit Invoice',
            href: `/dashboard/invoices/${id}/edit`,
            active: true,
          },
        ]}
      />
      <Form invoice={invoice} customers={customers} />
    </main>
  );
}