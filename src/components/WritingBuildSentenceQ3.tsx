import { WritingBuildSentenceBase, WritingBuildSentenceProps } from './WritingBuildSentenceBase';

type WritingBuildSentenceQ3Props = WritingBuildSentenceProps;

export function WritingBuildSentenceQ3(props: WritingBuildSentenceQ3Props) {
  return (
    <WritingBuildSentenceBase
      {...props}
      questionNumber={3}
      slotCount={5}
    />
  );
}
