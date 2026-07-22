import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Eye, Mail, MessageSquare } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';

export const ContactMessagesPage: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMsg, setSelectedMsg] = useState<any | null>(null);

  const loadMessages = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setMessages(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ status: 'read' })
        .eq('id', id);

      if (error) throw error;
      loadMessages();
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'read': return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'replied': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Nama Pengirim',
      render: (row: any) => <span className="font-bold text-slate-800">{row.name}</span>,
    },
    {
      key: 'email',
      header: 'Email',
      render: (row: any) => <a href={`mailto:${row.email}`} className="text-brand-green-800 hover:underline">{row.email}</a>,
    },
    {
      key: 'subject',
      header: 'Subjek Pesan',
      render: (row: any) => <span className="font-semibold text-slate-600">{row.subject}</span>,
    },
    {
      key: 'created_at',
      header: 'Tanggal Diterima',
      render: (row: any) => <span className="font-mono text-xs">{new Date(row.created_at).toLocaleString('id-ID')}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: any) => (
        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getStatusColor(row.status)}`}>
          {row.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (row: any) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedMsg(row);
            if (row.status === 'new') handleMarkAsRead(row.id);
          }}
          className="p-1.5 text-slate-500 hover:text-brand-green-900 border-slate-200"
        >
          <Eye className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-brand-green-950 font-serif">Pesan Masuk Website</h2>
        <p className="text-xs text-slate-500 mt-0.5">Lihat dan kelola pesan yang dikirim oleh pengunjung melalui formulir kontak publik.</p>
      </div>

      <DataTable
        columns={columns}
        data={messages}
        emptyMessage="Tidak ada pesan masuk."
        isLoading={isLoading}
      />

      <Modal isOpen={!!selectedMsg} onClose={() => setSelectedMsg(null)} title={`Pesan dari ${selectedMsg?.name}`}>
        {selectedMsg && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div>
                <p className="text-xs font-bold text-slate-400">Email</p>
                <a href={`mailto:${selectedMsg.email}`} className="text-sm font-semibold text-brand-green-900">{selectedMsg.email}</a>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400">Telepon</p>
                <p className="text-sm font-semibold text-slate-700">{selectedMsg.phone || '-'}</p>
              </div>
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-800">{selectedMsg.subject}</h4>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{selectedMsg.message}</p>
            </div>
            <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedMsg(null)} className="rounded-xl text-xs font-semibold">Tutup</Button>
              <a href={`mailto:${selectedMsg.email}?subject=Re: ${selectedMsg.subject}`} className="bg-brand-green-900 hover:bg-brand-green-800 text-white font-bold rounded-xl px-4 py-2 text-xs flex items-center gap-1.5">
                <Mail className="w-4 h-4" /> Balas via Email
              </a>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
