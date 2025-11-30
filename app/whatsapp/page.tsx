"use client";

import { useState, useEffect } from "react";
import {
  Search,
  MoreVertical,
  Send,
  Paperclip,
  Smile,
  Menu,
  MessageSquare,
} from "lucide-react";
import Loading from "../components/Loading";
import Error from "../components/Error";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import { useToast, ToastContainer } from "../components/Toast";
import { getChats, getMessages, sendMessage } from "../services/whatsappService";
import type { Chat, Message } from "../services/whatsappService";

export default function ConversasPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const { toasts, addToast, removeToast } = useToast();

  const loadChats = async () => {
    try {
      setLoading(true);
      setError(null);
      const chatsData = await getChats();
      setChats(chatsData);
      if (chatsData.length > 0 && !selectedChat) {
        setSelectedChat(chatsData[0].id);
      }
    } catch (err) {
      setError("Erro ao carregar conversas");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (chatId: number) => {
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
  }, []);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat);
    }
  }, [selectedChat]);

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
    if (selectedChatData) {
      // TODO: Enviar feedback com número do telefone
      console.log("Feedback para:", selectedChatData.name, "Telefone:", selectedChatData.avatar);
      addToast("Feedback enviado com sucesso!", "success");
      setShowFeedbackModal(false);
      setFeedbackText("");
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
        <Error message={error} onRetry={loadChats} />
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
      <div className="h-screen bg-gray-50 flex overflow-hidden">
        {/* Lista de Conversas */}
        <div
          className={`
          ${isMobileMenuOpen ? "block" : "hidden"} lg:block
          w-full lg:w-96 bg-white border-r border-gray-200
          flex flex-col absolute lg:relative z-20 h-full
        `}
        >
          {/* Header da Lista */}
          <div className="p-4 bg-gray-100 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-gray-900">
                Conversas
              </h1>
              <button className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <MoreVertical className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar conversa..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400"
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
                w-full p-4 flex items-center space-x-3 border-b border-gray-100
                hover:bg-gray-50 transition-colors
                ${selectedChat === chat.id
                    ? "bg-indigo-50"
                    : ""
                  }
              `}
              >
                {/* Avatar */}
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
                    {chat.avatar}
                  </div>
                  {chat.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {chat.name}
                    </h3>
                    <span className="text-xs text-gray-500 ml-2">
                      {chat.time}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 truncate">
                      {chat.lastMessage}
                    </p>
                    {chat.unread > 0 && (
                      <span className="ml-2 bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
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
              <div className="bg-white border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setIsMobileMenuOpen(true)}
                      className="lg:hidden p-2 hover:bg-gray-100 rounded-full"
                    >
                      <Menu className="w-5 h-5 text-gray-600" />
                    </button>

                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
                        {selectedChatData.avatar}
                      </div>
                      {selectedChatData.online && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>

                    <div>
                      <h2 className="font-semibold text-gray-900">
                        {selectedChatData.name}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {selectedChatData.online ? "Online" : "Offline"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
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
              </div>

              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                        max-w-xs lg:max-w-md px-4 py-2 rounded-lg
                        ${message.sent
                            ? "bg-indigo-600 text-white"
                            : "bg-white text-gray-900"
                          }
                      `}
                      >
                        <p className="text-sm">{message.text}</p>
                        <div className="flex items-center justify-end space-x-1 mt-1">
                          <span
                            className={`text-xs ${message.sent
                                ? "text-indigo-100"
                                : "text-gray-500"
                              }`}
                          >
                            {message.time}
                          </span>
                          {message.sent && (
                            <span className="text-xs">
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
              <div className="bg-white border-t border-gray-200 p-4">
                <div className="flex items-center space-x-2">
                  <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <Paperclip className="w-5 h-5 text-gray-600" />
                  </button>

                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Digite uma mensagem..."
                    className="flex-1 px-4 py-2 bg-gray-100 border-none rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400"
                  />

                  <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <Smile className="w-5 h-5 text-gray-600" />
                  </button>

                  <button
                    onClick={handleSendMessage}
                    className="p-2 bg-indigo-600 hover:bg-indigo-700 rounded-full transition-colors"
                  >
                    <Send className="w-5 h-5 text-white" />
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
    </>
  );
}
