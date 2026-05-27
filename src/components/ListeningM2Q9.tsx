import { ListeningM2QuestionScreen } from './ListeningM2QuestionScreen';

interface ListeningM2Q9Props {
  onBack: () => void;
  onNext: () => void;
  onHome: () => void;
  onVolumeClick: () => void;
  imageUrl?: string;
  audioUrl?: string;
  questionText?: string;
  options?: string[];
}

export function ListeningM2Q9({ onBack, onNext, onHome, onVolumeClick, imageUrl, questionText, options }: ListeningM2Q9Props) {
  return (
    <ListeningM2QuestionScreen
      onBack={onBack}
      onNext={onNext}
      onHome={onHome}
      onVolumeClick={onVolumeClick}
      imageUrl={imageUrl}
      questionText={questionText}
      options={options}
      questionNumber={9}
      totalQuestions={16}
      fallbackQuestion="What is the man trying to decide between?"
      fallbackOptions={[
    "A laptop and a smartphone",
    "A smartphone and a tablet",
    "A tablet and a desktop computer",
    "A smartphone and a smartwatch",
  ]}
    />
  );
}
