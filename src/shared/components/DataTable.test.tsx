import { render, screen } from '@testing-library/react'
import type { ColumnDef } from '@tanstack/react-table'

import { DataTable } from './DataTable'

type Row = {
  id: string
  name: string
  status: string
}

const columns: ColumnDef<Row>[] = [
  {
    accessorKey: 'name',
    header: 'Nom',
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: 'status',
    header: 'Statut',
    cell: (info) => info.getValue(),
  },
]

describe('DataTable', () => {
  it('renders rows, search and pagination controls', () => {
    render(
      <DataTable
        columns={columns}
        data={[{ id: '1', name: 'Coralie Ramakavelo', status: 'pilot' }]}
        getRowId={(row) => row.id}
      />,
    )

    expect(screen.getByLabelText('Recherche globale')).toBeInTheDocument()
    expect(screen.getByText('Coralie Ramakavelo')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Suivant/i })).toBeInTheDocument()
  })
})
