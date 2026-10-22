/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, Building2, User, Phone, ShieldCheck, X, Globe } from 'lucide-react';
import { SupportClient } from '../../types';

interface SearchableClientDropdownProps {
  clients: SupportClient[];
  selectedClientId: string;
  onSelectClient: (clientId: string) => void;
  isUrdu?: boolean;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

export const SearchableClientDropdown: React.FC<SearchableClientDropdownProps> = ({
  clients,
  selectedClientId,
  onSelectClient,
  isUrdu = false,
  disabled = false,
  required = false,
  placeholder,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId),
    [clients, selectedClientId]
  );

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Filter clients dynamically based on query
  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;
    const query = searchQuery.toLowerCase().trim();
    return clients.filter((c) => {
      const name = (c.name || '').toLowerCase();
      const company = (c.company || '').toLowerCase();
      const phone = (c.phone || '').toLowerCase();
      const teId = (c.teId || '').toLowerCase();
      const email = (c.email || '').toLowerCase();
      return (
        name.includes(query) ||
        company.includes(query) ||
        phone.includes(query) ||
        teId.includes(query) ||
        email.includes(query)
      );
    });
  }, [clients, searchQuery]);

  const handleSelect = (clientId: string) => {
    onSelectClient(clientId);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectClient('');
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Dropdown trigger trigger button */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-expanded={isOpen}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
            e.preventDefault();
            setIsOpen(!isOpen);
          } else if (e.key === 'Escape') {
            setIsOpen(false);
          }
        }}
        className={`w-full rounded-xl border p-3 text-xs font-semibold flex items-center justify-between gap-2 transition-all cursor-pointer select-none shadow-2xs ${
          isOpen
            ? 'border-md-primary ring-1 ring-md-primary bg-md-surface'
            : 'border-md-surface-variant bg-md-surface-container-low hover:border-md-outline/40'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Building2 size={15} className="text-md-primary shrink-0" />
          {selectedClient ? (
            <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
              <span className="font-bold text-md-on-surface truncate">
                {selectedClient.company || selectedClient.name}
              </span>
              {selectedClient.teId && (
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-md-primary/10 text-md-primary border border-md-primary/20 shrink-0">
                  {selectedClient.teId}
                </span>
              )}
              {selectedClient.name && selectedClient.company && selectedClient.name !== selectedClient.company && (
                <span className="text-[10px] text-md-outline truncate hidden sm:inline">
                  ({selectedClient.name})
                </span>
              )}
            </div>
          ) : (
            <span className="text-md-outline font-normal truncate">
              {placeholder || (isUrdu ? 'سپورٹ کلائنٹ تلاش و منتخب کریں...' : 'Search & select support client...')}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {selectedClient && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-full text-md-outline hover:text-md-on-surface hover:bg-md-surface-variant/40 transition cursor-pointer"
              title={isUrdu ? 'انتخاب ختم کریں' : 'Clear selection'}
            >
              <X size={12} />
            </button>
          )}
          <ChevronDown
            size={14}
            className={`text-md-outline transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {/* Hidden input for HTML5 form validation if required */}
      {required && (
        <input
          type="text"
          value={selectedClientId}
          onChange={() => {}}
          required={required}
          className="opacity-0 absolute -z-10 h-0 w-0 pointer-events-none"
          tabIndex={-1}
        />
      )}

      {/* Dropdown Popover with Search Filter */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-md-surface border border-md-surface-variant rounded-2xl shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
          {/* Search Box Header */}
          <div className="p-2.5 border-b border-md-surface-variant bg-md-surface-container-low">
            <div className="relative">
              <Search
                size={14}
                className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 text-md-outline"
              />
              <input
                ref={searchInputRef}
                type="text"
                placeholder={isUrdu ? 'کلائنٹ کا نام، کمپنی، فون، یا TE کوڈ سے تلاش کریں...' : 'Search by client name, company, phone or TE ID...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setIsOpen(false);
                  if (e.key === 'Enter' && filteredClients.length > 0) {
                    e.preventDefault();
                    handleSelect(filteredClients[0].id);
                  }
                }}
                className="w-full ltr:pl-8.5 rtl:pr-8.5 ltr:pr-7 rtl:pl-7 py-2 text-xs bg-md-surface border border-md-surface-variant rounded-xl text-md-on-surface placeholder-md-outline/65 focus:outline-hidden focus:ring-1 focus:ring-md-primary"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute ltr:right-2 rtl:left-2 top-1/2 -translate-y-1/2 p-1 text-md-outline hover:text-md-on-surface"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between text-[10px] text-md-outline font-mono mt-1.5 px-1">
              <span>{isUrdu ? `کل ${clients.length} کلائنٹس` : `Total ${clients.length} Clients`}</span>
              <span>{isUrdu ? `${filteredClients.length} مل گئے` : `${filteredClients.length} matching`}</span>
            </div>
          </div>

          {/* List of Clients */}
          <div className="max-h-60 overflow-y-auto divide-y divide-md-surface-variant/40 p-1">
            {filteredClients.length === 0 ? (
              <div className="py-6 px-4 text-center text-xs text-md-outline space-y-1">
                <p className="font-semibold text-md-on-surface">
                  {isUrdu ? 'کوئی مماثل کلائنٹ نہیں ملا' : 'No clients found'}
                </p>
                <p className="text-[11px] opacity-75">
                  {isUrdu ? `"${searchQuery}" کے لیے کوئی ریکارڈ موجود نہیں ہے` : `No records matching "${searchQuery}"`}
                </p>
              </div>
            ) : (
              filteredClients.map((client) => {
                const isSelected = client.id === selectedClientId;
                return (
                  <div
                    key={client.id}
                    onClick={() => handleSelect(client.id)}
                    className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-3 text-xs select-none ${
                      isSelected
                        ? 'bg-md-primary/10 text-md-primary font-bold'
                        : 'hover:bg-md-surface-variant/40 text-md-on-surface'
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold truncate text-[12px]">
                          {client.company || client.name}
                        </span>
                        {client.teId && (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-400/20">
                            {client.teId}
                          </span>
                        )}
                        {client.status && (
                          <span
                            className={`text-[8px] font-bold px-1.5 py-0.2 rounded-full uppercase ${
                              client.status === 'Critical'
                                ? 'bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300'
                                : client.status === 'Warning'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                            }`}
                          >
                            {client.status}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[10px] text-md-outline font-mono truncate">
                        {client.name && client.company && client.name !== client.company && (
                          <span className="flex items-center gap-1 truncate">
                            <User size={10} />
                            {client.name}
                          </span>
                        )}
                        {client.phone && (
                          <span className="flex items-center gap-1 shrink-0">
                            <Phone size={10} />
                            {client.phone}
                          </span>
                        )}
                      </div>

                      {(client.url || client.deploymentUrl) && (
                        <div className="flex items-center gap-1 text-[9.5px] text-blue-600 dark:text-blue-400 font-mono font-bold truncate">
                          <Globe size={10} className="shrink-0" />
                          <span className="truncate">{client.url || client.deploymentUrl}</span>
                        </div>
                      )}
                    </div>

                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-md-primary text-md-on-primary flex items-center justify-center shrink-0">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
