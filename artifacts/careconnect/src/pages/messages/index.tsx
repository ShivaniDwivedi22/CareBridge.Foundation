import { useListConversations, getListConversationsQueryKey } from "@/hooks/api-hooks";
import { useUser } from "@clerk/react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";

export default function MessagesPage() {
  const { user } = useUser();
  const clerkUserId = user?.id ?? "";

  const { data: conversations, isLoading } = useListConversations(
    { clerkUserId },
    { query: { enabled: !!clerkUserId, queryKey: getListConversationsQueryKey({ clerkUserId }) } }
  );

  const getOtherParticipant = (convo: NonNullable<typeof conversations>[number]) => {
    if (!user) return { name: "Unknown", clerkId: "" };
    if (convo.participantAClerkId === clerkUserId) {
      return { name: convo.participantBName, clerkId: convo.participantBClerkId };
    }
    return { name: convo.participantAName, clerkId: convo.participantAClerkId };
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="mb-8">
        <h1 className="font-serif text-4xl font-bold mb-2">Messages</h1>
        <p className="text-muted-foreground">Stay in touch with your caregivers and families.</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : !conversations || conversations.length === 0 ? (
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-16 text-center">
            <MessageCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No messages yet</h3>
            <p className="text-muted-foreground text-sm">
              Start a conversation by contacting a caregiver from their profile.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {conversations.map((convo, i) => {
            const other = getOtherParticipant(convo);
            return (
              <motion.div
                key={convo.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/messages/${convo.id}`}>
                  <Card className="border-border/50 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-primary/30">
                    <CardContent className="p-5 flex items-center gap-4">
                      <Avatar className="h-12 w-12 border border-border">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {other.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-foreground mb-0.5">{other.name}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {convo.lastMessage ?? "No messages yet"}
                        </div>
                      </div>
                      {convo.lastMessageAt && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                          <Clock className="w-3 h-3" />
                          {new Date(convo.lastMessageAt).toLocaleDateString()}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
