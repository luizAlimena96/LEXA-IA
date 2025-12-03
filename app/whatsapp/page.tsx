"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search,
  MoreVertical,
  Send,
  Paperclip,
  Smile,
  Menu,
  MessageSquare,
  Tag,
  Plus,
  X,
  Bot,
  Check,
  ChevronDown,
} from "lucide-react";
import dynamic from "next/dynamic";
import Loading from "../components/Loading";
import ErrorComponent from "../components/Error";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import { useToast, ToastContainer } from "../components/Toast";
import { getChats, getMessages, sendMessage } from "../services/whatsappService";
import type { Chat, Message } from "../services/whatsappService";

import { useSearchParams } from "next/navigation";

// Dynamic import for emoji picker to avoid SSR issues
const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

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
  const [error, setError] = useState<string | null>(null);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Tags & AI State
  const [availableTags, setAvailableTags] = useState<TagData[]>([]);
  const [showTagModal, setShowTagModal] = useState(false);
  const [isTagMenuOpen, setIsTagMenuOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#6366f1");

  const { toasts, addToast, removeToast } = useToast();

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

  const loadMessages = async (chatId: string) => {
    try {
      setMessagesLoading(true);
      const messagesData = await getMessages(chatId);
      setMessages(messagesData);
    } catch (err) {
      addToast("Erro ao carregar mensagens", "error");
      console.error(err);
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    loadChats();
  }, [organizationId]);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat);
    }
  }, [selectedChat]);

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
      // Revert would be complex here, assuming success usually
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

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    try {
      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTagName,
          color: newTagColor,
          organizationId
        })
      });

      if (res.ok) {
        const newTag = await res.json();
        setAvailableTags([...availableTags, newTag]);
        setNewTagName("");
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
    if (messageInput.trim() && selectedChat) {
      try {
        const newMessage = await sendMessage(selectedChat, messageInput);
        setMessages([...messages, newMessage]);
        setMessageInput("");
        addToast("Mensagem enviada!", "success");
      } catch (err) {
        addToast("Erro ao enviar mensagem", "error");
        console.error(err);
      }
    }
  };

  const handleSendFeedback = async () => {
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
      // Importar createFeedback do feedbackService
      const { createFeedback } = await import("../services/feedbackService");

      await createFeedback({
        comment: feedbackText,
        customerName: selectedChatData.name,
        phone: selectedChatData.phone,
        conversationId: selectedChat || undefined,
      });

      addToast("Feedback enviado com sucesso!", "success");
      setShowFeedbackModal(false);
      setFeedbackText("");
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
        <div
          className={`
          ${isMobileMenuOpen ? "block" : "hidden"} lg:block
          w-full lg:w-96 bg-white border-r border-gray-200
          flex flex-col absolute lg:relative z-20 h-full
        `}
        >
          {/* Header da Lista */}
          <div className="p-2 bg-gray-100 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-base font-bold text-gray-900">
                Conversas
              </h1>
              <button className="p-1.5 hover:bg-gray-200 rounded-full transition-colors">
                <MoreVertical className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar conversa..."
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400"
              />
            </div>
          </div>

          {/* Lista de Chats */}
          <div className="flex-1 overflow-y-auto">
            {chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => {
                  setSelectedChat(chat.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`
                w-full p-2 flex items-center space-x-2 border-b border-gray-100
                hover:bg-gray-50 transition-colors
                ${selectedChat === chat.id
                    ? "bg-indigo-50"
                    : ""
                  }
              `}
              >
                {/* Avatar */}
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold">
                    {chat.avatar}
                  </div>
                  {chat.online && (
                    <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-white"></div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                      {chat.name}
                    </h3>
                    <span className="text-[10px] text-gray-500 ml-1">
                      {chat.time}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-600 truncate">
                      {chat.lastMessage}
                    </p>
                    {chat.unread > 0 && (
                      <span className="ml-1 bg-indigo-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0">
                        {chat.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Área de Chat */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {selectedChatData ? (
            <>
              {/* Header do Chat */}
              <div className="bg-white border-b border-gray-200 p-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setIsMobileMenuOpen(true)}
                      className="lg:hidden p-1 hover:bg-gray-100 rounded-full"
                    >
                      <Menu className="w-4 h-4 text-gray-600" />
                    </button>

                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold">
                        {selectedChatData.avatar}
                      </div>
                      {selectedChatData.online && (
                        <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-white"></div>
                      )}
                    </div>

                    <div>
                      <h2 className="text-sm font-semibold text-gray-900">
                        {selectedChatData.name}
                      </h2>
                      <p className="text-xs text-gray-500">
                        {selectedChatData.online ? "Online" : "Offline"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* AI Toggle */}
                    <button
                      onClick={handleToggleAI}
                      className={`
                        flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                        ${selectedChatData.aiEnabled
                          ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"}
                      `}
                      title={selectedChatData.aiEnabled ? "IA Ativada" : "IA Desativada"}
                    >
                      <Bot className={`w-4 h-4 ${selectedChatData.aiEnabled ? "text-indigo-600" : "text-gray-500"}`} />
                      <span className="hidden sm:inline">{selectedChatData.aiEnabled ? "IA ON" : "IA OFF"}</span>
                    </button>

                    {/* Tags Menu */}
                    <div className="relative">
                      <button
                        onClick={() => setIsTagMenuOpen(!isTagMenuOpen)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors relative"
                        title="Gerenciar Tags"
                      >
                        <Tag className="w-5 h-5 text-gray-600" />
                        {selectedChatData.tags.length > 0 && (
                          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-indigo-600 rounded-full border-2 border-white"></span>
                        )}
                      </button>

                      {isTagMenuOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setIsTagMenuOpen(false)}
                          ></div>
                          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20 p-2">
                            <div className="mb-2 px-2 py-1 border-b border-gray-100 flex justify-between items-center">
                              <span className="text-sm font-semibold text-gray-700">Tags</span>
                              <button
                                onClick={() => {
                                  setIsTagMenuOpen(false);
                                  setShowTagModal(true);
                                }}
                                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" /> Nova
                              </button>
                            </div>

                            <div className="max-h-60 overflow-y-auto space-y-1">
                              {availableTags.length === 0 ? (
                                <p className="text-xs text-gray-500 px-2 py-2 text-center">Nenhuma tag criada</p>
                              ) : (
                                availableTags.map(tag => {
                                  const isSelected = selectedChatData.tags.some(t => t.id === tag.id);
                                  return (
                                    <button
                                      key={tag.id}
                                      onClick={() => isSelected ? handleRemoveTag(tag.id) : handleAddTag(tag.id)}
                                      className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-gray-50 rounded text-sm group"
                                    >
                                      <div className="flex items-center gap-2">
                                        <span
                                          className="w-2 h-2 rounded-full"
                                          style={{ backgroundColor: tag.color }}
                                        ></span>
                                        <span className="text-gray-700 truncate max-w-[140px]">{tag.name}</span>
                                      </div>
                                      {isSelected && <Check className="w-3 h-3 text-indigo-600" />}
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="relative">
                      <button
                        onClick={() => setShowChatMenu(!showChatMenu)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <MoreVertical className="w-5 h-5 text-gray-600" />
                      </button>

                      {/* Menu Dropdown */}
                      {showChatMenu && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowChatMenu(false)}
                          ></div>
                          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                            <button
                              onClick={() => {
                                setShowFeedbackModal(true);
                                setShowChatMenu(false);
                              }}
                              className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left"
                            >
                              <MessageSquare className="w-4 h-4" />
                              Enviar Feedback desta Conversa
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tags Display in Header */}
                {selectedChatData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2 px-1">
                    {selectedChatData.tags.map(tag => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-opacity-10 text-gray-700 border border-gray-200"
                        style={{ backgroundColor: `${tag.color}15`, borderColor: `${tag.color}30` }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tag.color }}></span>
                        {tag.name}
                        <button
                          onClick={() => handleRemoveTag(tag.id)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loading />
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sent ? "justify-end" : "justify-start"
                        }`}
                    >
                      <div
                        className={`
                        max-w-xs lg:max-w-md px-3 py-1.5 rounded-lg
                        ${message.sent
                            ? "bg-indigo-600 text-white"
                            : "bg-white text-gray-900"
                          }
                      `}
                      >
                        <p className="text-sm">{message.content}</p>
                        <div className="flex items-center justify-end space-x-1 mt-0.5">
                          <span
                            className={`text-[10px] ${message.sent
                              ? "text-indigo-100"
                              : "text-gray-500"
                              }`}
                          >
                            {message.time}
                          </span>
                          {message.sent && (
                            <span className="text-[10px]">
                              {message.read ? "✓✓" : "✓"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Input de Mensagem */}
              <div className="bg-white border-t border-gray-200 p-2">
                <div className="flex items-center space-x-1.5">
                  <button className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                    <Paperclip className="w-4 h-4 text-gray-600" />
                  </button>

                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Digite uma mensagem..."
                    className="flex-1 px-3 py-1.5 text-sm bg-gray-100 border-none rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400"
                  />

                  <div className="relative">
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <Smile className="w-4 h-4 text-gray-600" />
                    </button>

                    {showEmojiPicker && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setShowEmojiPicker(false)}
                        />
                        <div className="absolute bottom-12 right-0 z-20">
                          <EmojiPicker
                            onEmojiClick={(emojiData) => {
                              setMessageInput(messageInput + emojiData.emoji);
                              setShowEmojiPicker(false);
                            }}
                            width={300}
                            height={400}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <button
                    onClick={handleSendMessage}
                    className="p-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-full transition-colors"
                  >
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </div>
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
      <Modal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        title={`Feedback - ${selectedChatData?.name}`}
      >
        <div className="space-y-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Cliente:</p>
            <p className="font-semibold text-gray-900">{selectedChatData?.name}</p>
            <p className="text-sm text-gray-500 mt-1">Telefone: {selectedChatData?.avatar}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descreva o feedback sobre esta conversa
            </label>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Descreva o problema ou feedback sobre esta conversa..."
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-gray-900"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => setShowFeedbackModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleSendFeedback}
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Enviar Feedback
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de Nova Tag */}
      <Modal
        isOpen={showTagModal}
        onClose={() => setShowTagModal(false)}
        title="Nova Tag"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome da Tag
            </label>
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Ex: Cliente VIP, Aguardando Pagamento"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cor
            </label>
            <div className="flex flex-wrap gap-2">
              {['#6366f1', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280'].map(color => (
                <button
                  key={color}
                  onClick={() => setNewTagColor(color)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${newTagColor === color ? 'border-gray-900 scale-110' : 'border-transparent hover:scale-105'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => setShowTagModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreateTag}
              disabled={!newTagName.trim()}
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Criar Tag
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
