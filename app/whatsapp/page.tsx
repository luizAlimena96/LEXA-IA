"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Loading from "../components/Loading";
import ErrorComponent from "../components/Error";
import EmptyState from "../components/EmptyState";
import { useToast, ToastContainer } from "../components/Toast";
import type { Chat, Message, QuickResponse, CreateQuickResponseData } from "../types";
import api from "../lib/api-client";
import { useConversationStream } from "../hooks/useConversationStream";

// API wrapper functions - now using api-client
const getChats = async (organizationId?: string): Promise<Chat[]> => {
  const conversations = await api.conversations.list({ organizationId });
  return conversations.map((c: any) => ({
    id: c.id,
    name: c.lead?.name || c.whatsapp || 'Desconhecido',
    phone: c.whatsapp,
    avatar: c.whatsapp,
    lastMessage: c.messages?.[0]?.content || '',
    time: c.updatedAt ? new Date(c.updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '',
    status: 'offline' as const,
    tags: c.tags || [],
    aiEnabled: c.aiEnabled ?? true,
    leadId: c.leadId,
  }));
};

const getMessages = async (chatId: string): Promise<Message[]> => {
  const messages = await api.conversations.getMessages(chatId);
  return messages.map((m: any) => ({
    id: m.id,
    content: m.content,
    role: m.fromMe ? 'assistant' : 'user',
    time: new Date(m.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    sent: m.fromMe,
    read: true,
    type: m.type,
    mediaUrl: m.mediaUrl,
  }));
};

const sendWhatsAppMessage = async (chatId: string, message: string): Promise<Message> => {
  const result = await api.conversations.sendMessage(chatId, { content: message, role: 'assistant' });
  return {
    id: result.id || crypto.randomUUID(),
    content: message,
    role: 'assistant',
    time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    sent: true,
    read: false,
  };
};

// Wrapper functions using api-client
const loadChatsData = (organizationId?: string) => getChats(organizationId);
const loadMessagesData = (chatId: string) => getMessages(chatId);
const sendMessageData = (chatId: string, message: string) => sendWhatsAppMessage(chatId, message);
const sendMediaMessage = (chatId: string, file: File, mediaType: string, caption?: string) =>
  Promise.resolve({
    id: crypto.randomUUID(),
    content: caption || 'Mídia',
    role: 'assistant' as const,
    time: new Date().toLocaleTimeString(),
    sent: true,
    read: false
  });

const getQuickResponses = (organizationId?: string) => api.quickResponses.list(organizationId);
const createQuickResponse = (data: any) => api.quickResponses.create(data);
const updateQuickResponse = (id: string, data: any) => api.quickResponses.update(id, data);
const deleteQuickResponse = (id: string) => api.quickResponses.delete(id);

// WhatsApp Components
import ChatList from "../components/whatsapp/ChatList";
import ChatHeader from "../components/whatsapp/ChatHeader";
import MessageList from "../components/whatsapp/MessageList";
import MessageInput from "../components/whatsapp/MessageInput";
import TagMenu from "../components/whatsapp/TagMenu";
import ChatMenu from "../components/whatsapp/ChatMenu";
import FeedbackCreationModal from "../components/whatsapp/FeedbackCreationModal";
import TagModal from "../components/whatsapp/TagModal";
import QuickResponseModal from "../components/whatsapp/QuickResponseModal";
import QuickResponsePicker from "../components/whatsapp/QuickResponsePicker";
import ContactDetailsModal from "../components/contacts/ContactDetailsModal";
import AIDebugModal from "../components/whatsapp/AIDebugModal";

interface TagData {
  id: string;
  name: string;
  color: string;
}

interface ContactData {
  id: string;
  name: string | null;
  phone: string;
  email?: string | null;
  createdAt: string;
  updatedAt?: string;
  notes?: string | null;
  extractedData?: Record<string, any> | null;
  currentState?: string | null;
  status?: string;
  conversations?: {
    id: string;
    tags: TagData[];
    messages?: { timestamp: string }[];
    _count?: { messages: number };
  }[];
}

export default function ConversasPage() {
  const searchParams = useSearchParams();
  const organizationId = searchParams.get("organizationId");

  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // Tags & AI State
  const [availableTags, setAvailableTags] = useState<TagData[]>([]);
  const [showTagModal, setShowTagModal] = useState(false);
  const [isTagMenuOpen, setIsTagMenuOpen] = useState(false);

  // Quick Responses State
  const [quickResponses, setQuickResponses] = useState<QuickResponse[]>([]);
  const [showQuickResponseModal, setShowQuickResponseModal] = useState(false);
  const [showQuickPicker, setShowQuickPicker] = useState(false);

  // Contact Sidebar State
  const [selectedContact, setSelectedContact] = useState<ContactData | null>(null);
  const [isContactSidebarOpen, setIsContactSidebarOpen] = useState(false);

  // AI Debug State
  const [showAIDebugModal, setShowAIDebugModal] = useState(false);
  const [debugMessages, setDebugMessages] = useState<any[]>([]);

  const { toasts, addToast, removeToast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const notificationAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize notification audio
  useEffect(() => {
    notificationAudioRef.current = new Audio('/Notification 1.wav');
    notificationAudioRef.current.volume = 0.5;
  }, []);

  const loadChats = async () => {
    try {
      setLoading(true);
      setError(null);
      const chatsData = await loadChatsData(organizationId || undefined);
      setChats(chatsData);
      if (chatsData.length > 0 && !selectedChat) {
        setSelectedChat(chatsData[0].id);
      } else if (chatsData.length === 0) {
        setSelectedChat(null);
      }
    } catch (err) {
      setError("Erro ao carregar conversas");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (chatId: string, silent = false) => {
    try {
      if (!silent) {
        setMessagesLoading(true);
      }
      const messagesData = await loadMessagesData(chatId);

      if (JSON.stringify(messagesData) !== JSON.stringify(messages)) {
        setMessages(messagesData);
      }
    } catch (err) {
      if (!silent) {
        addToast("Erro ao carregar mensagens", "error");
      }
      console.error(err);
    } finally {
      if (!silent) {
        setMessagesLoading(false);
      }
    }
  };

  useEffect(() => {
    loadChats();
  }, [organizationId]);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat, false);
    }
  }, [selectedChat]);

  const prevMessagesLength = useRef(messages.length);
  useEffect(() => {
    if (messages.length > prevMessagesLength.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevMessagesLength.current = messages.length;
  }, [messages]);

  // Real-time message updates via SSE
  const handleNewMessage = useCallback((newMessage?: Message) => {
    if (!newMessage) return;

    // Update messages list
    setMessages(prev => {
      // Check if message already exists (avoid duplicates)
      if (prev.some(m => m.id === newMessage.id)) {
        return prev;
      }

      // Play notification sound for incoming messages (not from assistant/agent)
      if (newMessage.role === 'user' && notificationAudioRef.current) {
        notificationAudioRef.current.currentTime = 0;
        notificationAudioRef.current.play().catch(err => {
          console.log('Could not play notification sound:', err);
        });
      }

      return [...prev, newMessage];
    });

    // Update chat list with latest message
    setChats(prev => {
      const chatIndex = prev.findIndex(c => c.id === selectedChat);
      if (chatIndex === -1) return prev;

      const updatedChat = {
        ...prev[chatIndex],
        lastMessage: newMessage.content,
        time: newMessage.time,
      };

      // Move updated chat to top of list
      const newChats = [...prev];
      newChats.splice(chatIndex, 1);
      return [updatedChat, ...newChats];
    });
  }, [selectedChat]);

  useConversationStream({
    conversationId: selectedChat,
    onMessage: handleNewMessage,
    onConnect: () => console.log('[WhatsApp] SSE connected'),
    onDisconnect: () => console.log('[WhatsApp] SSE disconnected'),
  });

  useEffect(() => {
    loadTags();
  }, [organizationId]);

  const loadTags = async () => {
    try {
      const data = await api.tags.list(organizationId || undefined);
      setAvailableTags(data);
    } catch (error) {
      console.error("Error loading tags:", error);
    }
  };

  const loadQuickResponses = async () => {
    try {
      const responses = await getQuickResponses(organizationId || undefined);
      setQuickResponses(responses);
    } catch (error) {
      console.error("Error loading quick responses:", error);
    }
  };

  useEffect(() => {
    loadQuickResponses();
  }, [organizationId]);

  const handleToggleAI = async () => {
    if (!selectedChat) return;
    const chat = chats.find(c => c.id === selectedChat);
    if (!chat) return;

    const newStatus = !chat.aiEnabled;

    try {
      setChats(chats.map(c => c.id === selectedChat ? { ...c, aiEnabled: newStatus } : c));

      await api.conversations.toggleAI(selectedChat, newStatus);

      addToast(`IA ${newStatus ? 'ativada' : 'desativada'} para esta conversa`, "success");
    } catch (error) {
      // Revert on error
      setChats(chats.map(c => c.id === selectedChat ? { ...c, aiEnabled: !newStatus } : c));
      console.error(error);
      addToast("Erro ao atualizar status da IA", "error");
    }
  };

  const handleAddTag = async (tagId: string) => {
    if (!selectedChat) return;
    const tag = availableTags.find(t => t.id === tagId);
    if (!tag) return;

    // Optimistic update
    setChats(chats.map(c => {
      if (c.id === selectedChat) {
        if (c.tags.some(t => t.id === tagId)) return c;
        return { ...c, tags: [...c.tags, tag] };
      }
      return c;
    }));

    try {
      await api.conversations.addTag(selectedChat, tagId);
      setIsTagMenuOpen(false);
    } catch (error) {
      addToast("Erro ao adicionar tag", "error");
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    if (!selectedChat) return;

    // Optimistic update
    setChats(chats.map(c => {
      if (c.id === selectedChat) {
        return { ...c, tags: c.tags.filter(t => t.id !== tagId) };
      }
      return c;
    }));

    try {
      await api.conversations.removeTag(selectedChat, tagId);
    } catch (error) {
      addToast("Erro ao remover tag", "error");
    }
  };

  const handleCreateTag = async (name: string, color: string) => {
    if (!name.trim()) return;

    try {
      const newTag = await api.tags.create({
        name,
        color,
        organizationId: organizationId || undefined
      });

      setAvailableTags([...availableTags, newTag]);
      setShowTagModal(false);
      // Automatically add to current chat
      if (selectedChat) {
        await handleAddTag(newTag.id);
      }
      addToast("Tag criada com sucesso", "success");
    } catch (error) {
      addToast("Erro ao criar tag", "error");
    }
  };

  const handleSendMessage = async () => {
    if (messageInput.trim() && selectedChat && !sending) {
      const messageText = messageInput;
      setMessageInput("");
      setSending(true);

      // Optimistic update - add temporary message
      const tempMessage = {
        id: 'temp-' + Date.now(),
        content: messageText,
        role: 'assistant' as const,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        sent: true,
        read: false
      };
      setMessages([...messages, tempMessage]);

      try {
        await sendMessageData(selectedChat, messageText);

        // Remove temp message - SSE will add the real one
        setMessages(prev => prev.filter(m => m.id !== tempMessage.id));

        // Update chat list with the sent message
        setChats(prev => {
          const chatIndex = prev.findIndex(c => c.id === selectedChat);
          if (chatIndex === -1) return prev;

          const updatedChat = {
            ...prev[chatIndex],
            lastMessage: messageText,
            time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          };

          // Move updated chat to top of list
          const newChats = [...prev];
          newChats.splice(chatIndex, 1);
          return [updatedChat, ...newChats];
        });

        addToast("Mensagem enviada!", "success");
      } catch (err: any) {
        // Remove temp message on error
        setMessages(prev => prev.filter(m => m.id !== tempMessage.id));

        // Restore message input on error
        setMessageInput(messageText);

        // Show specific error message from backend
        const errorMessage = err?.response?.data?.message || err?.message || "Erro ao enviar mensagem";
        addToast(errorMessage, "error");
        console.error("Error sending message:", err);
      } finally {
        setSending(false);
      }
    }
  };

  const handleSendMedia = async (file: File, mediaType: 'image' | 'video' | 'document' | 'audio', caption?: string) => {
    if (!selectedChat || sending) return;

    setSending(true);
    try {
      const newMessage = await sendMediaMessage(selectedChat, file, mediaType, caption);
      setMessages([...messages, newMessage]);

      // Update chat list with the sent message
      setChats(prev => {
        const chatIndex = prev.findIndex(c => c.id === selectedChat);
        if (chatIndex === -1) return prev;

        const updatedChat = {
          ...prev[chatIndex],
          lastMessage: mediaType === 'audio' ? '🎵 Áudio' :
            mediaType === 'image' ? '📷 Imagem' :
              mediaType === 'video' ? '🎬 Vídeo' : '📄 Documento',
          time: newMessage.time,
        };

        const newChats = [...prev];
        newChats.splice(chatIndex, 1);
        return [updatedChat, ...newChats];
      });

      addToast(`${mediaType === 'audio' ? 'Áudio' : 'Mídia'} enviado!`, "success");
    } catch (err: any) {
      const errorMessage = err?.message || "Erro ao enviar mídia";
      addToast(errorMessage, "error");
      console.error("Error sending media:", err);
    } finally {
      setSending(false);
    }
  };

  const handleSendFeedback = async (feedbackText: string, rating: number) => {
    if (!feedbackText.trim()) {
      addToast("Por favor, escreva um feedback", "error");
      return;
    }

    const selectedChatData = chats.find((chat) => chat.id === selectedChat);
    if (!selectedChatData) {
      addToast("Erro: Conversa não encontrada", "error");
      return;
    }

    try {
      await api.feedback.create({
        comment: feedbackText,
        customerName: selectedChatData.name,
        phone: selectedChatData.phone,
        conversationId: selectedChat || undefined,
        organizationId: organizationId || undefined,
        rating,
      });

      addToast("Feedback enviado com sucesso!", "success");
      setShowFeedbackModal(false);
    } catch (error) {
      console.error("Erro ao enviar feedback:", error);
      addToast("Erro ao enviar feedback", "error");
    }
  };

  // Quick Response Handlers
  const handleCreateQuickResponse = async (data: CreateQuickResponseData) => {
    try {
      const newResponse = await createQuickResponse({
        ...data,
        organizationId: organizationId || undefined,
      });
      if (newResponse) {
        setQuickResponses([...quickResponses, newResponse]);
        addToast("Resposta rápida criada!", "success");
      }
    } catch (error) {
      addToast("Erro ao criar resposta rápida", "error");
      throw error;
    }
  };

  const handleUpdateQuickResponse = async (id: string, data: Partial<CreateQuickResponseData>) => {
    try {
      const updated = await updateQuickResponse(id, data);
      if (updated) {
        setQuickResponses(quickResponses.map(r => r.id === id ? updated : r));
        addToast("Resposta rápida atualizada!", "success");
      }
    } catch (error) {
      addToast("Erro ao atualizar resposta rápida", "error");
      throw error;
    }
  };

  const handleDeleteQuickResponse = async (id: string) => {
    try {
      await deleteQuickResponse(id);
      setQuickResponses(quickResponses.filter(r => r.id !== id));
      addToast("Resposta rápida excluída!", "success");
    } catch (error) {
      addToast("Erro ao excluir resposta rápida", "error");
      throw error;
    }
  };

  const handleSendQuickResponse = async (response: QuickResponse) => {
    if (!selectedChat) return;

    if (response.type === 'TEXT') {
      // For text, put it in the input field for editing before sending
      setMessageInput(response.content);
      addToast("Resposta carregada - edite e envie quando pronto", "info");
    } else {
      // For audio/image, show notification (ready for media implementation)
      addToast(`${response.type === 'AUDIO' ? 'Áudio' : 'Imagem'} selecionado - pronto para envio`, "info");
      // TODO: Implement media preview before sending via Evolution API
      console.log('Selected media:', response.type, response.content);
    }

    setShowQuickPicker(false);
  };

  // Contact Sidebar Handlers
  const handleOpenContactSidebar = async () => {
    if (!selectedChatData?.leadId) return;

    try {
      const contact = await api.leads.get(selectedChatData.leadId);

      if (selectedChatData) {
        if (!contact.conversations || contact.conversations.length === 0) {
          contact.conversations = [{
            id: selectedChat,
            tags: selectedChatData.tags,
            _count: { messages: 0 }
          }];
        } else {
          const currentConv = contact.conversations.find((c: any) => c.id === selectedChat);
          if (currentConv) {
            currentConv.tags = selectedChatData.tags;
          } else {
            contact.conversations.push({
              id: selectedChat,
              tags: selectedChatData.tags,
              _count: { messages: 0 }
            });
          }
        }
      }

      setSelectedContact(contact);
      setIsContactSidebarOpen(true);
    } catch (error) {
      console.error("Error loading contact:", error);
      addToast("Erro ao carregar dados do contato", "error");
    }
  };

  const handleCloseContactSidebar = () => {
    setIsContactSidebarOpen(false);
    setTimeout(() => setSelectedContact(null), 300);
  };

  const handleContactAddTag = async (conversationId: string, tagId: string) => {
    await handleAddTag(tagId);
  };

  const handleContactRemoveTag = async (conversationId: string, tagId: string) => {
    await handleRemoveTag(tagId);
  };

  const handleUpdateContactNotes = async (contactId: string, notes: string) => {
    try {
      await api.leads.update(contactId, { notes });
      if (selectedContact && selectedContact.id === contactId) {
        setSelectedContact({ ...selectedContact, notes });
      }
    } catch (error) {
      console.error("Error updating notes:", error);
    }
  };

  const handleUpdateContactName = async (contactId: string, name: string) => {
    try {
      await api.leads.update(contactId, { name });
      if (selectedContact && selectedContact.id === contactId) {
        setSelectedContact({ ...selectedContact, name });
      }
      // Update chat list to reflect name change
      setChats(chats.map(c => c.leadId === contactId ? { ...c, name } : c));
    } catch (error) {
      console.error("Error updating name:", error);
    }
  };

  const handleUpdateContactEmail = async (contactId: string, email: string) => {
    try {
      await api.leads.update(contactId, { email });
      if (selectedContact && selectedContact.id === contactId) {
        setSelectedContact({ ...selectedContact, email });
      }
    } catch (error) {
      console.error("Error updating email:", error);
    }
  };

  const handleCreateContactTag = async (name: string, color: string) => {
    try {
      const newTag = await api.tags.create({
        name,
        color,
        organizationId,
      });

      // Add to available tags
      setAvailableTags([...availableTags, newTag]);

      // Also add to current conversation and update contact sidebar
      if (selectedChat) {
        await api.conversations.addTag(selectedChat, newTag.id);
        // Update chat list with new tag
        setChats(chats.map(c =>
          c.id === selectedChat
            ? { ...c, tags: [...c.tags, newTag] }
            : c
        ));

        // Update contact sidebar if open
        if (selectedContact?.conversations?.[0]) {
          setSelectedContact({
            ...selectedContact,
            conversations: [
              {
                ...selectedContact.conversations[0],
                tags: [...selectedContact.conversations[0].tags, newTag],
              },
            ],
          });
        }
      }
    } catch (error) {
      console.error("Error creating tag:", error);
    }
  };

  const selectedChatData = chats.find((chat) => chat.id === selectedChat);

  if (loading) {
    return (
      <div className="h-screen bg-gray-50 dark:bg-[#0a0a0f]">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-gray-50 dark:bg-[#0a0a0f]">
        <ErrorComponent message={error} onRetry={loadChats} />
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="h-screen bg-gray-50 dark:bg-[#0a0a0f]">
        <EmptyState
          title="Nenhuma conversa encontrada"
          description="Você ainda não tem conversas"
          action={{
            label: "Atualizar",
            onClick: loadChats,
          }}
        />
      </div>
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <div className="h-[100dvh] bg-gray-50 dark:bg-[#0a0a0f] flex overflow-hidden transition-colors duration-300">
        {/* Lista de Conversas */}
        <ChatList
          chats={chats}
          selectedChat={selectedChat}
          onSelectChat={setSelectedChat}
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
        />

        {/* Área de Chat */}
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-[#0a0a0f]">
          {selectedChatData ? (
            <>
              {/* Header do Chat */}
              <ChatHeader
                chat={selectedChatData}
                onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
                onToggleAI={handleToggleAI}
                onOpenTagMenu={() => setIsTagMenuOpen(true)}
                onOpenChatMenu={() => setShowChatMenu(true)}
                onRemoveTag={handleRemoveTag}
                onOpenContactInfo={handleOpenContactSidebar}
              />

              {/* Tag Menu Dropdown */}
              <TagMenu
                isOpen={isTagMenuOpen}
                onClose={() => setIsTagMenuOpen(false)}
                availableTags={availableTags}
                selectedTags={selectedChatData.tags}
                onAddTag={handleAddTag}
                onRemoveTag={handleRemoveTag}
                onCreateNew={() => setShowTagModal(true)}
              />

              {/* Chat Menu Dropdown */}
              <ChatMenu
                isOpen={showChatMenu}
                onClose={() => setShowChatMenu(false)}
                onOpenFeedback={() => setShowFeedbackModal(true)}
                onOpenQuickResponses={() => setShowQuickResponseModal(true)}
                onOpenAIDebug={async () => {
                  if (selectedChat) {
                    try {
                      const msgs = await api.conversations.getMessages(selectedChat);
                      setDebugMessages(msgs);
                      setShowAIDebugModal(true);
                    } catch (error) {
                      console.error("Error loading debug messages:", error);
                    }
                  }
                }}
              />

              {/* Mensagens */}
              <MessageList
                messages={messages}
                loading={messagesLoading}
                messagesEndRef={messagesEndRef}
              />

              {/* Input de Mensagem */}
              <div className="relative">
                <QuickResponsePicker
                  isOpen={showQuickPicker}
                  onClose={() => setShowQuickPicker(false)}
                  quickResponses={quickResponses}
                  onSelectResponse={handleSendQuickResponse}
                />
                <MessageInput
                  value={messageInput}
                  onChange={setMessageInput}
                  onSend={handleSendMessage}
                  sending={sending}
                  onOpenQuickPicker={() => setShowQuickPicker(!showQuickPicker)}
                  onSendMedia={handleSendMedia}
                />
              </div>
            </>
          ) : (
            <EmptyState
              title="Selecione uma conversa"
              description="Escolha uma conversa na lista para começar a chatear"
            />
          )}
        </div>
      </div>

      {/* Modal de Feedback */}
      {showFeedbackModal && selectedChat && (
        <FeedbackCreationModal
          isOpen={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          chatName={chats.find((c) => c.id === selectedChat)?.name || ""}
          chatPhone={chats.find((c) => c.id === selectedChat)?.phone || ""}
          onSubmit={handleSendFeedback}
        />
      )}

      {/* Modal de Nova Tag */}
      <TagModal
        isOpen={showTagModal}
        onClose={() => setShowTagModal(false)}
        onCreateTag={handleCreateTag}
      />

      {/* Modal de Respostas Rápidas */}
      <QuickResponseModal
        isOpen={showQuickResponseModal}
        onClose={() => setShowQuickResponseModal(false)}
        quickResponses={quickResponses}
        onCreateResponse={handleCreateQuickResponse}
        onUpdateResponse={handleUpdateQuickResponse}
        onDeleteResponse={handleDeleteQuickResponse}
        organizationId={organizationId || undefined}
      />

      {/* Contact Details Modal (replaces Sidebar) */}
      <ContactDetailsModal
        contact={selectedContact}
        isOpen={isContactSidebarOpen}
        onClose={handleCloseContactSidebar}
        availableTags={availableTags}
        onAddTag={handleContactAddTag}
        onRemoveTag={handleContactRemoveTag}
        onUpdateNotes={handleUpdateContactNotes}
        onUpdateName={handleUpdateContactName}
        onUpdateEmail={handleUpdateContactEmail}
        onCreateTag={handleCreateContactTag}
      />

      {/* AI Debug Modal */}
      {selectedChatData && (
        <AIDebugModal
          isOpen={showAIDebugModal}
          onClose={() => setShowAIDebugModal(false)}
          messages={debugMessages}
          chatName={selectedChatData.name}
        />
      )}
    </>
  );
}
