import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import type {
  ColumnDef,
  ColumnFiltersState,
  RowData,
  SortingState,
} from '@tanstack/react-table'
import { useMemo, useState } from 'react'

type DataTableProps<TData extends RowData> = {
  data: TData[]
  columns: ColumnDef<TData>[]
  getRowId?: (row: TData, index: number) => string
  searchPlaceholder?: string
  emptyTitle?: string
  emptyDescription?: string
  isLoading?: boolean
  error?: Error | null
}

export function DataTable<TData extends RowData>({
  data,
  columns,
  getRowId,
  searchPlaceholder = 'Rechercher...',
  emptyTitle = 'Aucune donnee',
  emptyDescription = 'Aucune ligne ne correspond aux filtres actuels.',
  isLoading = false,
  error = null,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const defaultColumn = useMemo<Partial<ColumnDef<TData>>>(
    () => ({
      enableColumnFilter: true,
    }),
    [],
  )

  // TanStack Table intentionally returns table helpers that React Compiler cannot memoize.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    defaultColumn,
    state: {
      sorting,
      globalFilter,
      columnFilters,
    },
    getRowId,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 8,
      },
    },
  })

  if (error) {
    return (
      <div className="table-state table-state--error">
        <strong>Chargement impossible</strong>
        <span>{error.message}</span>
      </div>
    )
  }

  return (
    <section className="data-table">
      <div className="data-table__toolbar">
        <label className="data-table__search">
          <span>Recherche globale</span>
          <input
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            placeholder={searchPlaceholder}
            type="search"
          />
        </label>
        <span className="data-table__count">
          {table.getFilteredRowModel().rows.length} ligne(s)
        </span>
      </div>

      <div className="table-shell">
        <table className="crm-table">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const sortDirection = header.column.getIsSorted()

                  return (
                    <th key={header.id}>
                      <button
                        className="table-sort-button"
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        disabled={!header.column.getCanSort()}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                        <span aria-hidden="true">
                          {sortDirection === 'asc'
                            ? '↑'
                            : sortDirection === 'desc'
                              ? '↓'
                              : ''}
                        </span>
                      </button>
                      {header.column.getCanFilter() ? (
                        <input
                          className="column-filter"
                          value={(header.column.getFilterValue() ?? '') as string}
                          onChange={(event) =>
                            header.column.setFilterValue(event.target.value)
                          }
                          placeholder="Filtrer"
                          type="search"
                        />
                      ) : null}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td className="table-state-cell" colSpan={columns.length}>
                  Chargement des donnees CRM...
                </td>
              </tr>
            ) : table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr className="table-row" key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td className="table-state-cell" colSpan={columns.length}>
                  <strong>{emptyTitle}</strong>
                  <span>{emptyDescription}</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="data-table__pagination">
        <button
          className="button button--secondary"
          type="button"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Precedent
        </button>
        <span>
          Page {table.getState().pagination.pageIndex + 1} /{' '}
          {table.getPageCount() || 1}
        </span>
        <button
          className="button button--secondary"
          type="button"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Suivant
        </button>
      </div>
    </section>
  )
}
