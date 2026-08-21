"use client";

import React, { useState } from 'react';
import { UserPlus, Search, Mail, Phone, Building, Star, MoreHorizontal, Trash2, Edit3, X } from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  starred: boolean;
}

interface Props {
  user: {
    name: string;
    email: string;
    initials: string;
  };
}

export function ContactsView({ user }: Props) {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([
    { id: '1', name: 'Edson Pereira', email: 'edson@rapimoneyit.online', phone: '+351 912 345 678', company: 'RapiMoney IT', role: 'CEO & Fundador', starred: true },
    { id: '2', name: 'Marco Rei', email: 'marco@marcorei.com', phone: '+351 923 456 789', company: 'Rei Enterprises', role: 'Diretor Geral', starred: true },
    { id: '3', name: 'Suporte Técnico', email: 'support@rapiemail.com', phone: '+351 210 000 000', company: 'RapiEmail HQ', role: 'Suporte 24/7', starred: false },
  ]);

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newRole, setNewRole] = useState("");

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) return;

    setContacts([
      ...contacts,
      {
        id: Date.now().toString(),
        name: newName,
        email: newEmail,
        phone: newPhone || "+351 --- --- ---",
        company: newCompany || "Empresa",
        role: newRole || "Contacto",
        starred: false
      }
    ]);

    setNewName("");
    setNewEmail("");
    setNewPhone("");
    setNewCompany("");
    setNewRole("");
    setIsModalOpen(false);
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.company.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#09090b]">
      
      {/* Top Action Bar */}
      <div className="h-14 border-b border-white/5 px-6 flex items-center justify-between bg-[#0e0e11]/40">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-bold text-white tracking-tight">Livro de Contactos</h2>
          <span className="text-xs text-zinc-500 font-mono">({filteredContacts.length} contactos)</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              value={search}
              onChange={e => setSearch}
              placeholder="Pesquisar contactos..."
              className="bg-white/5 border border-white/10 rounded-xl py-1.5 pl-8 pr-3 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Adicionar Contacto</span>
          </button>
        </div>
      </div>

      {/* Contacts Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.map(contact => (
            <div 
              key={contact.id}
              className="p-4 rounded-2xl bg-[#0e0e11] border border-white/5 hover:border-indigo-500/30 transition-all space-y-3 group shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 border border-indigo-400/30 flex items-center justify-center font-bold text-xs text-white shadow-md">
                    {contact.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">{contact.name}</h3>
                    <p className="text-[11px] text-zinc-400">{contact.role} · {contact.company}</p>
                  </div>
                </div>
                <button className="text-zinc-500 hover:text-yellow-400">
                  <Star className={`w-4 h-4 ${contact.starred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                </button>
              </div>

              <div className="pt-2 border-t border-white/5 space-y-1.5 text-xs text-zinc-400">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="font-mono text-[11px]">{contact.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="font-mono text-[11px]">{contact.phone}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Contact Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[#121216] border border-white/10 rounded-3xl p-6 max-w-md w-full space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h3 className="text-base font-bold text-white">Criar Novo Contacto</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddContact} className="space-y-4">
              <input 
                type="text" 
                placeholder="Nome Completo" 
                value={newName} 
                onChange={e => setNewName(e.target.value)} 
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-indigo-500 outline-none" 
                required 
              />
              <input 
                type="email" 
                placeholder="Endereço de Email" 
                value={newEmail} 
                onChange={e => setNewEmail(e.target.value)} 
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-indigo-500 outline-none" 
                required 
              />
              <input 
                type="text" 
                placeholder="Telemóvel / Telefone" 
                value={newPhone} 
                onChange={e => setNewPhone(e.target.value)} 
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-indigo-500 outline-none" 
              />
              <div className="grid grid-cols-2 gap-3">
                <input 
                  type="text" 
                  placeholder="Empresa" 
                  value={newCompany} 
                  onChange={e => setNewCompany(e.target.value)} 
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-indigo-500 outline-none" 
                />
                <input 
                  type="text" 
                  placeholder="Cargo" 
                  value={newRole} 
                  onChange={e => setNewRole(e.target.value)} 
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-indigo-500 outline-none" 
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs text-zinc-400 hover:text-white">Cancelar</button>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20">
                  Guardar Contacto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
