import { WritingBuildSentenceBase, WritingBuildSentenceProps } from './WritingBuildSentenceBase';

type WritingBuildSentenceQ10Props = WritingBuildSentenceProps;

export function WritingBuildSentenceQ10(props: WritingBuildSentenceQ10Props) {
  return (
    <WritingBuildSentenceBase
      {...props}
      questionNumber={10}
      defaultQuestionText="What did you think of the movie?"
      defaultWords={['thought', 'I', 'was', 'it', 'excellent']}
      slotCount={4}
    />
  );
}
