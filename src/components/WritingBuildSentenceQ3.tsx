import { WritingBuildSentenceBase, WritingBuildSentenceProps } from './WritingBuildSentenceBase';

type WritingBuildSentenceQ3Props = WritingBuildSentenceProps;

export function WritingBuildSentenceQ3(props: WritingBuildSentenceQ3Props) {
  return (
    <WritingBuildSentenceBase
      {...props}
      questionNumber={3}
      defaultQuestionText="How do you usually spend your weekends?"
      defaultWords={['usually', 'I', 'friends', 'time with', 'spend', 'my']}
      slotCount={5}
    />
  );
}
