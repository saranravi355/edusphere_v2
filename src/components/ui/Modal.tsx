"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface ModalProps {
  buttonText: string;
  buttonIcon?: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ buttonText, buttonIcon, title, children }: ModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
      >
        {buttonIcon}
        {buttonText}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h3 className="font-bold text-lg text-navy-900 dark:text-slate-100">{title}</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              {children}
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
              <button 
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  alert("Data successfully submitted!");
                  setIsOpen(false);
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
