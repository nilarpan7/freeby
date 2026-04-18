'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, User, MessageSquare, Phone, Paperclip, FileText, Loader2 } from 'lucide-react';
import { chatApi } from '@/lib/api';
import { supabase } from '@/lib/supabase';

interface Message {
  id: string;
  task_id: string;
  sender_id: string;
  message_text: string;
  is_system_message: boolean;
  created_at: string;
  sender_name?: string;
}

interface TaskChatProps {
  taskId: string;
  currentUserId: string;
  currentUserRole: string; // 'client' or 'student'
  clientName: string;
  assigneeName?: string;
}

export default function TaskChat({ taskId, currentUserId, currentUserRole, clientName, assigneeName }: TaskChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMessages();

    // Polling fallback to guarantee it's dynamic even if realtime fails
    const pollInterval = setInterval(() => {
      loadMessages();
    }, 3000);

    // Subscribe to new messages via Realtime
    const channel = supabase
      .channel(`task_chat_${taskId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'task_messages', filter: `task_id=eq.${taskId}` },
        (payload) => {
          setMessages(prev => {
            if (prev.find(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new as Message];
          });
        }
      )
      .subscribe();

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [taskId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const data = await chatApi.getMessages(taskId);
      setMessages(data);
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || sending) return;

    const tempText = inputText;
    setInputText('');
    setSending(true);

    try {
      await chatApi.sendMessage(taskId, currentUserId, tempText);
      await loadMessages(); // Force immediate refresh
    } catch (err) {
      console.error("Failed to send message:", err);
      setInputText(tempText);
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      // We will encode small files as data URLs for simplicity without needing a new bucket,
      // or mock it if it's too large, just to demonstrate the functionality.
      if (file.size > 2 * 1024 * 1024) {
        alert("File too large. Max 2MB.");
        return;
      }
      
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        // Send a message containing a link or identifier
        const msgText = `📎 Attached Document: ${file.name}\n${base64}`;
        await chatApi.sendMessage(taskId, currentUserId, msgText);
        await loadMessages();
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Upload failed", error);
      alert("Failed to upload document");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleCall = () => {
    // Generate a unique jitsi meet link for this task
    const meetUrl = `https://meet.jit.si/KramicTask_${taskId.replace(/-/g, '')}`;
    window.open(meetUrl, '_blank');
  };

  const renderMessageContent = (text: string) => {
    if (text.startsWith('📎 Attached Document:')) {
      const lines = text.split('\n');
      const fileName = lines[0].replace('📎 Attached Document: ', '');
      const dataUrl = lines[1];
      
      return (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 bg-black/5 p-2 rounded border border-black/10">
            <FileText size={16} />
            <span className="font-bold text-sm truncate">{fileName}</span>
          </div>
          {dataUrl?.startsWith('data:image/') && (
            <img src={dataUrl} alt="attachment" className="max-w-[200px] rounded border-2 border-black" />
          )}
          {!dataUrl?.startsWith('data:image/') && (
            <a href={dataUrl} download={fileName} className="text-blue-600 text-xs font-bold hover:underline">
              Download File
            </a>
          )}
        </div>
      );
    }
    return <p className="whitespace-pre-wrap text-sm break-words">{text}</p>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border-4 border-black flex flex-col h-[500px]"
      style={{ filter: "url(#rough-paper)" }}
    >
      <div className="bg-black text-white p-4 font-black flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare size={20} />
          Task Workspace Chat
        </div>
        <button 
          onClick={handleCall}
          className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded text-sm transition-colors"
        >
          <Phone size={16} />
          Start Call
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400 font-medium">
            No messages yet. Say hello!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-2 mb-1 text-xs font-bold text-gray-500">
                  {isMe ? 'You' : (msg.sender_name || 'User')}
                  <span className="font-normal text-gray-400">{formatTime(msg.created_at)}</span>
                </div>
                <div 
                  className={`px-4 py-2 border-2 border-black max-w-[80%] ${
                    isMe 
                      ? 'bg-amber-100 rounded-tl-xl rounded-tr-xl rounded-bl-xl rounded-br-none' 
                      : 'bg-white rounded-tl-xl rounded-tr-xl rounded-br-xl rounded-bl-none'
                  }`}
                >
                  {renderMessageContent(msg.message_text)}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t-2 border-black bg-white">
        <form onSubmit={handleSend} className="flex gap-2 items-center">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="p-2.5 bg-gray-100 border-2 border-black rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
            title="Attach Document"
          >
            {uploading ? <Loader2 size={20} className="animate-spin text-gray-500" /> : <Paperclip size={20} className="text-gray-700" />}
          </button>
          
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            disabled={sending || uploading}
            className="flex-1 bg-white border-2 border-black rounded-lg px-4 py-2 font-medium focus:outline-none focus:shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={sending || uploading || !inputText.trim()}
            className="p-2.5 bg-amber-400 border-2 border-black rounded-lg hover:bg-amber-500 disabled:opacity-50 transition-colors flex items-center justify-center text-black"
          >
            {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </form>
      </div>
    </motion.div>
  );
}
