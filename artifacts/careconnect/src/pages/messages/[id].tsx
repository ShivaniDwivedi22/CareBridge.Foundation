import { useListMessages, useSendMessage, getListMessagesQueryKey } from "@/hooks/api-hooks";
import { useUser } from "@clerk/react";
import { useParams, Link } from "wouter";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Send } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export default function MessageThread() {
  const { id } = useParams();
  const conversationId = parseInt(id ?? "0");
  const { user } = useUser();
  const [content, setContent] = useState("");
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading } = useListMessages(conversationId, {
    query: { enabled: !!conversationId, queryKey: getListMessagesQueryKey(conversationId) }
  });

  const sendMessage = useSendMessage();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!content.trim() || !user) return;
    sendMessage.mutate(
      {
        id: conversationId,
        data: {
          senderClerkId: user.id,
          senderName: user.firstName ?? user.emailAddresses[0]?.emailAddress ?? "You",
          content: content.trim(),
        },
      },
      {
        onSuccess: () => {
          setContent("");
          queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey(conversationId) });
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl flex flex-col" style={{ height: "calc(100vh - 4rem)" }}>
      <div className="flex items-center gap-4 mb-6 shrink-0">
        <Link href="/messages" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back
        </Link>
        <h1 className="font-serif text-2xl font-bold">Conversation</h1>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4 rounded-2xl bg-muted/20 p-4 border border-border/40">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-3/4" />)}
          </div>
        ) : !messages || messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            No messages yet. Say hello!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderClerkId === user?.id;
            return (
              <div key={msg.id} className={cn("flex items-end gap-2", isMe ? "flex-row-reverse" : "flex-row")}>
                {!isMe && (
                  <Avatar className="h-8 w-8 shrink-0 border border-border">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {msg.senderName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className={cn(
                  "max-w-[70%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  isMe
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-background border border-border/60 text-foreground rounded-bl-sm"
                )}>
                  {!isMe && <div className="text-xs font-medium mb-1 opacity-70">{msg.senderName}</div>}
                  {msg.content}
                  <div className={cn("text-xs mt-1 opacity-60", isMe ? "text-right" : "text-left")}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="shrink-0 flex gap-3 items-end">
        <Textarea
          placeholder="Type a message... (Enter to send)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          className="flex-1 resize-none rounded-2xl"
        />
        <Button
          onClick={handleSend}
          disabled={!content.trim() || sendMessage.isPending}
          className="rounded-full h-12 w-12 p-0 shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
