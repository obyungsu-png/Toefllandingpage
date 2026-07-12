import { WritingBuildSentenceBase, WritingBuildSentenceProps } from './WritingBuildSentenceBase';

type WritingBuildSentenceQ5Props = WritingBuildSentenceProps;

export function WritingBuildSentenceQ5(props: WritingBuildSentenceQ5Props) {
  return (
    <WritingBuildSentenceBase
      {...props}
      questionNumber={5}
      slotCount={4}
    />
  );
}
