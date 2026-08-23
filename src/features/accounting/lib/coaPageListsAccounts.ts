/** ACC-001: CoaPage_ListsAccounts */
export function CoaPage_ListsAccounts(accounts: { code: string; name: string }[]): boolean {
  return accounts.length > 0 && accounts.every((a) => Boolean(a.code && a.name))
}
