import { WritingBuildSentenceBase, WritingBuildSentenceProps } from './WritingBuildSentenceBase';

type WritingBuildSentenceQ1Props = WritingBuildSentenceProps;

export function WritingBuildSentenceQ1(props: WritingBuildSentenceQ1Props) {
  return (
    <WritingBuildSentenceBase
      {...props}
      questionNumber={1}
      slotCount={6}
    />
  );
}
