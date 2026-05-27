import { ListeningM2QuestionScreen } from './ListeningM2QuestionScreen';

interface ListeningM2Q11Props {
  onBack: () => void;
  onNext: () => void;
  onHome: () => void;
  onVolumeClick: () => void;
  imageUrl?: string;
  audioUrl?: string;
  questionText?: string;
  options?: string[];
}

export function ListeningM2Q11({ onBack, onNext, onHome, onVolumeClick, imageUrl, questionText, options }: ListeningM2Q11Props) {
  return (
    <ListeningM2QuestionScreen
      onBack={onBack}
      onNext={onNext}
      onHome={onHome}
      onVolumeClick={onVolumeClick}
      imageUrl={imageUrl}
      questionText={questionText}
      options={options}
      questionNumber={11}
      totalQuestions={16}
      fallbackQuestion="What does the woman want to do this evening?"
      fallbackOptions={[
    "See a play",
    "Change her clothes",
    "Go shopping",
    "Eat dinner",
  ]}
    />
  );
}
