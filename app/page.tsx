import { AuthProvider } from '@/components/auth/auth-provider';
import { ChatContainer } from '@/components/chat/chat-container';

export default function HomePage() {
  return (
    <AuthProvider>
      <ChatContainer />
    </AuthProvider>
  );
}
