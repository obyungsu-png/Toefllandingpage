import { WritingBuildSentenceBase, WritingBuildSentenceProps } from './WritingBuildSentenceBase';

type WritingBuildSentenceQ4Props = WritingBuildSentenceProps;

export function WritingBuildSentenceQ4(props: WritingBuildSentenceQ4Props) {
  return (
    <WritingBuildSentenceBase
      {...props}
      questionNumber={4}
      defaultQuestionText="What are your plans for the summer?"
      defaultWords={['to', 'planning', "I'm", 'Europe', 'travel', 'around']}
      slotCount={5}
    />
  );
}
