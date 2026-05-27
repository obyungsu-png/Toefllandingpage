import { ListeningM2QuestionScreen } from './ListeningM2QuestionScreen';

interface ListeningM2Q13Props {
  onBack: () => void;
  onNext: () => void;
  onHome: () => void;
  onVolumeClick: () => void;
  imageUrl?: string;
  audioUrl?: string;
  questionText?: string;
  options?: string[];
}

export function ListeningM2Q13({ onBack, onNext, onHome, onVolumeClick, imageUrl, questionText, options }: ListeningM2Q13Props) {
  return (
    <ListeningM2QuestionScreen
      onBack={onBack}
      onNext={onNext}
      onHome={onHome}
      onVolumeClick={onVolumeClick}
      imageUrl={imageUrl}
      questionText={questionText}
      options={options}
      questionNumber={13}
      totalQuestions={16}
      fallbackQuestion="What is the lecture mainly about?"
      fallbackOptions=[
    "Types of renewable energy",
    "The history of solar power",
    "How wind turbines work",
    "Energy storage solutions"
  ]
    />
  );
}
