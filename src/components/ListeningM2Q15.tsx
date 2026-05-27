import { ListeningM2QuestionScreen } from './ListeningM2QuestionScreen';

interface ListeningM2Q15Props {
  onBack: () => void;
  onNext: () => void;
  onHome: () => void;
  onVolumeClick: () => void;
  imageUrl?: string;
  audioUrl?: string;
  questionText?: string;
  options?: string[];
}

export function ListeningM2Q15({ onBack, onNext, onHome, onVolumeClick, imageUrl, questionText, options }: ListeningM2Q15Props) {
  return (
    <ListeningM2QuestionScreen
      onBack={onBack}
      onNext={onNext}
      onHome={onHome}
      onVolumeClick={onVolumeClick}
      imageUrl={imageUrl}
      questionText={questionText}
      options={options}
      questionNumber={15}
      totalQuestions={16}
      fallbackQuestion="What does the professor imply about fossil fuels?"
      fallbackOptions={[
    "They will never be replaced",
    "They are becoming more affordable",
    "Their use is declining",
    "They are better for the environment",
  ]}
    />
  );
}
