import { WritingBuildSentenceBase, WritingBuildSentenceProps } from './WritingBuildSentenceBase';

type WritingBuildSentenceQ9Props = WritingBuildSentenceProps;

export function WritingBuildSentenceQ9(props: WritingBuildSentenceQ9Props) {
  return (
    <WritingBuildSentenceBase
      {...props}
      questionNumber={9}
      defaultQuestionText="How was the training session?"
      defaultWords={['helpful', 'very', 'it', 'was', 'and', 'practical']}
      slotCount={5}
    />
  );
}
