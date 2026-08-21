"use client";

import React, { useState, useEffect } from 'react';
import { 
  Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Clock, MapPin, Users, X, CheckCircle2, ChevronDown
} from 'lucide-react';

interface EventItem {
  id: string;
  title: string;
  dayIndex: number; // 0 = Domingo, 1 = Segunda, etc.
  startHour: number; // ex: 10
  startMinute: number; // ex: 30
  durationMinutes: number; // ex: 60
  color: string;
}

interface Props {
  user: {
    name: string;
    email: string;
    initials: string;
  };
}

export function CalendarView({ user }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'weekly' | 'daily' | 'monthly'>('weekly');
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState(0);

  // Form states
  const [newTitle, setNewTitle] = useState("");
  const [newDay, setNewDay] = useState(1); // Segunda-feira default
  const [newStartHour, setNewStartHour] = useState(10);
  const [newDuration, setNewDuration] = useState(60);

  const [events, setEvents] = useState<EventItem[]>([
    { id: '1', title: 'Reunião de Estratégia RapiEmail', dayIndex: 1, startHour: 10, startMinute: 0, durationMinutes: 60, color: 'from-indigo-600 to-indigo-700' },
    { id: '2', title: 'Alinhamento com Clientes B2B', dayIndex: 3, startHour: 14, startMinute: 30, durationMinutes: 90, color: 'from-purple-600 to-purple-700' },
    { id: '3', title: 'Lançamento do Domínio rapimoneyit.online', dayIndex: 4, startHour: 16, startMinute: 0, durationMinutes: 60, color: 'from-emerald-600 to-emerald-700' },
  ]);

  // Update real-time red line
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeMinutes(now.getHours() * 60 + now.getMinutes());
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const daysOfWeek = [
    { name: 'domingo', num: 16 },
    { name: 'segunda', num: 17 },
    { name: 'terça', num: 18 },
    { name: 'quarta', num: 19 },
    { name: 'quinta', num: 20 },
    { name: 'sexta', num: 21 },
    { name: 'sábado', num: 22 },
  ];

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setEvents([
      ...events,
      {
        id: Date.now().toString(),
        title: newTitle,
        dayIndex: Number(newDay),
        startHour: Number(newStartHour),
        startMinute: 0,
        durationMinutes: Number(newDuration),
        color: 'from-indigo-600 to-indigo-700'
      }
    ]);

    setNewTitle("");
    setIsEventModalOpen(false);
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-[#09090b]">
      
      {/* 1. LEFT MINI-CALENDAR SIDEBAR */}
      <aside className="w-[240px] border-r border-white/5 bg-[#0b0b0e] flex flex-col flex-shrink-0 p-3 space-y-4">
        
        {/* Create Event Button */}
        <button 
          onClick={() => setIsEventModalOpen(true)}
          className="w-full flex items-center justify-center gap-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white py-2.5 px-4 rounded-xl font-semibold text-xs shadow-lg shadow-indigo-600/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Criar Evento</span>
        </button>

        {/* Mini Calendar Card */}
        <div className="p-3 bg-[#121216] border border-white/5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">Agosto 2026</span>
            <div className="flex items-center gap-1 text-zinc-400">
              <button className="p-1 hover:text-white rounded"><ChevronLeft className="w-3.5 h-3.5" /></button>
              <button className="p-1 hover:text-white rounded"><ChevronRight className="w-3.5 h-3.5" /></button>
            </div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px]">
            <span className="text-zinc-500 font-bold">D</span>
            <span className="text-zinc-500 font-bold">S</span>
            <span className="text-zinc-500 font-bold">T</span>
            <span className="text-zinc-500 font-bold">Q</span>
            <span className="text-zinc-500 font-bold">Q</span>
            <span className="text-zinc-500 font-bold">S</span>
            <span className="text-zinc-500 font-bold">S</span>

            {/* Dates */}
            <span className="text-zinc-600 p-1">26</span>
            <span className="text-zinc-600 p-1">27</span>
            <span className="text-zinc-600 p-1">28</span>
            <span className="text-zinc-600 p-1">29</span>
            <span className="text-zinc-600 p-1">30</span>
            <span className="text-zinc-600 p-1">31</span>
            <span className="text-zinc-300 p-1">1</span>
            
            <span className="text-zinc-300 p-1">2</span>
            <span className="text-zinc-300 p-1">3</span>
            <span className="text-zinc-300 p-1">4</span>
            <span className="text-zinc-300 p-1">5</span>
            <span className="text-zinc-300 p-1">6</span>
            <span className="text-zinc-300 p-1">7</span>
            <span className="text-zinc-300 p-1">8</span>

            <span className="text-zinc-300 p-1">9</span>
            <span className="text-zinc-300 p-1">10</span>
            <span className="text-zinc-300 p-1">11</span>
            <span className="text-zinc-300 p-1">12</span>
            <span className="text-zinc-300 p-1">13</span>
            <span className="text-zinc-300 p-1">14</span>
            <span className="text-zinc-300 p-1">15</span>

            {/* Current day highlighted */}
            <span className="bg-indigo-600 text-white font-bold rounded-lg p-1">16</span>
            <span className="text-zinc-300 p-1">17</span>
            <span className="text-zinc-300 p-1">18</span>
            <span className="text-zinc-300 p-1">19</span>
            <span className="text-zinc-300 p-1">20</span>
            <span className="text-zinc-300 p-1">21</span>
            <span className="text-zinc-300 p-1">22</span>
          </div>
        </div>

        {/* Calendars List */}
        <div className="flex-1 space-y-2 pt-2">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Calendários</span>
          <div className="flex items-center gap-2 text-xs text-zinc-300 p-2 rounded-xl bg-white/5 border border-white/5">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
            <span className="font-medium">Calendário Principal</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-400 p-2 rounded-xl hover:bg-white/[0.03]">
            <div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div>
            <span>Reuniões da Empresa</span>
          </div>
        </div>

      </aside>

      {/* 2. MAIN CALENDAR WORKSPACE */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Calendar Header Navigation */}
        <header className="h-12 border-b border-white/5 px-6 flex items-center justify-between bg-[#0e0e11]/40 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold rounded-lg transition-colors border border-white/5"
            >
              Hoje
            </button>
            <div className="flex items-center gap-1 text-zinc-400">
              <button className="p-1.5 hover:text-white rounded-lg hover:bg-white/5"><ChevronLeft className="w-4 h-4" /></button>
              <button className="p-1.5 hover:text-white rounded-lg hover:bg-white/5"><ChevronRight className="w-4 h-4" /></button>
            </div>
            <h2 className="text-sm font-bold text-white tracking-tight">Agosto 2026</h2>
          </div>

          {/* View Mode Selector */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white/5 border border-white/5 rounded-lg p-0.5 text-xs">
              <button 
                onClick={() => setViewMode('weekly')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  viewMode === 'weekly' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Semanalmente
              </button>
              <button 
                onClick={() => setViewMode('monthly')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  viewMode === 'monthly' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Mensalmente
              </button>
            </div>
          </div>
        </header>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-y-auto relative">
          
          {/* Days Header */}
          <div className="grid grid-cols-8 border-b border-white/5 sticky top-0 bg-[#09090b] z-10 text-xs">
            <div className="p-3 text-center text-zinc-600 border-r border-white/5 w-16">
              GMT+1
            </div>
            {daysOfWeek.map((day, idx) => {
              const isToday = idx === 0; // Domingo 16
              return (
                <div 
                  key={day.name} 
                  className={`p-3 text-center border-r border-white/5 last:border-r-0 ${
                    isToday ? 'bg-indigo-600/10 font-bold' : ''
                  }`}
                >
                  <span className="text-zinc-500 capitalize text-[11px] block">{day.name}</span>
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs mt-0.5 ${
                    isToday ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30' : 'text-zinc-300 font-semibold'
                  }`}>
                    {day.num}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Hourly Timeline Grid */}
          <div className="relative">
            
            {/* Real-time Red Current-Time Line */}
            <div 
              className="absolute left-16 right-0 z-20 pointer-events-none flex items-center"
              style={{ top: `${(currentTimeMinutes / 60) * 60}px` }}
            >
              <div className="w-2 h-2 rounded-full bg-red-500 -ml-1"></div>
              <div className="h-[2px] bg-red-500 flex-1 opacity-80 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
            </div>

            {hours.map((hour) => (
              <div key={hour} className="grid grid-cols-8 border-b border-white/[0.04] h-[60px] relative">
                {/* Hour Label */}
                <div className="w-16 text-[10px] text-zinc-500 font-mono pr-3 pt-1 text-right border-r border-white/5">
                  {hour.toString().padStart(2, '0')}:00
                </div>

                {/* 7 Days Columns */}
                {daysOfWeek.map((day, dayIdx) => (
                  <div 
                    key={dayIdx} 
                    onClick={() => {
                      setNewDay(dayIdx);
                      setNewStartHour(hour);
                      setIsEventModalOpen(true);
                    }}
                    className="border-r border-white/[0.03] last:border-r-0 hover:bg-white/[0.02] transition-colors cursor-pointer relative"
                  >
                    {/* Render Events */}
                    {events
                      .filter(ev => ev.dayIndex === dayIdx && ev.startHour === hour)
                      .map(ev => (
                        <div
                          key={ev.id}
                          onClick={(e) => { e.stopPropagation(); alert(`Evento: ${ev.title}`); }}
                          className={`absolute inset-x-1 top-1 bg-gradient-to-r ${ev.color} p-2 rounded-xl text-white text-xs font-semibold shadow-lg shadow-black/50 z-10 overflow-hidden border border-white/10 hover:scale-[1.02] transition-transform`}
                          style={{ height: `${(ev.durationMinutes / 60) * 56}px` }}
                        >
                          <p className="truncate text-[11px] leading-tight font-bold">{ev.title}</p>
                          <p className="text-[9px] opacity-80 mt-0.5">{ev.startHour}:00 - {ev.startHour + Math.ceil(ev.durationMinutes / 60)}:00</p>
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            ))}
          </div>

        </div>

      </main>

      {/* Modal: Create Event */}
      {isEventModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[#121216] border border-white/10 rounded-3xl p-6 max-w-md w-full space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Novo Evento / Reunião</h3>
              </div>
              <button onClick={() => setIsEventModalOpen(false)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-zinc-400 block mb-1.5">Título do Evento</label>
                <input 
                  type="text" 
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="ex: Reunião com Fornecedor, Demo RapiEmail..."
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-indigo-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-zinc-400 block mb-1.5">Dia</label>
                  <select 
                    value={newDay}
                    onChange={e => setNewDay(Number(e.target.value))}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-indigo-500 outline-none"
                  >
                    {daysOfWeek.map((d, idx) => (
                      <option key={idx} value={idx}>{d.name} ({d.num})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-400 block mb-1.5">Hora de Início</label>
                  <select 
                    value={newStartHour}
                    onChange={e => setNewStartHour(Number(e.target.value))}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-indigo-500 outline-none font-mono"
                  >
                    {hours.map(h => (
                      <option key={h} value={h}>{h.toString().padStart(2, '0')}:00</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsEventModalOpen(false)} className="px-4 py-2 text-xs text-zinc-400 hover:text-white">Cancelar</button>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20">
                  Agendar Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
