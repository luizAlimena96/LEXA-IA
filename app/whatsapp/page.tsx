"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Loading from "../components/Loading";
import ErrorComponent from "../components/Error";
import EmptyState from "../components/EmptyState";
import { useToast, ToastContainer } from "../components/Toast";
import { getChats, getMessages, sendMessage } from "../services/whatsappService";
import type { Chat, Message } from "../services/whatsappService";
import { useConversationStream } from "../hooks/useConversationStream";

// WhatsApp Components
import ChatList from "../components/whatsapp/ChatList";
import ChatHeader from "../components/whatsapp/ChatHeader";
import MessageList from "../components/whatsapp/MessageList";
import MessageInput from "../components/whatsapp/MessageInput";
import TagMenu from "../components/whatsapp/TagMenu";
import ChatMenu from "../components/whatsapp/ChatMenu";
import FeedbackModal from "../components/whatsapp/FeedbackModal";
import TagModal from "../components/whatsapp/TagModal";

interface TagData {
  id: string;
  name: string;
  color: string;
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

  const { toasts, addToast, removeToast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadChats = async () => {
    try {
      setLoading(true);
      setError(null);
      const chatsData = await getChats(organizationId || undefined);
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
      const messagesData = await getMessages(chatId);

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
      const url = organizationId
        ? `/api/tags?organizationId=${organizationId}`
        : '/api/tags';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAvailableTags(data);
      }
    } catch (error) {
      console.error("Error loading tags:", error);
    }
  };

  const handleToggleAI = async () => {
    if (!selectedChat) return;
    const chat = chats.find(c => c.id === selectedChat);
    if (!chat) return;

    try {
      const newStatus = !chat.aiEnabled;
      // Optimistic update
      setChats(chats.map(c => c.id === selectedChat ? { ...c, aiEnabled: newStatus } : c));

      const res = await fetch(`/api/conversations/${selectedChat}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiEnabled: newStatus })
      });

      if (!res.ok) {
        // Revert on error
        setChats(chats.map(c => c.id === selectedChat ? { ...c, aiEnabled: !newStatus } : c));
        addToast("Erro ao atualizar status da IA", "error");
      } else {
        addToast(`IA ${newStatus ? 'ativada' : 'desativada'} para esta conversa`, "success");
      }
    } catch (error) {
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
      const res = await fetch(`/api/conversations/${selectedChat}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId })
      });

      if (!res.ok) throw new Error('Failed to add tag');
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
      const res = await fetch(`/api/conversations/${selectedChat}/tags?tagId=${tagId}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Failed to remove tag');
    } catch (error) {
      addToast("Erro ao remover tag", "error");
    }
  };

  const handleCreateTag = async (name: string, color: string) => {
    if (!name.trim()) return;

    try {
      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          color,
          organizationId
        })
      });

      if (res.ok) {
        const newTag = await res.json();
        setAvailableTags([...availableTags, newTag]);
        setShowTagModal(false);
        // Automatically add to current chat
        if (selectedChat) {
          handleAddTag(newTag.id);
        }
        addToast("Tag criada com sucesso", "success");
      } else {
        addToast("Erro ao criar tag", "error");
      }
    } catch (error) {
      addToast("Erro ao criar tag", "error");
    }
  };

  const handleSendMessage = async () => {
    if (messageInput.trim() && selectedChat && !sending) {
      const messageText = messageInput;
      setMessageInput("");
      setSending(true);

      try {
        const newMessage = await sendMessage(selectedChat, messageText);
        setMessages([...messages, newMessage]);

        // Update chat list with the sent message
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

        addToast("Mensagem enviada!", "success");
      } catch (err: any) {
        // Restore message input on error
        setMessageInput(messageText);

        const errorMessage = err?.message || "Erro ao enviar mensagem";
        addToast(errorMessage, "error");
        console.error("Error sending message:", err);
      } finally {
        setSending(false);
      }
    }
  };

  const handleSendFeedback = async (feedbackText: string) => {
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
      const { createFeedback } = await import("../services/feedbackService");

      await createFeedback({
        comment: feedbackText,
        customerName: selectedChatData.name,
        phone: selectedChatData.phone,
        conversationId: selectedChat || undefined,
      });

      addToast("Feedback enviado com sucesso!", "success");
      setShowFeedbackModal(false);
    } catch (error) {
      console.error("Erro ao enviar feedback:", error);
      addToast("Erro ao enviar feedback", "error");
    }
  };

  const selectedChatData = chats.find((chat) => chat.id === selectedChat);

  if (loading) {
    return (
      <div className="h-screen bg-gray-50">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-gray-50">
        <ErrorComponent message={error} onRetry={loadChats} />
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="h-screen bg-gray-50">
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
      <div className="h-[100dvh] bg-gray-50 flex overflow-hidden">
        {/* Lista de Conversas */}
        <ChatList
          chats={chats}
          selectedChat={selectedChat}
          onSelectChat={setSelectedChat}
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
        />

        {/* Área de Chat */}
        <div className="flex-1 flex flex-col bg-gray-50">
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
              />

              {/* Mensagens */}
              <MessageList
                messages={messages}
                loading={messagesLoading}
                messagesEndRef={messagesEndRef}
              />

              {/* Input de Mensagem */}
              <MessageInput
                value={messageInput}
                onChange={setMessageInput}
                onSend={handleSendMessage}
                sending={sending}
              />
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
      {selectedChatData && (
        <FeedbackModal
          isOpen={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          chatName={selectedChatData.name}
          chatPhone={selectedChatData.avatar}
          onSubmit={handleSendFeedback}
        />
      )}

      {/* Modal de Nova Tag */}
      <TagModal
        isOpen={showTagModal}
        onClose={() => setShowTagModal(false)}
        onCreateTag={handleCreateTag}
      />
    </>
  );
}
