import { ListeningM2AudioIntro } from './ListeningM2AudioIntro';

interface ListeningM2ConversationProps {
  onBack: () => void;
  onNext: () => void;
  onHome: () => void;
  onVolumeClick: () => void;
  audioUrl?: string;
  imageUrl?: string;
}

export function ListeningM2Conversation(props: ListeningM2ConversationProps) {
  return (
    <ListeningM2AudioIntro
      {...props}
      title="Listen to a conversation."
      questionRange="Questions 9-10"
    />
  );
}
