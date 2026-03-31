import { WritingBuildSentenceBase, WritingBuildSentenceProps } from './WritingBuildSentenceBase';

type WritingBuildSentenceQ2Props = WritingBuildSentenceProps;

export function WritingBuildSentenceQ2(props: WritingBuildSentenceQ2Props) {
  return (
    <WritingBuildSentenceBase
      {...props}
      questionNumber={2}
      defaultQuestionText="Are you considering a change?"
      defaultWords={['a different department', 'if', 'moving to', 'know', 'do', 'you']}
      slotCount={5}
    />
  );
}
