import React, { useState } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  title: string;
  onClose: () => void;
  onSubmit: (data: any) => void;
  fields: Array<{ name: string; label: string; placeholder: string; type?: string }>;
}

const Modal: React.FC<ModalProps> = ({ title, onClose, onSubmit, fields }) => {
  const [formData, setFormData] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white/70 backdrop-blur-2xl border border-white/50 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200/30">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-black/5 transition-colors text-gray-500">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {fields.map((field) => (
            <div key={field.name}>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                {field.label}
              </label>
              <input
                type={field.type || 'text'}
                name={field.name}
                placeholder={field.placeholder}
                required
                autoFocus={field.name === fields[0].name}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/50 border border-transparent focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 rounded-xl outline-none transition-all placeholder:text-gray-400 text-gray-800"
              />
            </div>
          ))}
          
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-gray-600 font-medium hover:bg-black/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold shadow-lg shadow-blue-500/30 transition-all active:scale-95"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Modal;