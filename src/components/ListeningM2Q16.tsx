import { ListeningM2QuestionScreen } from './ListeningM2QuestionScreen';

interface ListeningM2Q16Props {
  onBack: () => void;
  onNext: () => void;
  onHome: () => void;
  onVolumeClick: () => void;
  imageUrl?: string;
  audioUrl?: string;
  questionText?: string;
  options?: string[];
}

export function ListeningM2Q16({ onBack, onNext, onHome, onVolumeClick, imageUrl, questionText, options }: ListeningM2Q16Props) {
  return (
    <ListeningM2QuestionScreen
      onBack={onBack}
      onNext={onNext}
      onHome={onHome}
      onVolumeClick={onVolumeClick}
      imageUrl={imageUrl}
      questionText={questionText}
      options={options}
      questionNumber={16}
      totalQuestions={16}
      fallbackQuestion="Why does the professor mention tidal energy?"
      fallbackOptions=[
    "To compare it to solar energy",
    "To explain why it is not widely used",
    "As an example of a predictable energy source",
    "To show that it is the most efficient energy type"
  ]
    />
  );
}
