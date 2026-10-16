import { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  X,
  Download,
  Loader2,
  Table,
} from 'lucide-react';
import { parseCsv } from '../../utils/csvUtils';

export function ImportModal({
  isOpen,
  onClose,
  title,
  templateName,
  onDownloadTemplate,
  onImport,
  validateRow,
  columns,
  sampleDescription,
}) {
  const [file, setFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [errors, setErrors] = useState([]);
  const [validRows, setValidRows] = useState([]);
  const [importing, setImporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv') && !selectedFile.name.endsWith('.txt')) {
      alert('Please upload a valid .csv file or export from Excel.');
      return;
    }

    setFile(selectedFile);
    setStatusMessage('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        const rawLines = parseCsv(text);
        if (rawLines.length < 2) {
          setErrors(['The uploaded file appears to be empty or contains only header row.']);
          setParsedRows([]);
          setValidRows([]);
          return;
        }

        const headers = rawLines[0].map((h) => h.toLowerCase().trim());
        const dataRows = rawLines.slice(1);

        const validated = [];
        const foundErrors = [];

        dataRows.forEach((row, idx) => {
          const rowObj = {};
          headers.forEach((h, colIdx) => {
            rowObj[h] = row[colIdx] || '';
          });

          const validationResult = validateRow ? validateRow(rowObj, idx + 2) : { valid: true };
          if (validationResult.valid) {
            validated.push(validationResult.data || rowObj);
          } else {
            foundErrors.push(`Row ${idx + 2}: ${validationResult.error}`);
          }
        });

        setParsedRows(dataRows);
        setValidRows(validated);
        setErrors(foundErrors);
      } catch (err) {
        setErrors([`Failed to parse CSV: ${err.message}`]);
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleExecuteImport = async () => {
    if (validRows.length === 0) return;
    setImporting(true);
    setStatusMessage(`Importing ${validRows.length} records...`);
    try {
      await onImport(validRows);
      setStatusMessage('Import completed successfully!');
      setTimeout(() => {
        onClose();
        setFile(null);
        setParsedRows([]);
        setValidRows([]);
        setErrors([]);
        setStatusMessage('');
      }, 1000);
    } catch (err) {
      setErrors([err.message || 'Import failed.']);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E34234]/10 text-[#E34234] flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Upload CSV or Excel-exported file
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Download Template Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Need the standard spreadsheet format?
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {sampleDescription || 'Download our pre-formatted sample template with columns.'}
              </div>
            </div>
            <button
              type="button"
              onClick={onDownloadTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#E34234] bg-white dark:bg-slate-900 border border-[#E34234]/30 rounded-lg hover:bg-[#E34234]/5 shadow-xs transition-colors shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{templateName || 'Download Template'}</span>
            </button>
          </div>

          {/* Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-[#E34234] dark:hover:border-[#E34234] rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-900/40"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv,text/csv,text/plain"
              className="hidden"
            />
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 mx-auto flex items-center justify-center mb-3">
              <Upload className="w-6 h-6 text-[#E34234]" />
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {file ? file.name : 'Click to select CSV file from your computer'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports .csv exported from Microsoft Excel, Google Sheets, or Apple Numbers
            </p>
          </div>

          {/* Errors List */}
          {errors.length > 0 && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-red-700 dark:text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Found {errors.length} issue(s):</span>
              </div>
              <ul className="text-xs text-red-600 dark:text-red-300 list-disc list-inside max-h-24 overflow-y-auto pl-1">
                {errors.slice(0, 5).map((e, idx) => (
                  <li key={idx}>{e}</li>
                ))}
                {errors.length > 5 && <li>...and {errors.length - 5} more issues</li>}
              </ul>
            </div>
          )}

          {/* Status message */}
          {statusMessage && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Preview Table */}
          {validRows.length > 0 && (
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                <span className="flex items-center gap-1.5">
                  <Table className="w-3.5 h-3.5 text-slate-400" />
                  Preview: Ready to import {validRows.length} valid row(s)
                </span>
                <span className="text-emerald-600 font-semibold font-mono">
                  {validRows.length} passed / {parsedRows.length} total
                </span>
              </div>
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-x-auto max-h-48 text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 text-slate-600 dark:text-slate-300 font-semibold">
                    <tr>
                      {columns?.map((c, i) => (
                        <th key={i} className="py-2 px-3 whitespace-nowrap">
                          {c.header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {validRows.slice(0, 8).map((r, rowIdx) => (
                      <tr key={rowIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        {columns?.map((c, colIdx) => (
                          <td key={colIdx} className="py-2 px-3 whitespace-nowrap truncate max-w-xs">
                            {r[c.key] || '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={importing}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExecuteImport}
            disabled={importing || validRows.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#E34234] hover:bg-[#CB3528] rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            {importing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Importing...</span>
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                <span>Confirm & Import {validRows.length} Record(s)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImportModal;
