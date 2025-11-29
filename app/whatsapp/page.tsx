"use client";

import { useState } from "react";
import {
  Search,
  MoreVertical,
  Send,
  Paperclip,
  Smile,
  Phone,
  Video,
  Menu,
} from "lucide-react";

interface Message {
  id: number;
  text: string;
  time: string;
  sent: boolean;
  read?: boolean;
}

interface Chat {
  id: number;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  avatar: string;
  online: boolean;
}

export default function WhatsAppPage() {
  const [selectedChat, setSelectedChat] = useState<number>(1);
  const [messageInput, setMessageInput] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const chats: Chat[] = [
    {
      id: 1,
      name: "João Silva",
      lastMessage: "Ótimo! Vamos agendar a reunião para segunda.",
      time: "14:23",
      unread: 2,
      avatar: "JS",
      online: true,
    },
    {
      id: 2,
      name: "Maria Santos",
      lastMessage: "Obrigada pelo suporte!",
      time: "13:45",
      unread: 0,
      avatar: "MS",
      online: false,
    },
    {
      id: 3,
      name: "Pedro Oliveira",
      lastMessage: "Pode enviar o orçamento?",
      time: "12:30",
      unread: 1,
      avatar: "PO",
      online: true,
    },
    {
      id: 4,
      name: "Ana Costa",
      lastMessage: "Entendi, vou verificar aqui.",
      time: "11:15",
      unread: 0,
      avatar: "AC",
      online: false,
    },
    {
      id: 5,
      name: "Carlos Mendes",
      lastMessage: "Quando podemos conversar?",
      time: "Ontem",
      unread: 0,
      avatar: "CM",
      online: false,
    },
  ];

  const messages: Message[] = [
    { id: 1, text: "Olá! Como posso ajudá-lo?", time: "10:00", sent: false },
    {
      id: 2,
      text: "Oi! Gostaria de saber sobre os planos.",
      time: "10:01",
      sent: true,
      read: true,
    },
    {
      id: 3,
      text: "Claro! Temos 3 planos disponíveis: Básico, Pro e Enterprise.",
      time: "10:02",
      sent: false,
    },
    {
      id: 4,
      text: "Qual você recomenda para uma empresa pequena?",
      time: "10:03",
      sent: true,
      read: true,
    },
    {
      id: 5,
      text: "Para empresas pequenas, recomendo o plano Pro. Ele oferece um ótimo custo-benefício.",
      time: "10:04",
      sent: false,
    },
    {
      id: 6,
      text: "Perfeito! Pode me enviar mais detalhes?",
      time: "10:05",
      sent: true,
      read: false,
    },
  ];

  const selectedChatData = chats.find((chat) => chat.id === selectedChat);

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      // Aqui você adicionaria a lógica para enviar mensagem
      console.log("Enviando:", messageInput);
      setMessageInput("");
    }
  };

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex overflow-hidden">
      {/* Lista de Conversas */}
      <div
        className={`
          ${isMobileMenuOpen ? "block" : "hidden"} lg:block
          w-full lg:w-96 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
          flex flex-col absolute lg:relative z-20 h-full
        `}
      >
        {/* Header da Lista */}
        <div className="p-4 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Conversas
            </h1>
            <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors">
              <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar conversa..."
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400"
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
                w-full p-4 flex items-center space-x-3 border-b border-gray-100 dark:border-gray-700
                hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                ${
                  selectedChat === chat.id
                    ? "bg-indigo-50 dark:bg-gray-700"
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
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                    {chat.name}
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                    {chat.time}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
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
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
        {selectedChatData ? (
          <>
            {/* Header do Chat */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                  >
                    <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>

                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
                      {selectedChatData.avatar}
                    </div>
                    {selectedChatData.online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                    )}
                  </div>

                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white">
                      {selectedChatData.name}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedChatData.online ? "Online" : "Offline"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                    <Phone className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                    <Video className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                    <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sent ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`
                      max-w-xs lg:max-w-md px-4 py-2 rounded-lg
                      ${
                        message.sent
                          ? "bg-indigo-600 text-white"
                          : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      }
                    `}
                  >
                    <p className="text-sm">{message.text}</p>
                    <div className="flex items-center justify-end space-x-1 mt-1">
                      <span
                        className={`text-xs ${
                          message.sent
                            ? "text-indigo-100"
                            : "text-gray-500 dark:text-gray-400"
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
              ))}
            </div>

            {/* Input de Mensagem */}
            <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center space-x-2">
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                  <Paperclip className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>

                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Digite uma mensagem..."
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 border-none rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white placeholder-gray-400"
                />

                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                  <Smile className="w-5 h-5 text-gray-600 dark:text-gray-400" />
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
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Search className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Selecione uma conversa
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Escolha uma conversa na lista para começar a chatear
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
