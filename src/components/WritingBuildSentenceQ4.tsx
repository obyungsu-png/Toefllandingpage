import { WritingBuildSentenceBase, WritingBuildSentenceProps } from './WritingBuildSentenceBase';

type WritingBuildSentenceQ4Props = WritingBuildSentenceProps;

export function WritingBuildSentenceQ4(props: WritingBuildSentenceQ4Props) {
  return (
    <WritingBuildSentenceBase
      {...props}
      questionNumber={4}
      slotCount={5}
    />
  );
}
