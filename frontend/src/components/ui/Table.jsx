import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export default function Table({ columns, data = [], sortField, sortOrder, onSort, onRowClick, emptyMessage = 'No records found' }) {
  const safeData = Array.isArray(data) ? data : [];
  const renderSortIcon = (field) => {
    if (sortField !== field) return <ChevronsUpDown className="w-3.5 h-3.5 text-surface-400" />;
    return sortOrder === 'asc'
      ? <ChevronUp className="w-3.5 h-3.5 text-brand-600" />
      : <ChevronDown className="w-3.5 h-3.5 text-brand-600" />;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-surface-200">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider
                  ${col.sortable ? 'cursor-pointer hover:text-surface-700 select-none' : ''}`}
                style={{ width: col.width }}
                onClick={() => col.sortable && onSort?.(col.key)}
              >
                <div className="flex items-center gap-1.5">
                  {col.label}
                  {col.sortable && renderSortIcon(col.key)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-100">
          {safeData.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-surface-400 text-sm">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            safeData.map((row, i) => (
              <tr
                key={row._id || i}
                className={`transition-all duration-150 hover:bg-brand-50/40 ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3.5 text-sm text-surface-700">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
