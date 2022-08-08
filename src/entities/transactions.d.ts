export interface TransactionsInterface {
    _id: string;
    accountOrigin: string;
    accountDestination: string;
    value: number;
    status?: "In Queue" | "Processing" | "Confirmed" | "Error";
}