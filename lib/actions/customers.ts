"use server";

import { getCustomers } from "@/lib/data/customers";
import type {
  CustomerQueryParams,
  CustomerQueryResult,
} from "@/lib/types/customer";

// Server action wrapper for client-side interactive fetches (search, filter, paginate)
export async function fetchCustomers(
  params: CustomerQueryParams = {}
): Promise<CustomerQueryResult> {
  return getCustomers(params);
}
