'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { create_invoice, update_invoice, get_delete_invoice } from '../dashboard/fetch_data';
import { Invoice } from './definitions';

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    status: z.enum(['pending', 'paid']),
    date: z.string(),
});
const CreateInvoice = FormSchema.omit({
    id: true, date: true
})
 
export async function createInvoice(formData: FormData) {
  const {
    customerId, amount, status
  } = CreateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];
  // Test it out:
  const rdata:Invoice = {
    id : '',
    customer_id : customerId,
    amount : amountInCents,
    status : status,
    date : date
  };
  try {
    const response = await create_invoice(rdata)
    if (response == 1) {
    } else {
      throw new Error('Failed to Create Invoice');
    }
  } catch (error) {
    console.error(error);
  }
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices')
}

const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
 
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];
  // Test it out:
  const rdata:Invoice = {
    id : id,
    customer_id : customerId,
    amount : amountInCents,
    status : status,
    date : date
  };
  try {
    const response = await update_invoice(rdata);
    if (response != 1) {
      throw new Error('Failed to update Invoice');
    }
  } catch (error) {
    console.error(error)
  }
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices')
}

export async function deleteInvoice(id:string, url: string='?pass') {
  try {
    const response =  await get_delete_invoice(id)  
    if (response != 1) {
        throw new Error('Failed to Delete Invoice');
      }
  } catch (error) {
    console.error(error)
  }
  revalidatePath('/dashboard/invoices');
  redirect(`/dashboard/invoices/${url}`);
}