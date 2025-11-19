import { trpcClient } from "@/integrations/tanstack-query/root-provider";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/react-db";
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient();
// create a loan collection
export const loanCollection = createCollection(
    queryCollectionOptions({
        queryKey: ['loans'],
        queryFn: () => trpcClient.loan.getAll.query(),
        queryClient,
        getKey: (loan) => loan.id,
    })
)