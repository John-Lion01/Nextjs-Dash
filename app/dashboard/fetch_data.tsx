import { fetchRevenue, fetchLatestInvoices, fetchCardData } from  '@/app/lib/data';
import { formatCurrency } from '@/app/lib/utils';
import { 
    revenue, latestInvoices, customers, invoices 
} from '../lib/placeholder-data';
import { Invoice } from '../lib/definitions';

const BaseApiUrl = process.env.API_BASE_URL;

export async function get_data(url:String) {
    try {
        const response = await fetch(
            `${BaseApiUrl}${url}`,
            {
                method: "GET",                
            }
        );
        if (!response.ok) {
            throw new Error(`Erreur ${response.status}`);
        }
        return await response.json();
    } finally {} 
}

export default async function data(offline: boolean, api: boolean, elt:string='') {
    if (api) {
        const data_ = await Promise.all([
            get_data('revenue'),
            get_data('latestInvoices'),
            get_data("numbers")
        ]);
        const revenue = data_[0];
        const latestInvoices = data_[1];
        const numberOfCustomers = data_[2]['numberOfCustomers'];
        const numberOfInvoices = data_[2]['numberOfInvoices'];
        const totalPendingInvoices = formatCurrency(data_[2]['totalPendingInvoices']);
        const totalPaidInvoices = formatCurrency(data_[2]['totalPaidInvoices']);

        // for test purpose only
        // console.log('Fetching revenue data...');
        // await new Promise((resolve) => setTimeout(resolve, tp*1000));
        // console.log('Data fetch completed after ' + tp +  ' seconds.');

        if (elt == "revenue") return revenue;
        if (elt == 'latestInvoices') return latestInvoices;
        if (elt == 'numbers') return {            
            numberOfCustomers,
            numberOfInvoices,            
            totalPendingInvoices,
            totalPaidInvoices
        }
        return {
            revenue,
            latestInvoices,
            numberOfCustomers,
            numberOfInvoices,
            totalPendingInvoices,
            totalPaidInvoices
        };
    }
    
    if (offline) {        
        const numberOfCustomers = customers.length;
        const numberOfInvoices = invoices.length;
        let totalPendingInvoices_ = 0;
        let totalPaidInvoices_ = 0;
        invoices.map((invoice) => {
            if (invoice.status == 'pending') {
                totalPendingInvoices_ += invoice.amount;
            } else {
                totalPaidInvoices_ += invoice.amount
            }
        })  
        let totalPendingInvoices = formatCurrency(totalPendingInvoices_);
        let totalPaidInvoices = formatCurrency(totalPaidInvoices_);  

        // for test purpose only
        // console.log('Fetching revenue data...');
        // await new Promise((resolve) => setTimeout(resolve, 3000));
        // console.log('Data fetch completed after 3 seconds.');

        return {
            revenue,
            latestInvoices,
            numberOfCustomers,
            numberOfInvoices,
            totalPendingInvoices,
            totalPaidInvoices
        };
    } else {
        const data_ = await Promise.all([
            fetchRevenue(),
            fetchLatestInvoices(),
            fetchCardData()
        ]);
        const revenue = data_[0];
        const latestInvoices = data_[1];
        const { 
            numberOfCustomers, numberOfInvoices, 
            totalPendingInvoices, totalPaidInvoices 
        } = data_[2];
        return {
            revenue,
            latestInvoices,
            numberOfCustomers,
            numberOfInvoices,
            totalPendingInvoices,
            totalPaidInvoices
        };
    }
}

const ITEMS_PER_PAGE = 7
export async function get_filtered_invoice(
    query: string, currentPage: number, items_per_page = ITEMS_PER_PAGE
) {
    const path = "filterinvoices/?query=" + query + "&page=" + currentPage + "&per_page=" + items_per_page;
    const invoices = await get_data(path);
    return invoices    
}

export async function get_filtered_invoicePage(query: string) {
    const invoices = await get_filtered_invoice(
        query, 0, null
    );
    const totalPage = Math.ceil(
        Number(invoices.length) / ITEMS_PER_PAGE
    )
    return totalPage;
}

export async function fetchCustomers() {
    const response = await get_data('fetchcustomers');
    return response
}

export async function create_invoice(data: Invoice) {
    try {
        const response = await fetch(
            `${BaseApiUrl}${'create_invoice'}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",                    
                },   
                body: JSON.stringify(data)             
            }
        );
        if (!response.ok) new Error(`erreur ${response.status}`);
        return 1;
    }catch (error) {
        console.error("Erreur GET:", error);
        return null;
    }
}

export async function get_invoice_by_id(id:string) {
    try {
        const path = `invoice_by_id/${id}/`;
        const response = await get_data(path);
        console.log(response)
        return response[0]
    } catch (error) {
        console.error("DataBase error : ", error);
        throw new Error("Failed to fetch invoice");
    }
}

export async function update_invoice(data:Invoice) {
    try {
        const response = await fetch(
            `${BaseApiUrl}${`update_invoice/${data.id}`}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",                    
                },   
                body: JSON.stringify(data)             
            }
        );
        if (!response.ok) new Error(`erreur ${response.status}`);
        return 1;
    }catch (error) {
        console.error("Erreur GET:", error);
        return null;
    }
}

export async function get_delete_invoice(id:string) {
    const path = `delete_invoice/${id}/`;
    const response = await get_data(path);
    return 1
}