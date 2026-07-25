'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';
import * as XLSX from 'xlsx';

/**
 * DataGrid — Komponen spreadsheet-like data grid untuk CaptGrill
 * 
 * Props:
 * @param {Array} columns - Definisi kolom: [{ key, label, type, width, sortable, filterable, format }]
 *   - key: string — nama field dari data
 *   - label: string — label header kolom
 *   - type: 'text' | 'number' | 'currency' | 'date' | 'datetime' | 'badge' — tipe data
 *   - width: number — lebar awal kolom (px)
 *   - sortable: boolean — apakah bisa disort (default: true)
 *   - filterable: boolean — apakah bisa difilter (default: true)
 *   - format: function — custom formatter (optional)
 *   - badgeClass: string — CSS class untuk badge (optional)
 * @param {Array} data - Array of objects
 * @param {string} title - Judul tabel
 * @param {string} icon - Emoji icon
 * @param {string} exportFilename - Nama file export Excel
 * @param {boolean} loading - Status loading
 */
export default function DataGrid({
  columns = [],
  data = [],
  title = 'Data',
  icon = '📊',
  exportFilename = 'data',
  loading = false,
}) {
  // State
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [filters, setFilters] = useState({});
  const [globalSearch, setGlobalSearch] = useState('');
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [columnWidths, setColumnWidths] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);
  const [selectedColumn, setSelectedColumn] = useState(null);

  // Refs
  const resizingRef = useRef(null);
  const tableRef = useRef(null);

  // Initialize column widths
  useEffect(() => {
    const widths = {};
    columns.forEach((col) => {
      widths[col.key] = col.width || 150;
    });
    setColumnWidths(widths);
  }, [columns]);

  // Reset page when filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, globalSearch, sortConfig]);

  // --- Sorting ---
  const handleSort = useCallback((key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' };
        if (prev.direction === 'desc') return { key: null, direction: 'asc' };
      }
      return { key, direction: 'asc' };
    });
  }, []);

  // --- Column Resize ---
  const handleResizeStart = useCallback((e, colKey) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = columnWidths[colKey] || 150;

    const handleMouseMove = (moveEvent) => {
      const diff = moveEvent.clientX - startX;
      const newWidth = Math.max(60, startWidth + diff);
      setColumnWidths((prev) => ({ ...prev, [colKey]: newWidth }));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [columnWidths]);

  // --- Filtering & Searching ---
  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // Global search
    if (globalSearch.trim()) {
      const search = globalSearch.toLowerCase();
      result = result.filter((row) =>
        columns.some((col) => {
          const val = row[col.key];
          if (val == null) return false;
          return String(val).toLowerCase().includes(search);
        })
      );
    }

    // Per-column filters
    Object.entries(filters).forEach(([key, filterVal]) => {
      if (!filterVal || !filterVal.trim()) return;
      const search = filterVal.toLowerCase();
      result = result.filter((row) => {
        const val = row[key];
        if (val == null) return false;
        return String(val).toLowerCase().includes(search);
      });
    });

    // Sorting
    if (sortConfig.key) {
      const col = columns.find((c) => c.key === sortConfig.key);
      result.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];

        if (valA == null) return 1;
        if (valB == null) return -1;

        if (col?.type === 'number' || col?.type === 'currency') {
          valA = Number(valA) || 0;
          valB = Number(valB) || 0;
        } else if (col?.type === 'date' || col?.type === 'datetime') {
          valA = new Date(valA).getTime();
          valB = new Date(valB).getTime();
        } else {
          valA = String(valA).toLowerCase();
          valB = String(valB).toLowerCase();
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, globalSearch, filters, sortConfig, columns]);

  // --- Pagination ---
  const totalPages = Math.ceil(filteredAndSortedData.length / pageSize);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedData.slice(start, start + pageSize);
  }, [filteredAndSortedData, currentPage, pageSize]);

  // --- Status Bar Stats ---
  const statusBarStats = useMemo(() => {
    if (!selectedColumn) return null;
    const col = columns.find((c) => c.key === selectedColumn);
    if (!col || (col.type !== 'number' && col.type !== 'currency')) return null;

    const values = filteredAndSortedData
      .map((r) => Number(r[selectedColumn]))
      .filter((v) => !isNaN(v));

    if (values.length === 0) return null;

    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    return { sum, avg, min, max, count: values.length };
  }, [selectedColumn, filteredAndSortedData, columns]);

  // --- Cell value formatter ---
  const formatCellValue = useCallback((value, col) => {
    if (value == null || value === '') return '-';

    if (col.format) return col.format(value);

    switch (col.type) {
      case 'currency':
        return formatCurrency(Number(value));
      case 'date':
        return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
      case 'datetime':
        return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      case 'number':
        return Number(value).toLocaleString('id-ID');
      default:
        return String(value);
    }
  }, []);

  // --- Export to Excel ---
  const handleExport = useCallback(() => {
    const exportData = filteredAndSortedData.map((row) => {
      const obj = {};
      columns.forEach((col) => {
        let val = row[col.key];
        if (col.type === 'date' && val) val = new Date(val).toLocaleDateString('id-ID');
        if (col.type === 'datetime' && val) val = new Date(val).toLocaleString('id-ID');
        obj[col.label] = val ?? '-';
      });
      return obj;
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    ws['!cols'] = columns.map((col) => ({ wch: Math.max(col.label.length + 2, 15) }));

    XLSX.utils.book_append_sheet(wb, ws, title);
    XLSX.writeFile(wb, `${exportFilename}.xlsx`);
  }, [filteredAndSortedData, columns, title, exportFilename]);

  // --- Clear all filters ---
  const clearFilters = useCallback(() => {
    setFilters({});
    setGlobalSearch('');
    setSortConfig({ key: null, direction: 'asc' });
    setCurrentPage(1);
  }, []);

  const hasActiveFilters = globalSearch.trim() || Object.values(filters).some((v) => v && v.trim());

  // --- Sort indicator ---
  const getSortIcon = (colKey) => {
    if (sortConfig.key !== colKey) return '↕';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="datagrid-container">
      {/* Toolbar */}
      <div className="datagrid-toolbar">
        <div className="datagrid-toolbar-left">
          <div className="datagrid-search-wrapper">
            <span className="datagrid-search-icon">🔍</span>
            <input
              type="text"
              className="datagrid-search"
              placeholder="Cari di semua kolom..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
            />
            {globalSearch && (
              <button className="datagrid-search-clear" onClick={() => setGlobalSearch('')}>✕</button>
            )}
          </div>
          <button
            className={`datagrid-toolbar-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
            title="Filter per kolom"
          >
            <span>⚙️</span> Filter
          </button>
          {hasActiveFilters && (
            <button className="datagrid-toolbar-btn danger" onClick={clearFilters}>
              ✕ Reset
            </button>
          )}
        </div>
        <div className="datagrid-toolbar-right">
          <div className="datagrid-record-count">
            {filteredAndSortedData.length !== data.length && (
              <span className="datagrid-filtered-count">{filteredAndSortedData.length} dari </span>
            )}
            <span>{data.length} baris</span>
          </div>
          <select
            className="datagrid-page-size"
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
          >
            <option value={10}>10 baris</option>
            <option value={25}>25 baris</option>
            <option value={50}>50 baris</option>
            <option value={100}>100 baris</option>
          </select>
          <button className="datagrid-toolbar-btn export" onClick={handleExport} title="Export ke Excel">
            📥 Export
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="datagrid-table-wrapper" ref={tableRef}>
        {loading ? (
          <div className="datagrid-loading">
            <div className="datagrid-loading-spinner" />
            <span>Memuat data...</span>
          </div>
        ) : paginatedData.length === 0 ? (
          <div className="datagrid-empty">
            <span style={{ fontSize: '32px' }}>📭</span>
            <p>Tidak ada data{hasActiveFilters ? ' yang cocok dengan filter' : ''}</p>
          </div>
        ) : (
          <table className="datagrid-table">
            <thead>
              {/* Header Row */}
              <tr>
                <th className="datagrid-th datagrid-row-number" style={{ width: '50px', minWidth: '50px' }}>
                  #
                </th>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`datagrid-th ${sortConfig.key === col.key ? 'sorted' : ''} ${selectedColumn === col.key ? 'selected' : ''}`}
                    style={{ width: columnWidths[col.key] || 150 }}
                    onClick={() => col.sortable !== false && handleSort(col.key)}
                  >
                    <div className="datagrid-th-content">
                      <span className="datagrid-th-label">{col.label}</span>
                      {col.sortable !== false && (
                        <span className={`datagrid-sort-icon ${sortConfig.key === col.key ? 'active' : ''}`}>
                          {getSortIcon(col.key)}
                        </span>
                      )}
                    </div>
                    {/* Resize handle */}
                    <div
                      className="datagrid-resize-handle"
                      onMouseDown={(e) => handleResizeStart(e, col.key)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </th>
                ))}
              </tr>

              {/* Filter Row */}
              {showFilters && (
                <tr className="datagrid-filter-row">
                  <td className="datagrid-filter-cell datagrid-row-number" />
                  {columns.map((col) => (
                    <td key={col.key} className="datagrid-filter-cell" style={{ width: columnWidths[col.key] || 150 }}>
                      {col.filterable !== false && (
                        <input
                          type="text"
                          className="datagrid-filter-input"
                          placeholder={`Filter ${col.label}...`}
                          value={filters[col.key] || ''}
                          onChange={(e) => setFilters((prev) => ({ ...prev, [col.key]: e.target.value }))}
                        />
                      )}
                    </td>
                  ))}
                </tr>
              )}
            </thead>
            <tbody>
              {paginatedData.map((row, rowIdx) => {
                const globalRowIdx = (currentPage - 1) * pageSize + rowIdx;
                return (
                  <tr key={row._rowId ?? row.id ?? rowIdx} className="datagrid-tr">
                    <td className="datagrid-td datagrid-row-number">
                      {globalRowIdx + 1}
                    </td>
                    {columns.map((col) => {
                      const isSelected = selectedCell?.row === globalRowIdx && selectedCell?.col === col.key;
                      return (
                        <td
                          key={col.key}
                          className={`datagrid-td ${col.type === 'currency' || col.type === 'number' ? 'align-right' : ''} ${isSelected ? 'selected' : ''} ${selectedColumn === col.key ? 'col-selected' : ''}`}
                          style={{ width: columnWidths[col.key] || 150 }}
                          onClick={() => {
                            setSelectedCell({ row: globalRowIdx, col: col.key });
                            setSelectedColumn(col.key);
                          }}
                        >
                          {col.type === 'badge' ? (
                            <span className={`badge ${col.badgeClass ? (typeof col.badgeClass === 'function' ? col.badgeClass(row[col.key]) : col.badgeClass) : 'badge-info'}`}>
                              {row[col.key] ?? '-'}
                            </span>
                          ) : (
                            <span className="datagrid-cell-text">{formatCellValue(row[col.key], col)}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer: Pagination + Status Bar */}
      <div className="datagrid-footer">
        {/* Status Bar */}
        <div className="datagrid-statusbar">
          {statusBarStats ? (
            <>
              <span className="datagrid-stat">
                <strong>Σ Sum:</strong> {formatCurrency(statusBarStats.sum)}
              </span>
              <span className="datagrid-stat-divider" />
              <span className="datagrid-stat">
                <strong>x̄ Rata²:</strong> {formatCurrency(Math.round(statusBarStats.avg))}
              </span>
              <span className="datagrid-stat-divider" />
              <span className="datagrid-stat">
                <strong>↓ Min:</strong> {formatCurrency(statusBarStats.min)}
              </span>
              <span className="datagrid-stat-divider" />
              <span className="datagrid-stat">
                <strong>↑ Max:</strong> {formatCurrency(statusBarStats.max)}
              </span>
              <span className="datagrid-stat-divider" />
              <span className="datagrid-stat">
                <strong># Total:</strong> {statusBarStats.count}
              </span>
            </>
          ) : (
            <span className="datagrid-stat hint">Klik kolom angka untuk melihat statistik</span>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="datagrid-pagination">
            <button className="datagrid-page-btn" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>«</button>
            <button className="datagrid-page-btn" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>‹</button>

            {/* Page numbers */}
            {(() => {
              const pages = [];
              let start = Math.max(1, currentPage - 2);
              let end = Math.min(totalPages, start + 4);
              if (end - start < 4) start = Math.max(1, end - 4);

              for (let i = start; i <= end; i++) {
                pages.push(
                  <button
                    key={i}
                    className={`datagrid-page-btn ${currentPage === i ? 'active' : ''}`}
                    onClick={() => setCurrentPage(i)}
                  >
                    {i}
                  </button>
                );
              }
              return pages;
            })()}

            <button className="datagrid-page-btn" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>›</button>
            <button className="datagrid-page-btn" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>»</button>
            <span className="datagrid-page-info">Hal {currentPage} / {totalPages}</span>
          </div>
        )}
      </div>
    </div>
  );
}
