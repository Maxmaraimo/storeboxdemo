import { useCallback, useEffect, useState } from "react";

export function useTablePagination(scope: string) {
  const [state, setState] = useState({ scope, page: 1, pageSize: 10 });

  useEffect(() => {
    setState((current) => current.scope === scope ? current : { ...current, scope, page: 1 });
  }, [scope]);

  const setPage = useCallback((page: number) => {
    setState((current) => ({ ...current, scope, page }));
  }, [scope]);

  const setPageSize = useCallback((pageSize: number) => {
    setState({ scope, page: 1, pageSize });
  }, [scope]);

  return { page: state.scope === scope ? state.page : 1, pageSize: state.pageSize, setPage, setPageSize };
}
