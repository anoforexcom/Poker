import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { ChatMessage, getRandomMessage, MessageCategory, BotPersonality, getBotMessageFrequency, getPersonalityCategories, getContextMessage } from '../utils/chatMessages';

interface ChatContextType {
    messages: Map<string, ChatMessage[]>; // tournamentId -> messages
    addMessage: (tournamentId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
    getMessages: (tournamentId: string) => ChatMessage[];
    clearMessages: (tournamentId: string) => void;
    startBotMessages: (tournamentId: string, botPlayers: { id: string; name: string; personality: BotPersonality }[]) => void;
    stopBotMessages: (tournamentId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [messages, setMessages] = useState<Map<string, ChatMessage[]>>(new Map());
    const [botTimers, setBotTimers] = useState<Map<string, NodeJS.Timeout[]>>(new Map());

    const addMessage = useCallback((tournamentId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
        const newMessage: ChatMessage = {
            ...message,
            id: `${Date.now()}-${Math.random()}`,
            timestamp: new Date(),
        };

        setMessages(prev => {
            const newMap = new Map(prev);
            const tournamentMessages = newMap.get(tournamentId) || [];
            newMap.set(tournamentId, [...tournamentMessages, newMessage]);
            return newMap;
        });
    }, []);

    const getMessages = useCallback((tournamentId: string): ChatMessage[] => {
        return messages.get(tournamentId) || [];
    }, [messages]);

    const clearMessages = useCallback((tournamentId: string) => {
        setMessages(prev => {
            const newMap = new Map(prev);
            newMap.delete(tournamentId);
            return newMap;
        });
    }, []);

    const startBotMessages = useCallback((
        tournamentId: string,
        botPlayers: { id: string; name: string; personality: BotPersonality }[]
    ) => {
        // Clear existing timers for this tournament
        const existingTimers = botTimers.get(tournamentId) || [];
        existingTimers.forEach(timer => clearInterval(timer));

        const newTimers: NodeJS.Timeout[] = [];

        // Create message timers for each bot
        botPlayers.forEach(bot => {
            const frequency = getBotMessageFrequency(bot.personality);
            const categories = getPersonalityCategories(bot.personality);

            // Random interval between 30 seconds to 3 minutes
            const baseInterval = 30000 + Math.random() * 150000;

            const timer = setInterval(() => {
                // Probability check
                if (Math.random() < frequency) {
                    const category = categories[Math.floor(Math.random() * categories.length)];
                    const messageText = getRandomMessage(category);

                    addMessage(tournamentId, {
                        playerId: bot.id,
                        playerName: bot.name,
                        message: messageText,
                        type: 'chat',
                    });
                }
            }, baseInterval);

            newTimers.push(timer);
        });

        setBotTimers(prev => {
            const newMap = new Map(prev);
            newMap.set(tournamentId, newTimers);
            return newMap;
        });
    }, [addMessage, botTimers]);

    const stopBotMessages = useCallback((tournamentId: string) => {
        const timers = botTimers.get(tournamentId) || [];
        timers.forEach(timer => clearInterval(timer));

        setBotTimers(prev => {
            const newMap = new Map(prev);
            newMap.delete(tournamentId);
            return newMap;
        });
    }, [botTimers]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            botTimers.forEach(timers => {
                timers.forEach(timer => clearInterval(timer));
            });
        };
    }, [botTimers]);

    return (
        <ChatContext.Provider value={{
            messages,
            addMessage,
            getMessages,
            clearMessages,
            startBotMessages,
            stopBotMessages,
        }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};
