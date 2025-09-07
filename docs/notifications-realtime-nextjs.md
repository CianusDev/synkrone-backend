# Implémentation des Notifications en Temps Réel avec Socket.IO dans Next.js

Ce guide explique comment implémenter un système de notifications en temps réel dans une application Next.js, en utilisant Socket.IO pour se connecter à notre backend Synkrone.

## Table des matières
1. [Installation des dépendances](#installation-des-dépendances)
2. [Service Socket.IO](#service-socketio)
3. [Hook React pour Socket.IO](#hook-react-pour-socketio)
4. [Hook pour les notifications](#hook-pour-les-notifications)
5. [Composant de centre de notifications](#composant-de-centre-de-notifications)
6. [Intégration dans le layout](#intégration-dans-le-layout)
7. [API Routes pour les notifications](#api-routes-pour-les-notifications)
8. [Types TypeScript](#types-typescript)

## Installation des dépendances

```bash
npm install socket.io-client date-fns
```

## Service Socket.IO

Créez un service pour gérer la connexion Socket.IO et les événements :

```typescript
// src/services/socket.service.ts
import { io, Socket } from 'socket.io-client';
import { Notification } from '@/types/notification'; // Ajuste selon tes types

class SocketService {
  private socket: Socket | null = null;
  private listeners: Record<string, Function[]> = {};
  
  // Initialiser la connexion socket
  connect(userId: string, token: string) {
    if (this.socket) {
      this.disconnect();
    }
    
    // Récupère l'URL du backend depuis les variables d'environnement
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    
    // Établit la connexion avec authentification
    this.socket = io(backendUrl, {
      auth: {
        token
      },
      query: {
        userId
      }
    });
    
    // Configure les listeners par défaut
    this.setupDefaultListeners();
    
    return this.socket;
  }
  
  // Déconnecter le socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
  
  // Configure les écouteurs d'événements par défaut
  private setupDefaultListeners() {
    if (!this.socket) return;
    
    this.socket.on('connect', () => {
      console.log('Socket.IO connected');
    });
    
    this.socket.on('disconnect', (reason) => {
      console.log(`Socket.IO disconnected: ${reason}`);
    });
    
    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
    });
  }
  
  // Écouter un événement spécifique
  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    
    this.listeners[event].push(callback);
    
    if (this.socket) {
      this.socket.on(event, (...args) => callback(...args));
    }
    
    return () => this.off(event, callback);
  }
  
  // Supprimer un écouteur d'événement
  off(event: string, callback: Function) {
    if (!this.listeners[event]) return;
    
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    
    if (this.socket) {
      this.socket.off(event, callback as any);
    }
  }
  
  // Émettre un événement
  emit(event: string, ...args: any[]) {
    if (this.socket) {
      this.socket.emit(event, ...args);
    } else {
      console.warn('Socket not connected, cannot emit', event);
    }
  }
}

// Singleton instance
export const socketService = new SocketService();
```

## Hook React pour Socket.IO

Créez un hook React pour utiliser le service Socket.IO :

```typescript
// src/hooks/useSocket.ts
import { useState, useEffect } from 'react';
import { socketService } from '@/services/socket.service';
import { useAuth } from '@/hooks/useAuth'; // Ajuste selon ton hook d'authentification

export function useSocket() {
  const { user, token } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  
  // Se connecter au socket quand l'utilisateur est connecté
  useEffect(() => {
    if (!user || !token) return;
    
    const socket = socketService.connect(user.id, token);
    
    const onConnect = () => {
      setIsConnected(true);
    };
    
    const onDisconnect = () => {
      setIsConnected(false);
    };
    
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    
    // Si le socket est déjà connecté
    if (socket.connected) {
      setIsConnected(true);
    }
    
    // Nettoyage
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socketService.disconnect();
    };
  }, [user, token]);
  
  return { isConnected, socketService };
}
```

## Hook pour les notifications

Créez un hook pour gérer les notifications en temps réel :

```typescript
// src/hooks/useNotifications.ts
import { useState, useEffect, useCallback } from 'react';
import { socketService } from '@/services/socket.service';
import { Notification, UserNotification } from '@/types/notification'; // Ajuste selon tes types
import { SOKET_EVENTS } from '@/constants/events';

export function useNotifications() {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Charger les notifications initiales depuis l'API
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications');
      const data = await response.json();
      
      setNotifications(data.data);
      setUnreadCount(data.data.filter((n: UserNotification) => !n.is_read).length);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  }, []);
  
  // S'abonner aux notifications en temps réel
  useEffect(() => {
    // Chargement initial
    fetchNotifications();
    
    // Écouter les nouvelles notifications
    const unsubscribe = socketService.on(SOKET_EVENTS.notifications.new, (newUserNotification: UserNotification) => {
      setNotifications(prev => [newUserNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Notification navigateur (optionnel)
      if (Notification.permission === 'granted') {
        const { notification } = newUserNotification;
        new Notification(notification.title, {
          body: notification.message
        });
      }
    });
    
    return unsubscribe;
  }, [fetchNotifications]);
  
  // Marquer une notification comme lue
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH'
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId ? { ...n, is_read: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  }, []);
  
  // Marquer toutes les notifications comme lues
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch(`/api/notifications/read-all`, {
        method: 'PATCH'
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, is_read: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read', error);
    }
  }, []);
  
  return {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead
  };
}
```

## Composant de centre de notifications

Créez un composant pour afficher les notifications :

```tsx
// src/components/NotificationCenter.tsx
import { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BellIcon, CheckIcon } from '@heroicons/react/24/outline';

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  
  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };
  
  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
  };
  
  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };
  
  return (
    <div className="relative">
      {/* Icône de notifications avec badge */}
      <button 
        className="relative p-2 rounded-full hover:bg-gray-100" 
        onClick={toggleOpen}
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>
      
      {/* Panneau des notifications */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-20">
          <div className="p-3 bg-gray-50 flex justify-between items-center border-b">
            <h3 className="text-sm font-medium">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                className="text-xs text-blue-600 hover:underline"
                onClick={handleMarkAllAsRead}
              >
                Tout marquer comme lu
              </button>
            )}
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                Aucune notification
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {notifications.map((item) => (
                  <li 
                    key={item.id} 
                    className={`p-3 hover:bg-gray-50 transition-colors cursor-pointer ${!item.is_read ? 'bg-blue-50' : ''}`}
                    onClick={() => handleMarkAsRead(item.id)}
                  >
                    <div className="flex justify-between">
                      <p className="font-medium text-sm">{item.notification.title}</p>
                      {item.is_read ? (
                        <span className="text-xs text-gray-400">Lu</span>
                      ) : (
                        <span className="text-xs text-blue-600">Nouveau</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{item.notification.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {format(new Date(item.created_at), 'PPP à HH:mm', { locale: fr })}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

## Intégration dans le layout

Intégrez le composant de notifications dans votre layout principal :

```tsx
// src/components/Layout.tsx
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import NotificationCenter from '@/components/NotificationCenter';

export default function Layout({ children }) {
  const { user } = useAuth();
  const { isConnected } = useSocket();
  
  // Demander la permission pour les notifications navigateur
  useEffect(() => {
    if (user && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [user]);
  
  return (
    <div>
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Synkrone</h1>
          
          {user && (
            <div className="flex items-center space-x-4">
              {/* Indicateur de connexion Socket.IO */}
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-xs text-gray-500">{isConnected ? 'Connecté' : 'Déconnecté'}</span>
              </div>
              
              {/* Centre de notifications */}
              <NotificationCenter />
              
              {/* Avatar utilisateur */}
              <div className="flex items-center">
                <span className="mr-2">{user.firstname} {user.lastname}</span>
                <img 
                  src={user.photo_url || 'https://via.placeholder.com/40'} 
                  alt="Avatar" 
                  className="w-8 h-8 rounded-full"
                />
              </div>
            </div>
          )}
        </div>
      </header>
      
      <main>{children}</main>
    </div>
  );
}
```

## API Routes pour les notifications

Créez des API routes pour interagir avec le backend :

```typescript
// src/pages/api/notifications/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react'; // Adapte selon ta solution d'authentification

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getSession({ req });
    
    if (!session) {
      return res.status(401).json({ message: 'Non authentifié' });
    }
    
    const response = await fetch(`${process.env.BACKEND_URL}/api/notifications`, {
      headers: {
        'Authorization': `Bearer ${session.token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch notifications');
    }
    
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ message: 'Une erreur est survenue' });
  }
}
```

```typescript
// src/pages/api/notifications/[id]/read.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react'; // Adapte selon ta solution d'authentification

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'PATCH') {
      return res.status(405).json({ message: 'Method Not Allowed' });
    }
    
    const session = await getSession({ req });
    
    if (!session) {
      return res.status(401).json({ message: 'Non authentifié' });
    }
    
    const { id } = req.query;
    
    const response = await fetch(`${process.env.BACKEND_URL}/api/notifications/${id}/read`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${session.token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to mark notification as read');
    }
    
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({ message: 'Une erreur est survenue' });
  }
}
```

```typescript
// src/pages/api/notifications/read-all.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react'; // Adapte selon ta solution d'authentification

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'PATCH') {
      return res.status(405).json({ message: 'Method Not Allowed' });
    }
    
    const session = await getSession({ req });
    
    if (!session) {
      return res.status(401).json({ message: 'Non authentifié' });
    }
    
    const response = await fetch(`${process.env.BACKEND_URL}/api/notifications/read-all`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${session.token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to mark all notifications as read');
    }
    
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return res.status(500).json({ message: 'Une erreur est survenue' });
  }
}
```

## Types TypeScript

Définissez les types TypeScript pour les notifications :

```typescript
// src/types/notification.ts
export enum NotificationType {
  system = 'system',
  application = 'application',
  contract = 'contract',
  message = 'message',
  invitation = 'invitation'
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_global: boolean;
  link?: string;
  created_at: string;
  updated_at: string;
}

export interface UserNotification {
  id: string;
  user_id: string;
  notification_id: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  notification: Notification;
}
```

```typescript
// src/constants/events.ts
export const SOKET_EVENTS = {
  notifications: {
    new: 'notification.new',
    read: 'notification.read',
  },
  connection: {
    status: 'connection.status',
  },
};
```

## Conclusion

Cette implémentation fournit un système de notifications en temps réel complet pour votre application Next.js. Les principales fonctionnalités incluent :

- Connexion WebSocket sécurisée avec authentification
- Affichage en temps réel des nouvelles notifications
- Badge avec compteur de notifications non lues
- Marquer individuellement ou en masse les notifications comme lues
- Notifications du navigateur (avec permission)
- Indicateur de statut de connexion

Pour tester, vous pouvez utiliser le script `send-welcome-direct.ts` créé précédemment qui envoie des notifications de bienvenue à tous les utilisateurs.

Pour étendre cette fonctionnalité, vous pourriez envisager :
- Filtrer les notifications par type
- Ajouter des actions directes sur les notifications
- Inclure une page dédiée à l'historique des notifications
- Ajouter des sons ou des animations pour les nouvelles notifications