import { ListeningM2QuestionScreen } from './ListeningM2QuestionScreen';

interface ListeningM2Q10Props {
  onBack: () => void;
  onNext: () => void;
  onHome: () => void;
  onVolumeClick: () => void;
  imageUrl?: string;
  audioUrl?: string;
  questionText?: string;
  options?: string[];
}

export function ListeningM2Q10({ onBack, onNext, onHome, onVolumeClick, imageUrl, questionText, options }: ListeningM2Q10Props) {
  return (
    <ListeningM2QuestionScreen
      onBack={onBack}
      onNext={onNext}
      onHome={onHome}
      onVolumeClick={onVolumeClick}
      imageUrl={imageUrl}
      questionText={questionText}
      options={options}
      questionNumber={10}
      totalQuestions={16}
      fallbackQuestion="What does the woman suggest the man do?"
      fallbackOptions={[
    "Buy the cheaper option",
    "Wait for a sale",
    "Ask for a refund",
    "Try both products first",
  ]}
    />
  );
}
