import { ListeningM2QuestionScreen } from './ListeningM2QuestionScreen';

interface ListeningM2Q14Props {
  onBack: () => void;
  onNext: () => void;
  onHome: () => void;
  onVolumeClick: () => void;
  imageUrl?: string;
  audioUrl?: string;
  questionText?: string;
  options?: string[];
}

export function ListeningM2Q14({ onBack, onNext, onHome, onVolumeClick, imageUrl, questionText, options }: ListeningM2Q14Props) {
  return (
    <ListeningM2QuestionScreen
      onBack={onBack}
      onNext={onNext}
      onHome={onHome}
      onVolumeClick={onVolumeClick}
      imageUrl={imageUrl}
      questionText={questionText}
      options={options}
      questionNumber={14}
      totalQuestions={16}
      fallbackQuestion="According to the professor, what is one advantage of solar energy?"
      fallbackOptions={[
    "It is less expensive than wind energy",
    "It can be used in remote locations",
    "It does not require any maintenance",
    "It produces more energy than fossil fuels",
  ]}
    />
  );
}
