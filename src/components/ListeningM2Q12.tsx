import { ListeningM2QuestionScreen } from './ListeningM2QuestionScreen';

interface ListeningM2Q12Props {
  onBack: () => void;
  onNext: () => void;
  onHome: () => void;
  onVolumeClick: () => void;
  imageUrl?: string;
  audioUrl?: string;
  questionText?: string;
  options?: string[];
}

export function ListeningM2Q12({ onBack, onNext, onHome, onVolumeClick, imageUrl, questionText, options }: ListeningM2Q12Props) {
  return (
    <ListeningM2QuestionScreen
      onBack={onBack}
      onNext={onNext}
      onHome={onHome}
      onVolumeClick={onVolumeClick}
      imageUrl={imageUrl}
      questionText={questionText}
      options={options}
      questionNumber={12}
      totalQuestions={16}
      fallbackQuestion="What is the problem?"
      fallbackOptions={[
    "He forgot what the woman wanted him to buy",
    "He forgot about the timing of their plans",
    "He forgot what they were going to eat for dinner",
    "He forgot to buy salmon and salad at the supermarket",
  ]}
    />
  );
}
