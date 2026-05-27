import { ListeningM2AudioIntro } from './ListeningM2AudioIntro';

interface ListeningM2LectureProps {
  onBack: () => void;
  onNext: () => void;
  onHome: () => void;
  onVolumeClick: () => void;
  audioUrl?: string;
  imageUrl?: string;
}

export function ListeningM2Lecture(props: ListeningM2LectureProps) {
  return (
    <ListeningM2AudioIntro
      {...props}
      title="Listen to a lecture."
      questionRange="Questions 13-16"
    />
  );
}
