'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesApi, Message, StaffUser, MessageStats } from '@/lib/messages';
import { useAuthStore } from '@/lib/auth-store';
import { 
  Inbox, 
  Send, 
  Archive, 
  Plus, 
  X, 
  Reply, 
  Trash2,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';

type TabType = 'inbox' | 'sent' | 'archived';

export default function MessagesPage() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('inbox');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showCompose, setShowCompose] = useState(false);

  // Compose form state
  const [composeData, setComposeData] = useState({
    recipient_id: '',
    subject: '',
    message_body: '',
    priority: 'Normal' as const,
  });

  // Reply form state
  const [replyBody, setReplyBody] = useState('');

  // Fetch messages with 15-second polling
  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', activeTab],
    queryFn: async () => {
      return activeTab === 'inbox' 
        ? await messagesApi.getInbox()
        : await messagesApi.getSent();
    },
    enabled: !!user,
    refetchInterval: 15000, // Poll every 15 seconds
    refetchIntervalInBackground: false, // Stop polling when tab is inactive
  });

  const messages = messagesData?.messages || [];

  // Fetch message stats with 30-second polling
  const { data: stats } = useQuery({
    queryKey: ['message-stats'],
    queryFn: messagesApi.getStats,
    enabled: !!user,
    refetchInterval: 30000, // Poll every 30 seconds
    refetchIntervalInBackground: false,
  });

  // Fetch staff users (no polling needed)
  const { data: staffUsersData } = useQuery({
    queryKey: ['staff-users'],
    queryFn: messagesApi.getStaffUsers,
    enabled: !!user,
  });

  const staffUsers = staffUsersData?.filter(u => u.id !== user?.id) || [];

  // Fetch thread messages when message is selected
  const { data: threadData } = useQuery({
    queryKey: ['thread', selectedMessage?.thread_id],
    queryFn: () => messagesApi.getThread(selectedMessage!.thread_id!),
    enabled: !!selectedMessage?.thread_id,
  });

  const threadMessages = threadData?.messages || (selectedMessage ? [selectedMessage] : []);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: messagesApi.send,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['message-stats'] });
      setShowCompose(false);
      setComposeData({
        recipient_id: '',
        subject: '',
        message_body: '',
        priority: 'Normal',
      });
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
      alert('Failed to send message');
    },
  });

  // Reply mutation
  const replyMutation = useMutation({
    mutationFn: ({ messageId, body }: { messageId: string; body: string }) =>
      messagesApi.reply(messageId, { message_body: body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['thread'] });
      setReplyBody('');
    },
    onError: (error) => {
      console.error('Failed to send reply:', error);
      alert('Failed to send reply');
    },
  });

  // Mark as read mutation
  const markReadMutation = useMutation({
    mutationFn: messagesApi.markRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['message-stats'] });
    },
  });

  // Archive mutation
  const archiveMutation = useMutation({
    mutationFn: messagesApi.archive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['message-stats'] });
      setSelectedMessage(null);
    },
  });

  // Load thread and mark as read
  const loadThread = (message: Message) => {
    setSelectedMessage(message);
    if (!message.is_read) {
      markReadMutation.mutate([message.id]);
    }
  };

  const handleSendMessage = () => {
    if (!composeData.recipient_id || !composeData.subject || !composeData.message_body) {
      alert('Please fill in all required fields');
      return;
    }
    sendMessageMutation.mutate(composeData);
  };

  const handleReply = () => {
    if (!selectedMessage || !replyBody.trim()) {
      alert('Please enter a reply');
      return;
    }
    replyMutation.mutate({
      messageId: selectedMessage.id,
      body: replyBody,
    });
  };

  const handleArchive = (messageIds: string[]) => {
    archiveMutation.mutate(messageIds);
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'Urgent': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'High': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'Low': return <Info className="h-4 w-4 text-blue-500" />;
      default: return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'SYS';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Messages</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {stats && `${stats.unread_messages} unread messages`}
          </p>
        </div>
        <button
          onClick={() => setShowCompose(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#5b21b6] text-white rounded-lg hover:bg-[#4c1d95] transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Message
        </button>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col">
          {/* Tabs */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="space-y-1">
              <button
                onClick={() => {
                  setActiveTab('inbox');
                  setSelectedMessage(null);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                  activeTab === 'inbox'
                    ? 'bg-[#5b21b6] text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Inbox className="h-5 w-5" />
                <span className="flex-1 text-left font-medium">Inbox</span>
                {stats && stats.unread_messages > 0 && (
                  <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    {stats.unread_messages}
                  </span>
                )}
              </button>
              <button
                onClick={() => {
                  setActiveTab('sent');
                  setSelectedMessage(null);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                  activeTab === 'sent'
                    ? 'bg-[#5b21b6] text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Send className="h-5 w-5" />
                <span className="flex-1 text-left font-medium">Sent</span>
              </button>
            </div>
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto">
            {messagesLoading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : messages.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No messages</div>
            ) : (
              messages.map((message) => (
                <button
                  key={message.id}
                  onClick={() => loadThread(message)}
                  className={`w-full p-4 text-left border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                    selectedMessage?.id === message.id ? 'bg-gray-50 dark:bg-gray-800' : ''
                  } ${!message.is_read ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                      {getInitials(message.sender_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className={`text-sm truncate ${!message.is_read ? 'font-bold' : 'font-medium'} text-gray-900 dark:text-white`}>
                          {message.sender_name || 'System'}
                        </p>
                        {getPriorityIcon(message.priority)}
                      </div>
                      <p className={`text-sm truncate ${!message.is_read ? 'font-semibold' : ''} text-gray-700 dark:text-gray-300`}>
                        {message.subject}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                        {message.message_body}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatTimeAgo(message.created_at)}
                      </p>
                    </div>
                    {!message.is_read && (
                      <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Message View */}
        <div className="flex-1 bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col">
          {selectedMessage ? (
            <>
              {/* Message Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                      {getInitials(selectedMessage.sender_name)}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {selectedMessage.subject}
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          From: {selectedMessage.sender_name || 'System'}
                        </p>
                        {getPriorityIcon(selectedMessage.priority)}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(selectedMessage.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleArchive([selectedMessage.id])}
                      className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                      title="Archive"
                    >
                      <Archive className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setSelectedMessage(null)}
                      className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Thread Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {threadMessages.map((msg) => (
                  <div key={msg.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-xs">
                        {getInitials(msg.sender_name)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm text-gray-900 dark:text-white">
                            {msg.sender_name || 'System'}
                          </p>
                          <span className="text-xs text-gray-400">
                            {new Date(msg.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {msg.message_body}
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply Section */}
              {activeTab === 'inbox' && (
                <div className="p-6 border-t border-gray-200 dark:border-gray-800">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm">
                      {getInitials(user?.full_name || '')}
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={replyBody}
                        onChange={(e) => setReplyBody(e.target.value)}
                        placeholder="Type your reply..."
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50 resize-none"
                        rows={3}
                      />
                      <div className="flex items-center justify-end gap-2 mt-3">
                        <button
                          onClick={handleReply}
                          disabled={!replyBody.trim()}
                          className="flex items-center gap-2 px-4 py-2 bg-[#5b21b6] text-white rounded-lg hover:bg-[#4c1d95] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Reply className="h-4 w-4" />
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Inbox className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p>Select a message to read</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">New Message</h2>
              <button
                onClick={() => setShowCompose(false)}
                className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Recipient
                </label>
                <select
                  value={composeData.recipient_id}
                  onChange={(e) => setComposeData({ ...composeData, recipient_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
                >
                  <option value="">Select staff member...</option>
                  {staffUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name} ({user.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Priority
                </label>
                <select
                  value={composeData.priority}
                  onChange={(e) => setComposeData({ ...composeData, priority: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
                >
                  <option value="Low">Low</option>
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={composeData.subject}
                  onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                  placeholder="Message subject"
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message
                </label>
                <textarea
                  value={composeData.message_body}
                  onChange={(e) => setComposeData({ ...composeData, message_body: e.target.value })}
                  placeholder="Type your message..."
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowCompose(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendMessage}
                  className="flex items-center gap-2 px-4 py-2 bg-[#5b21b6] text-white rounded-lg hover:bg-[#4c1d95] transition-colors"
                >
                  <Send className="h-4 w-4" />
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
