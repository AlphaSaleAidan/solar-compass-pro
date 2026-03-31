import { useState } from 'react';
import { Calendar, Plus, Star, Clock, MapPin, Phone, Mail, ChevronDown, ChevronUp, Camera, FileText, MessageSquare, ArrowRight } from 'lucide-react';

interface Appointment {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  highBill: number;
  lowBill: number;
  allElectric: boolean;
  stars: number;
  setter: string;
  closer: string | null;
  status: string;
  gotBill: boolean;
  gotContact: boolean;
  bothHomeowners: boolean;
  meterPhoto: boolean;
  billOver250: boolean;
  outcome: string | null;
  closerNotes: string;
  billPhoto: string | null;
  meterPhotoUrl: string | null;
  surveyPhotos: string[];
}

interface CalendarTabProps {
  onConvertToProject?: (data: { name: string; email: string; phone: string; address: string }) => void;
}

const CalendarTab = ({ onConvertToProject }: CalendarTabProps) => {
  const [showNewAppt, setShowNewAppt] = useState(false);
  const [expandedAppt, setExpandedAppt] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', address: '', phone: '', email: '', highBill: '', lowBill: '', allElectric: 'yes', date: '', time: '' });
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newAppt: Appointment = {
      id: Date.now(),
      name: form.name,
      address: form.address,
      phone: form.phone,
      email: form.email,
      date: form.date,
      time: form.time,
      highBill: Number(form.highBill) || 0,
      lowBill: Number(form.lowBill) || 0,
      allElectric: form.allElectric === 'yes',
      stars: 0,
      setter: 'You',
      closer: null,
      status: 'open',
      gotBill: false,
      gotContact: !!(form.phone && form.email),
      bothHomeowners: false,
      meterPhoto: false,
      billOver250: Number(form.highBill) > 250,
      outcome: null,
      closerNotes: '',
      billPhoto: null,
      meterPhotoUrl: null,
      surveyPhotos: [],
    };
    setAppointments(prev => [newAppt, ...prev]);
    setShowNewAppt(false);
    setForm({ name: '', address: '', phone: '', email: '', highBill: '', lowBill: '', allElectric: 'yes', date: '', time: '' });
  };

  const getStarCount = (appt: Appointment) => {
    return [appt.gotBill, appt.gotContact, appt.bothHomeowners, appt.meterPhoto, appt.billOver250].filter(Boolean).length;
  };

  const setOutcome = (apptId: number, outcome: string) => {
    setAppointments(prev => prev.map(a => a.id === apptId ? { ...a, outcome } : a));
  };

  const outcomeColors: Record<string, string> = {
    closed: 'bg-asp-green/15 text-asp-green border-asp-green/30',
    credit_fail: 'bg-asp-yellow/15 text-asp-yellow border-asp-yellow/30',
    no_close: 'bg-asp-blue/15 text-asp-blue border-asp-blue/30',
    no_sit: 'bg-asp-red/15 text-asp-red border-asp-red/30',
  };

  const outcomeLabels: Record<string, string> = {
    closed: 'Closed',
    credit_fail: 'Credit Fail',
    no_close: 'No Close',
    no_sit: 'No Sit',
  };

  // Full month calendar
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return { day, dateStr, appts: appointments.filter(a => a.date === dateStr) };
  });

  const today = now.toISOString().split('T')[0];
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-black text-foreground">Appointment Calendar</h2>
        </div>
        <button
          onClick={() => setShowNewAppt(!showNewAppt)}
          className="px-4 py-2 bg-primary text-primary-foreground text-xs font-extrabold rounded-lg hover:-translate-y-px transition-all flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> New Appointment
        </button>
      </div>

      {/* New Appointment Form */}
      {showNewAppt && (
        <div className="bg-bg2 border border-primary/30 rounded-xl p-5 animate-scale-in">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-black text-foreground">Set New Appointment</h3>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: 'Name', key: 'name', placeholder: 'Customer name' },
                { label: 'Address', key: 'address', placeholder: 'Full address' },
                { label: 'Phone', key: 'phone', placeholder: '(xxx) xxx-xxxx' },
                { label: 'Email', key: 'email', placeholder: 'email@example.com' },
                { label: 'High Bill ($)', key: 'highBill', placeholder: 'e.g. 350' },
                { label: 'Low Bill ($)', key: 'lowBill', placeholder: 'e.g. 120' },
                { label: 'Date', key: 'date', placeholder: 'YYYY-MM-DD' },
                { label: 'Time', key: 'time', placeholder: 'e.g. 2:00 PM' },
              ].map((f) => (
                <div key={f.key}>
                  <label className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase block mb-1">{f.label}</label>
                  <input
                    value={form[f.key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    className="w-full px-3 py-2 bg-bg3 border border-border rounded-md text-sm text-foreground outline-none focus:border-primary placeholder:text-muted-foreground/50"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mb-4">
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <input type="radio" name="elec" checked={form.allElectric === 'yes'} onChange={() => setForm({ ...form, allElectric: 'yes' })} className="accent-teal" />
                All Electric
              </label>
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <input type="radio" name="elec" checked={form.allElectric === 'no'} onChange={() => setForm({ ...form, allElectric: 'no' })} className="accent-teal" />
                Gas + Electric
              </label>
            </div>
            <button type="submit" className="px-6 py-2.5 bg-primary text-primary-foreground text-xs font-extrabold rounded-lg hover:-translate-y-px transition-all">
              Submit Appointment →
            </button>
          </form>
        </div>
      )}

      {/* Appointment Cards */}
      {appointments.length === 0 ? (
        <div className="bg-bg2 border border-border rounded-xl p-12 text-center">
          <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm font-bold">No appointments scheduled</p>
          <p className="text-muted-foreground/60 text-xs mt-1">Click "New Appointment" to schedule your first appointment.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((a) => {
            const starCount = getStarCount(a);
            const isExpanded = expandedAppt === a.id;
            return (
              <div key={a.id} className="bg-bg2 border border-border rounded-xl overflow-hidden">
                <div
                  className="p-4 cursor-pointer hover:bg-bg3/30 transition-colors"
                  onClick={() => setExpandedAppt(isExpanded ? null : a.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 border border-primary/25 rounded-lg px-3 py-2 text-center min-w-[70px]">
                        <div className="text-[10px] text-primary font-bold uppercase">{new Date(a.date + 'T12:00').toLocaleDateString('en-US', { weekday: 'short' })}</div>
                        <div className="text-lg font-black text-primary">{new Date(a.date + 'T12:00').getDate()}</div>
                        <div className="text-[10px] text-primary font-bold">{a.time}</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-foreground">{a.name}</div>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                          <MapPin className="w-3 h-3" /> {a.address}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Phone className="w-3 h-3" /> {a.phone}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Mail className="w-3 h-3" /> {a.email}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="text-xs">
                            <span className="text-asp-red font-bold">${a.highBill}</span>
                            <span className="text-muted-foreground"> / </span>
                            <span className="text-asp-green font-bold">${a.lowBill}</span>
                          </div>
                          <span className="text-[9px] text-muted-foreground px-1.5 py-0.5 bg-bg3 rounded">{a.allElectric ? 'All Electric' : 'Gas + Electric'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < starCount ? 'text-asp-yellow fill-asp-yellow' : 'text-muted-foreground/20'}`} />
                        ))}
                      </div>
                      {a.outcome ? (
                        <span className={`px-2.5 py-1 rounded text-[10px] font-extrabold uppercase border ${outcomeColors[a.outcome]}`}>
                          {outcomeLabels[a.outcome]}
                        </span>
                      ) : (
                        <span className={`px-2.5 py-1 rounded text-[10px] font-extrabold uppercase border ${
                          a.status === 'assigned' ? 'bg-asp-green/15 text-asp-green border-asp-green/30' : 'bg-asp-yellow/15 text-asp-yellow border-asp-yellow/30'
                        }`}>
                          {a.status}
                        </span>
                      )}
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-border pt-3 animate-fade-in-up space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-bg3 rounded-lg p-3">
                        <div className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase mb-2">Attachments</div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Camera className="w-3.5 h-3.5" />
                            <span>Bill Photo: {a.billPhoto ? <span className="text-asp-green">Uploaded</span> : <span className="text-asp-red">Missing</span>}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Camera className="w-3.5 h-3.5" />
                            <span>Meter Photo: {a.meterPhoto ? <span className="text-asp-green">Captured</span> : <span className="text-asp-red">Missing</span>}</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-bg3 rounded-lg p-3">
                        <div className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase mb-2">Disposition</div>
                        <div className="flex flex-wrap gap-1.5">
                          {['closed', 'no_close', 'credit_fail', 'no_sit'].map(o => (
                            <button
                              key={o}
                              onClick={(e) => { e.stopPropagation(); setOutcome(a.id, o); }}
                              className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${
                                a.outcome === o ? outcomeColors[o] : 'bg-bg4 border-border text-muted-foreground hover:border-border2'
                              }`}
                            >
                              {outcomeLabels[o]}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="bg-bg3 rounded-lg p-3">
                        <div className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase mb-2">Notes</div>
                        <textarea
                          placeholder="Add notes..."
                          className="w-full px-2 py-1.5 bg-bg4 border border-border rounded-md text-xs text-foreground outline-none focus:border-primary placeholder:text-muted-foreground/50 resize-none h-12"
                        />
                      </div>
                    </div>
                    {!a.outcome && onConvertToProject && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onConvertToProject({ name: a.name, email: a.email, phone: a.phone, address: a.address });
                        }}
                        className="w-full py-2.5 bg-primary/10 border border-primary/25 rounded-lg text-xs font-bold text-primary hover:bg-primary/20 transition-all flex items-center justify-center gap-2"
                      >
                        <ArrowRight className="w-3.5 h-3.5" /> Convert to Project
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Full Month Calendar View */}
      <div className="bg-bg2 border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-black text-foreground">{monthName} Calendar</h3>
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-1">
          {weekDays.map(d => (
            <div key={d} className="text-[10px] text-muted-foreground font-bold text-center py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="h-20 bg-bg3/30 rounded-md" />
          ))}
          
          {monthDays.map(({ day, dateStr, appts: dayAppts }) => {
            const isToday = dateStr === today;
            return (
              <div
                key={day}
                className={`h-20 rounded-md p-1 overflow-hidden ${
                  isToday ? 'bg-primary/10 border border-primary/30' : 'bg-bg3/50 border border-transparent'
                }`}
              >
                <div className={`text-[10px] font-bold mb-0.5 ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>{day}</div>
                <div className="space-y-0.5">
                  {dayAppts.slice(0, 2).map(a => (
                    <div
                      key={a.id}
                      className="flex items-center gap-1 cursor-pointer hover:opacity-70"
                      onClick={() => setExpandedAppt(expandedAppt === a.id ? null : a.id)}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      <span className="text-[8px] text-foreground truncate font-bold">{a.name}</span>
                    </div>
                  ))}
                  {dayAppts.length > 2 && (
                    <div className="text-[8px] text-muted-foreground text-center">+{dayAppts.length - 2} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CalendarTab;
