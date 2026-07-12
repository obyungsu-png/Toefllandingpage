import { WritingBuildSentenceBase, WritingBuildSentenceProps } from './WritingBuildSentenceBase';

type WritingBuildSentenceQ7Props = WritingBuildSentenceProps;

export function WritingBuildSentenceQ7(props: WritingBuildSentenceQ7Props) {
  return (
    <WritingBuildSentenceBase
      {...props}
      questionNumber={7}
      slotCount={4}
    />
  );
}
