import { ListeningM2AudioIntro } from './ListeningM2AudioIntro';

interface ListeningM2AnnouncementProps {
  onBack: () => void;
  onNext: () => void;
  onHome: () => void;
  onVolumeClick: () => void;
  audioUrl?: string;
  imageUrl?: string;
}

export function ListeningM2Announcement(props: ListeningM2AnnouncementProps) {
  return (
    <ListeningM2AudioIntro
      {...props}
      title="Listen to a conversation."
      questionRange="Questions 11-12"
    />
  );
}
