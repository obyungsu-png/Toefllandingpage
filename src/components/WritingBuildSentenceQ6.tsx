import { WritingBuildSentenceBase, WritingBuildSentenceProps } from './WritingBuildSentenceBase';

type WritingBuildSentenceQ6Props = WritingBuildSentenceProps;

export function WritingBuildSentenceQ6(props: WritingBuildSentenceQ6Props) {
  return (
    <WritingBuildSentenceBase
      {...props}
      questionNumber={6}
      slotCount={4}
    />
  );
}
