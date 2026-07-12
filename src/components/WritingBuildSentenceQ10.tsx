import { WritingBuildSentenceBase, WritingBuildSentenceProps } from './WritingBuildSentenceBase';

type WritingBuildSentenceQ10Props = WritingBuildSentenceProps;

export function WritingBuildSentenceQ10(props: WritingBuildSentenceQ10Props) {
  return (
    <WritingBuildSentenceBase
      {...props}
      questionNumber={10}
      slotCount={4}
    />
  );
}
