import { WritingBuildSentenceBase, WritingBuildSentenceProps } from './WritingBuildSentenceBase';

type WritingBuildSentenceQ1Props = WritingBuildSentenceProps;

export function WritingBuildSentenceQ1(props: WritingBuildSentenceQ1Props) {
  return (
    <WritingBuildSentenceBase
      {...props}
      questionNumber={1}
      defaultQuestionText="What was the highlight of your trip?"
      defaultWords={['were', 'the', 'was', 'old city', 'showed us around', 'who', 'tour guides']}
      slotCount={6}
    />
  );
}
