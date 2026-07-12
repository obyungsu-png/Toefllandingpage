import { WritingBuildSentenceBase, WritingBuildSentenceProps } from './WritingBuildSentenceBase';

type WritingBuildSentenceQ2Props = WritingBuildSentenceProps;

export function WritingBuildSentenceQ2(props: WritingBuildSentenceQ2Props) {
  return (
    <WritingBuildSentenceBase
      {...props}
      questionNumber={2}
      slotCount={5}
    />
  );
}
